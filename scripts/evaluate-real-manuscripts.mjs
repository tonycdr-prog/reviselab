import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { spawnSync } from "node:child_process";

import { readLocalWebEnv, ROOT, wait } from "./local-stack-lib.mjs";
import {
  cleanupSmokeReview,
  waitForOutcome,
} from "./smoke-review-database.mjs";
import { uploadSource } from "./smoke-review-fixtures.mjs";

const REAL_MANUSCRIPTS = [
  {
    arxivId: "1706.03762",
    title: "Attention Is All You Need",
    category: "cs.CL",
  },
  {
    arxivId: "1810.04805",
    title: "BERT: Pre-training of Deep Bidirectional Transformers",
    category: "cs.CL",
  },
  {
    arxivId: "2005.14165",
    title: "Language Models are Few-Shot Learners",
    category: "cs.CL",
  },
  {
    arxivId: "2010.11929",
    title: "An Image is Worth 16x16 Words",
    category: "cs.CV",
  },
  {
    arxivId: "2103.00020",
    title: "Learning Transferable Visual Models From Natural Language",
    category: "cs.CV",
  },
  {
    arxivId: "2106.09685",
    title: "LoRA: Low-Rank Adaptation of Large Language Models",
    category: "cs.CL",
  },
  {
    arxivId: "2006.11239",
    title: "Denoising Diffusion Probabilistic Models",
    category: "cs.LG",
  },
  {
    arxivId: "2112.10752",
    title: "High-Resolution Image Synthesis with Latent Diffusion Models",
    category: "cs.CV",
  },
  {
    arxivId: "2201.11903",
    title: "Chain-of-Thought Prompting Elicits Reasoning",
    category: "cs.CL",
  },
  {
    arxivId: "2305.14314",
    title: "QLoRA: Efficient Finetuning of Quantized LLMs",
    category: "cs.LG",
  },
];

const args = process.argv.slice(2);
const limit = Number(
  args.find((arg) => arg.startsWith("--limit="))?.split("=")[1] ??
    REAL_MANUSCRIPTS.length,
);
const keep = args.includes("--keep");
const allowFailures = args.includes("--allow-failures");
const downloadOnly = args.includes("--download-only");
const manuscriptDir = path.join(ROOT, ".local-manuscripts", "real");
const reportPath = path.join(
  ROOT,
  ".local-runtime",
  "real-manuscript-report.json",
);

function realPdfName(arxivId) {
  return `arxiv-${arxivId.replace(".", "-")}.pdf`;
}

async function fileExists(filePath) {
  try {
    const fileStat = await stat(filePath);
    return fileStat.size > 0;
  } catch {
    return false;
  }
}

async function downloadPdf(candidate) {
  await mkdir(manuscriptDir, { recursive: true });

  const filePath = path.join(manuscriptDir, realPdfName(candidate.arxivId));

  if (await fileExists(filePath)) {
    return filePath;
  }

  const response = await fetch(
    `https://arxiv.org/pdf/${candidate.arxivId}.pdf`,
    {
      headers: {
        "user-agent":
          "ReviseLab local QA (https://github.com/tonycdr-prog/reviselab)",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Unable to download arXiv:${candidate.arxivId} (${response.status}).`,
    );
  }

  await writeFile(filePath, Buffer.from(await response.arrayBuffer()));
  await wait(1000);

  return filePath;
}

async function createRealReview(sql, env, candidate, pdfPath) {
  const ownerId = crypto.randomUUID();
  const workspaceId = `workspace_real_${crypto.randomUUID()}`;
  const paperId = `paper_real_${crypto.randomUUID()}`;
  const versionId = `version_real_${crypto.randomUUID()}`;
  const reviewId = `review_real_${crypto.randomUUID()}`;
  const fileName = realPdfName(candidate.arxivId);
  const sourcePath = `${workspaceId}/${paperId}/${versionId}/${fileName}`;

  await uploadSource(
    env,
    sourcePath,
    await readFile(pdfPath),
    "application/pdf",
  );

  await sql.begin(async (tx) => {
    await tx`
      insert into public.profiles (id, display_name)
      values (${ownerId}, 'Real manuscript QA')
    `;
    await tx`
      insert into public.workspaces (id, name, owner_user_id)
      values (${workspaceId}, 'Real manuscript QA workspace', ${ownerId})
    `;
    await tx`
      insert into public.workspace_members (workspace_id, user_id, role)
      values (${workspaceId}, ${ownerId}, 'owner')
    `;
    await tx`
      insert into public.papers (
        id, workspace_id, owner_user_id, title, intended_category,
        paper_type, first_time_submitter
      )
      values (
        ${paperId}, ${workspaceId}, ${ownerId}, ${candidate.title},
        ${candidate.category}, 'research', false
      )
    `;
    await tx`
      insert into public.paper_versions (
        id, paper_id, source_kind, source_path, source_file_name,
        parse_status, extracted_structure_json
      )
      values (
        ${versionId}, ${paperId}, 'pdf', ${sourcePath}, ${fileName},
        'queued', ${JSON.stringify({
          title: candidate.title,
          intendedCategory: candidate.category,
          arxivId: candidate.arxivId,
        })}::jsonb
      )
    `;
    await tx`
      insert into public.reviews (
        id, paper_id, paper_version_id, status, context_json, engine_version
      )
      values (
        ${reviewId}, ${paperId}, ${versionId}, 'queued',
        ${JSON.stringify({
          paperId,
          versionId,
          title: candidate.title,
          abstract: "",
          intendedCategory: candidate.category,
          paperType: "research",
          firstTimeSubmitter: false,
          comments: `Real arXiv QA candidate ${candidate.arxivId}.`,
        })}::jsonb,
        'real-manuscript-qa'
      )
    `;
    await tx`
      insert into public.review_events (id, review_id, event_kind, label, detail)
      values (
        ${`event_${crypto.randomUUID()}`}, ${reviewId}, 'review_queued',
        'Review queued', ${`Real arXiv QA candidate ${candidate.arxivId}.`}
      )
    `;
    await tx`
      select pgmq.send(
        'parse_paper'::text,
        ${JSON.stringify({
          paperId,
          versionId,
          workspaceId,
          ownerUserId: ownerId,
        })}::jsonb
      )
    `;
  });

  return { ownerId, workspaceId, paperId, versionId, reviewId, sourcePath };
}

async function summarizeReview(sql, reviewId) {
  const [checks, files, comments, suggestions] = await Promise.all([
    sql`
      select rule_id, state, severity
      from public.review_checks
      where review_id = ${reviewId}
      order by rule_id
    `,
    sql`
      select path, change_count, status, severity
      from public.review_files
      where review_id = ${reviewId}
      order by path
    `,
    sql`
      select count(*)::int as count
      from public.review_comments
      where review_id = ${reviewId}
    `,
    sql`
      select count(*)::int as count
      from public.review_suggestions
      where review_id = ${reviewId}
    `,
  ]);

  return {
    checks,
    files,
    commentCount: comments[0]?.count ?? 0,
    suggestionCount: suggestions[0]?.count ?? 0,
  };
}

async function main() {
  const stackCheck = spawnSync("node", ["./scripts/check-local-stack.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });

  if (stackCheck.status !== 0) {
    throw new Error("Local stack check failed.");
  }

  const selected = REAL_MANUSCRIPTS.slice(0, limit);
  const downloaded = [];

  for (const candidate of selected) {
    const pdfPath = await downloadPdf(candidate);
    downloaded.push({ ...candidate, filePath: pdfPath });
    console.log(`Prepared arXiv:${candidate.arxivId}`);
  }

  if (downloadOnly) {
    return;
  }

  const env = readLocalWebEnv();
  const sql = postgres(env.DATABASE_URL, {
    max: 1,
    prepare: false,
  });
  const results = [];

  try {
    for (const candidate of downloaded) {
      let created = null;

      try {
        created = await createRealReview(
          sql,
          env,
          candidate,
          candidate.filePath,
        );
        const outcome = await waitForOutcome(sql, created.reviewId, 300_000);
        const summary = await summarizeReview(sql, created.reviewId);

        results.push({
          arxivId: candidate.arxivId,
          title: candidate.title,
          status: outcome.status,
          readiness: outcome.readiness,
          parseStatus: outcome.parse_status,
          failedReason: outcome.failed_reason ?? outcome.parse_error ?? null,
          checks: summary.checks,
          files: summary.files,
          commentCount: summary.commentCount,
          suggestionCount: summary.suggestionCount,
        });

        console.log(
          `Evaluated arXiv:${candidate.arxivId} -> ${outcome.status} / ${outcome.readiness ?? outcome.parse_status}`,
        );
      } catch (error) {
        results.push({
          arxivId: candidate.arxivId,
          title: candidate.title,
          status: "failed",
          readiness: null,
          failedReason:
            error instanceof Error
              ? error.message
              : "Unknown evaluation error.",
        });
        console.error(
          `Evaluation failed for arXiv:${candidate.arxivId}: ${
            error instanceof Error ? error.message : "unknown error"
          }`,
        );
      } finally {
        if (created && !keep) {
          await cleanupSmokeReview(sql, env, created);
        }
      }
    }
  } finally {
    await sql.end({ timeout: 2 });
  }

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(
    reportPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        count: results.length,
        results,
      },
      null,
      2,
    )}\n`,
  );

  const failureCount = results.filter(
    (result) => result.status !== "ready",
  ).length;

  console.log(`Real manuscript report: ${reportPath}`);

  if (failureCount > 0 && !allowFailures) {
    throw new Error(`${failureCount} real manuscript evaluation(s) failed.`);
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Real manuscript evaluation failed.",
  );
  process.exitCode = 1;
});
