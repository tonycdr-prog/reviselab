import { assert, wait } from "./local-stack-lib.mjs";
import {
  deleteArtifact,
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
  const [files, checks, comments, suggestions, events, lifecycleEvents] =
    await Promise.all([
      sql`
        select path, change_count, status, severity
        from public.review_files
        where review_id = ${reviewId}
        order by path
      `,
      sql`
        select rule_id, rule_version, source_url, source_checked_at, evidence_json
        from public.review_checks
        where review_id = ${reviewId}
      `,
      sql`select count(*)::int as count from public.review_comments where review_id = ${reviewId}`,
      sql`
        select id, review_file_id, status, anchor_json, diff_stats_json
        from public.review_suggestions
        where review_id = ${reviewId}
        limit 1
      `,
      sql`select count(*)::int as count from public.review_events where review_id = ${reviewId}`,
      sql`
        select event_kind
        from public.review_events
        where review_id = ${reviewId}
          and event_kind in ('parse_completed', 'review_completed')
      `,
    ]);

  const filePaths = new Set(files.map((file) => file.path));

  assert(filePaths.has("title.md"), "Expected title.md to persist.");
  assert(filePaths.has("abstract.md"), "Expected abstract.md to persist.");
  assert(filePaths.has("metadata.yml"), "Expected metadata.yml to persist.");
  assert(
    filePaths.has("submission_notes.md"),
    "Expected submission_notes.md to persist.",
  );
  assert(checks.length > 0, "Expected review checks to persist.");
  assert(
    checks.every(
      (check) =>
        check.rule_id &&
        check.rule_version &&
        check.source_url &&
        check.source_checked_at &&
        Array.isArray(check.evidence_json),
    ),
    "Expected source-backed deterministic check evidence to persist.",
  );
  assert(comments[0].count > 0, "Expected review comments to persist.");
  assert(suggestions.length > 0, "Expected review suggestions to persist.");
  assert(
    suggestions.every(
      (suggestion) =>
        suggestion.review_file_id &&
        suggestion.anchor_json &&
        suggestion.diff_stats_json,
    ),
    "Expected suggestions to include durable file, anchor, and diff metadata.",
  );
  assert(events[0].count > 0, "Expected review events to persist.");
  assert(
    lifecycleEvents.some((event) => event.event_kind === "parse_completed"),
    "Expected parse completion event to persist.",
  );
  assert(
    lifecycleEvents.some((event) => event.event_kind === "review_completed"),
    "Expected review completion event to persist.",
  );
}

export async function cleanupSmokeReview(sql, env, smokeReview) {
  const versions = await sql`
    select parse_artifact_path
    from public.paper_versions
    where id = ${smokeReview.versionId}
  `;
  const artifactPath = versions[0]?.parse_artifact_path;

  await deleteSource(env, smokeReview.sourcePath);
  if (artifactPath) {
    await deleteArtifact(env, artifactPath);
  }

  await sql.begin(async (tx) => {
    await tx`delete from public.papers where id = ${smokeReview.paperId}`;
    await tx`delete from public.workspace_members where workspace_id = ${smokeReview.workspaceId}`;
    await tx`delete from public.workspaces where id = ${smokeReview.workspaceId}`;
    await tx`delete from public.profiles where id = ${smokeReview.ownerId}`;
  });
}
