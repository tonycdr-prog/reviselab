import { assert, wait } from "./local-stack-lib.mjs";
import {
  deleteSource,
  makeLatexZip,
  makePdf,
  uploadSource,
} from "./smoke-review-fixtures.mjs";

export async function createSmokeReview(sql, env, sourceKind) {
  const ownerId = crypto.randomUUID();
  const workspaceId = `workspace_smoke_${crypto.randomUUID()}`;
  const paperId = `paper_smoke_${crypto.randomUUID()}`;
  const versionId = `version_smoke_${crypto.randomUUID()}`;
  const reviewId = `review_smoke_${crypto.randomUUID()}`;
  const fileName = sourceKind === "pdf" ? "smoke.pdf" : "main.zip";
  const sourcePath = `${workspaceId}/${paperId}/${versionId}/${fileName}`;
  const title = "A Novel Benchmark for Retrieval-Augmented Review Assistants";
  const abstract =
    "We propose a groundbreaking retrieval augmented review assistant for scientific writing. The benchmark compares category fit, tone calibration, and policy-aware revision suggestions across realistic abstract editing tasks.";

  await uploadSource(
    env,
    sourcePath,
    sourceKind === "pdf" ? makePdf() : makeLatexZip(),
    sourceKind === "pdf" ? "application/pdf" : "application/zip",
  );

  await sql.begin(async (tx) => {
    await tx`insert into public.profiles (id, display_name) values (${ownerId}, 'Hosted smoke reviewer')`;
    await tx`insert into public.workspaces (id, name, owner_user_id) values (${workspaceId}, 'Hosted smoke workspace', ${ownerId})`;
    await tx`insert into public.workspace_members (workspace_id, user_id, role) values (${workspaceId}, ${ownerId}, 'owner')`;
    await tx`
      insert into public.papers (
        id, workspace_id, owner_user_id, title, intended_category,
        paper_type, first_time_submitter
      )
      values (${paperId}, ${workspaceId}, ${ownerId}, ${title}, 'cs.AI', 'research', true)
    `;
    await tx`
      insert into public.paper_versions (
        id, paper_id, source_kind, source_path, source_file_name,
        parse_status, extracted_structure_json
      )
      values (
        ${versionId}, ${paperId}, ${sourceKind}, ${sourcePath}, ${fileName},
        'queued', ${JSON.stringify({
          title,
          abstract,
          intendedCategory: "cs.AI",
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
          title,
          abstract,
          intendedCategory: "cs.AI",
          paperType: "research",
          firstTimeSubmitter: true,
        })}::jsonb,
        'smoke'
      )
    `;
    await tx`
      insert into public.review_events (id, review_id, event_kind, label, detail)
      values (${`event_${crypto.randomUUID()}`}, ${reviewId}, 'review_queued', 'Review queued', 'Hosted smoke review queued.')
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

export async function waitForOutcome(sql, reviewId, timeoutMs) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const rows = await sql`
      select
        reviews.status,
        reviews.readiness,
        reviews.failed_reason,
        paper_versions.parse_status,
        paper_versions.parse_error
      from public.reviews
      join public.paper_versions on paper_versions.id = reviews.paper_version_id
      where reviews.id = ${reviewId}
    `;
    const row = rows[0];

    if (row?.status === "ready" || row?.status === "failed") {
      return row;
    }

    await wait(2000);
  }

  throw new Error(
    "Timed out waiting for the worker to finish the smoke review.",
  );
}

export async function assertReadyReview(sql, reviewId) {
  const [files, checks, comments, suggestions, events] = await Promise.all([
    sql`select count(*)::int as count from public.review_files where review_id = ${reviewId}`,
    sql`select count(*)::int as count from public.review_checks where review_id = ${reviewId}`,
    sql`select count(*)::int as count from public.review_comments where review_id = ${reviewId}`,
    sql`select id from public.review_suggestions where review_id = ${reviewId} limit 1`,
    sql`select count(*)::int as count from public.review_events where review_id = ${reviewId}`,
  ]);

  assert(files[0].count >= 4, "Expected canonical review files to persist.");
  assert(checks[0].count > 0, "Expected review checks to persist.");
  assert(comments[0].count > 0, "Expected review comments to persist.");
  assert(suggestions.length > 0, "Expected review suggestions to persist.");
  assert(events[0].count > 0, "Expected review events to persist.");
}

export async function cleanupSmokeReview(sql, env, smokeReview) {
  await deleteSource(env, smokeReview.sourcePath);

  await sql.begin(async (tx) => {
    await tx`delete from public.papers where id = ${smokeReview.paperId}`;
    await tx`delete from public.workspace_members where workspace_id = ${smokeReview.workspaceId}`;
    await tx`delete from public.workspaces where id = ${smokeReview.workspaceId}`;
    await tx`delete from public.profiles where id = ${smokeReview.ownerId}`;
  });
}
