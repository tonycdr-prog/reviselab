"use client";

import { Link, Tag, Tile } from "../carbon";
import { formatUiDateTime } from "../format";
import type { ReviewContextPanelProps } from "./review-diff-shared";
import { getSeverityTagType, getStatusTagType } from "./review-diff-shared";
import { SuggestedTextEditor } from "./suggested-text-editor";

function getReadinessImpact(severity: "blocker" | "warning" | "info") {
  if (severity === "blocker") {
    return "Blocks readiness until resolved.";
  }

  if (severity === "warning") {
    return "Keeps the review in Ready with revisions unless a blocker exists.";
  }

  return "Informational; does not reduce readiness.";
}

export function ReviewContextPanel({
  file,
  activeSuggestion,
  selectedContext,
  events,
  isPending,
  actionError,
  onDraftChange,
  onApply,
  onReject,
  onResolve,
  onRestore,
}: ReviewContextPanelProps) {
  return (
    <aside className="rl-context-panel" aria-label="Review context inspector">
      <Tile className="rl-section">
        <h3>Selected file</h3>
        <p className="rl-muted">{file.path}</p>
        <div className="rl-toolbar">
          <Tag type={getStatusTagType(file.status)}>{file.status}</Tag>
          <Tag type={getSeverityTagType(file.severity)}>{file.severity}</Tag>
        </div>
        <p className="rl-muted">
          {file.changeCount} change{file.changeCount === 1 ? "" : "s"} across{" "}
          {file.diffStats.changedLines} changed line
          {file.diffStats.changedLines === 1 ? "" : "s"}.
        </p>
      </Tile>

      {selectedContext ? (
        <Tile className="rl-section">
          <div className="rl-section-header">
            <h3>
              {selectedContext.type === "check"
                ? "Linked check"
                : "Linked comment"}
            </h3>
            <Tag type={getSeverityTagType(selectedContext.item.severity)}>
              {selectedContext.item.severity}
            </Tag>
          </div>
          <p>
            {selectedContext.type === "check"
              ? selectedContext.item.summary
              : selectedContext.item.body}
          </p>
          <p className="rl-muted">
            {selectedContext.type === "check"
              ? selectedContext.item.detail
              : selectedContext.item.target}
          </p>
          {selectedContext.type === "check" ? (
            <dl className="rl-rule-meta">
              <div>
                <dt>Rule</dt>
                <dd>
                  {selectedContext.item.ruleId} ·{" "}
                  {selectedContext.item.ruleVersion}
                </dd>
              </div>
              <div>
                <dt>Source checked</dt>
                <dd>{selectedContext.item.sourceCheckedAt}</dd>
              </div>
              <div>
                <dt>Readiness impact</dt>
                <dd>{getReadinessImpact(selectedContext.item.severity)}</dd>
              </div>
            </dl>
          ) : null}
          {selectedContext.type === "check" ||
          selectedContext.item.sourceUrl ? (
            <Link
              href={
                selectedContext.type === "check"
                  ? selectedContext.item.sourceUrl
                  : selectedContext.item.sourceUrl!
              }
              target="_blank"
              rel="noreferrer"
            >
              Open policy source
            </Link>
          ) : null}
          {selectedContext.type === "check" &&
          (selectedContext.item.evidence?.length ?? 0) > 0 ? (
            <>
              <h4>Why this was flagged</h4>
              <ul className="rl-summary-list">
                {selectedContext.item.evidence.map((evidence) => (
                  <li key={`${evidence.label}_${evidence.value}`}>
                    <strong>{evidence.label}</strong>
                    <p className="rl-muted">{evidence.value}</p>
                    {evidence.sourceUrl ? (
                      <Link
                        href={evidence.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Evidence source
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </Tile>
      ) : null}

      {activeSuggestion ? (
        <SuggestedTextEditor
          suggestion={activeSuggestion}
          isPending={isPending}
          error={actionError ?? null}
          {...(onDraftChange ? { onDraftChange } : {})}
          onApply={(editedText) => onApply(activeSuggestion, editedText)}
          onReject={() => onReject(activeSuggestion)}
          onResolve={() => onResolve(activeSuggestion)}
          onRestore={() => onRestore(activeSuggestion)}
        />
      ) : (
        <Tile className="rl-empty-state">
          <p className="rl-muted">
            Select a diff block to inspect the linked suggestion and action
            controls.
          </p>
        </Tile>
      )}

      {activeSuggestion?.explainability ? (
        <Tile className="rl-section">
          <h3>Explainability</h3>
          <p>{activeSuggestion.explainability.summary}</p>
          <p className="rl-muted">
            Generated{" "}
            {formatUiDateTime(activeSuggestion.explainability.generatedAt)}.
            Inputs: {activeSuggestion.explainability.inputScope.join(", ")}.
          </p>
        </Tile>
      ) : null}

      <Tile className="rl-section">
        <h3>Activity</h3>
        {events.length === 0 ? (
          <p className="rl-muted">
            No lifecycle or suggestion activity is available for this selection
            yet.
          </p>
        ) : (
          <ul className="rl-summary-list">
            {events.slice(0, 6).map((event) => (
              <li key={event.id}>
                <strong>{event.label}</strong>
                {event.detail ? (
                  <p className="rl-muted">{event.detail}</p>
                ) : null}
                <p className="rl-muted">{formatUiDateTime(event.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </Tile>
    </aside>
  );
}
