"use client";

import type { ReviewSuggestion } from "@reviselab/core";

import { AILabel, AILabelActions, AILabelContent } from "../carbon";
import { formatUiDateTime } from "../format";

type ReviewAILabelProps = {
  explainability: NonNullable<ReviewSuggestion["explainability"]>;
  restoreActive?: boolean;
  showModelDetails?: boolean;
  onRestore?: () => void;
};

export function ReviewAILabel({
  explainability,
  restoreActive = false,
  showModelDetails = false,
  onRestore,
}: ReviewAILabelProps) {
  return (
    <AILabel
      aiTextLabel="AI"
      textLabel="AI-generated suggestion"
      kind="inline"
      {...(onRestore
        ? {
            revertActive: restoreActive,
            revertLabel: "Restore AI suggestion",
            onRevertClick: onRestore,
          }
        : {})}
    >
      <AILabelContent>
        <p>{explainability.summary}</p>
        <p className="rl-muted">
          Inputs: {explainability.inputScope.join(", ")}.
          {showModelDetails
            ? ` Provider: ${explainability.provider}. Model: ${explainability.model}.`
            : ""}
        </p>
      </AILabelContent>
      <AILabelActions>
        <span className="rl-muted">
          Generated {formatUiDateTime(explainability.generatedAt)}
        </span>
      </AILabelActions>
    </AILabel>
  );
}
