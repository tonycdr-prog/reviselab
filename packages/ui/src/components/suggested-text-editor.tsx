"use client";

import { useEffect, useState } from "react";

import type { ReviewSuggestion } from "@reviselab/core";

import {
  AILabel,
  AILabelActions,
  AILabelContent,
  Button,
  InlineNotification,
  TextArea,
  Tile,
} from "../carbon";
import { formatUiDateTime } from "../format";

type SuggestedTextEditorProps = {
  suggestion: ReviewSuggestion;
  isPending?: boolean;
  error?: string | null;
  onDraftChange?: (editedText: string) => void;
  onApply?: (editedText: string) => void;
  onReject?: () => void;
  onResolve?: () => void;
  onRestore?: () => void;
};

export function SuggestedTextEditor({
  suggestion,
  isPending = false,
  error = null,
  onDraftChange,
  onApply,
  onReject,
  onResolve,
  onRestore,
}: SuggestedTextEditorProps) {
  const [draft, setDraft] = useState(
    suggestion.editedText ?? suggestion.suggestedText,
  );

  useEffect(() => {
    setDraft(suggestion.editedText ?? suggestion.suggestedText);
  }, [suggestion.editedText, suggestion.id, suggestion.suggestedText]);

  const isDirty = draft !== (suggestion.editedText ?? suggestion.suggestedText);
  const explainability = suggestion.explainability;
  const canRestoreAiSuggestion =
    suggestion.origin === "ai" &&
    (isDirty || typeof suggestion.editedText === "string");

  function handleDraftChange(nextDraft: string) {
    setDraft(nextDraft);
    onDraftChange?.(nextDraft);
  }

  return (
    <Tile className="rl-suggestion-editor">
      <div className="rl-section-header">
        <div>
          <h4>{suggestion.title}</h4>
          <p className="rl-muted">{suggestion.rationale}</p>
        </div>

        {suggestion.origin === "ai" && explainability ? (
          <AILabel
            aiTextLabel="AI"
            textLabel="AI-generated suggestion"
            revertActive={canRestoreAiSuggestion}
            revertLabel="Restore AI suggestion"
            onRevertClick={() => {
              handleDraftChange(suggestion.suggestedText);
              if (suggestion.status === "edited" || suggestion.editedText) {
                onRestore?.();
              }
            }}
            kind="inline"
          >
            <AILabelContent>
              <p>{explainability.summary}</p>
              <p className="rl-muted">
                Inputs: {explainability.inputScope.join(", ")}. Provider:{" "}
                {explainability.provider}. Model: {explainability.model}.
              </p>
            </AILabelContent>
            <AILabelActions>
              <span className="rl-muted">
                Generated {formatUiDateTime(explainability.generatedAt)}
              </span>
            </AILabelActions>
          </AILabel>
        ) : null}
      </div>

      <div className="rl-code-grid">
        <div>
          <p className="rl-muted">Original</p>
          <pre className="rl-mono">
            {suggestion.originalText || "No original text provided."}
          </pre>
        </div>
        <div>
          <TextArea
            id={suggestion.id}
            labelText="Suggested revision"
            value={draft}
            rows={8}
            onChange={(event) => handleDraftChange(event.currentTarget.value)}
          />
        </div>
      </div>

      {error ? (
        <InlineNotification
          lowContrast
          hideCloseButton
          kind="error"
          title="Suggestion update failed"
          subtitle={error}
        />
      ) : null}

      <div className="rl-toolbar">
        {isDirty ? (
          <span className="rl-muted">Manual edits pending.</span>
        ) : null}

        <Button
          kind="primary"
          type="button"
          disabled={isPending}
          onClick={() => onApply?.(draft)}
        >
          {isDirty ? "Save edited suggestion" : "Apply suggestion"}
        </Button>
        <Button
          kind="secondary"
          type="button"
          disabled={isPending}
          onClick={() => onReject?.()}
        >
          Reject
        </Button>
        <Button
          kind="tertiary"
          type="button"
          disabled={isPending}
          onClick={() => onResolve?.()}
        >
          Mark resolved
        </Button>
      </div>
    </Tile>
  );
}
