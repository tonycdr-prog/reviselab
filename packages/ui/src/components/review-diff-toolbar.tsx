"use client";

import { Button, InlineLoading } from "../carbon";
import type { ReviewDiffToolbarProps } from "./review-diff-shared";

export function ReviewDiffToolbar({
  file,
  activeSuggestion,
  editedText,
  isPending,
  onApply,
  onReject,
  onResolve,
  onRestore,
}: ReviewDiffToolbarProps) {
  return (
    <div className="rl-diff-toolbar">
      <div>
        <h3>{file.title}</h3>
        <p className="rl-muted">
          {activeSuggestion
            ? activeSuggestion.rationale
            : "No active suggestion is selected for this file."}
        </p>
        {isPending ? (
          <InlineLoading
            description="Updating the selected suggestion"
            status="active"
          />
        ) : null}
      </div>

      {activeSuggestion ? (
        <div className="rl-toolbar">
          <Button
            type="button"
            disabled={isPending}
            onClick={() =>
              onApply(
                activeSuggestion,
                editedText ??
                  activeSuggestion.editedText ??
                  activeSuggestion.suggestedText,
              )
            }
          >
            Apply suggestion
          </Button>
          <Button
            kind="secondary"
            type="button"
            disabled={isPending}
            onClick={() => onReject(activeSuggestion)}
          >
            Reject
          </Button>
          <Button
            kind="tertiary"
            type="button"
            disabled={isPending}
            onClick={() => onResolve(activeSuggestion)}
          >
            Mark resolved
          </Button>
          {activeSuggestion.origin === "ai" ? (
            <Button
              kind="ghost"
              type="button"
              disabled={isPending}
              onClick={() => onRestore(activeSuggestion)}
            >
              Restore AI suggestion
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
