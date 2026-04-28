"use client";

import { useEffect, useRef, useState } from "react";

import type { ReviewSuggestion } from "@reviselab/core";

import {
  Button,
  InlineLoading,
  InlineNotification,
  TextArea,
  Tile,
} from "../carbon";
import { ReviewAILabel } from "./review-ai-label";

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
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const [draft, setDraft] = useState(
    suggestion.editedText ?? suggestion.suggestedText,
  );

  useEffect(() => {
    setDraft(suggestion.editedText ?? suggestion.suggestedText);
  }, [suggestion.editedText, suggestion.id, suggestion.suggestedText]);

  const isDirty = draft !== (suggestion.editedText ?? suggestion.suggestedText);
  const explainability = suggestion.explainability;
  const originalText = suggestion.originalText || "No original text provided.";
  const isTerminalStatus =
    suggestion.status === "accepted" ||
    suggestion.status === "rejected" ||
    suggestion.status === "resolved";
  const canRestoreSuggestion =
    isTerminalStatus ||
    isDirty ||
    suggestion.status === "edited" ||
    typeof suggestion.editedText === "string";
  const restoreLabel =
    suggestion.origin === "ai" ? "Restore AI suggestion" : "Restore suggestion";
  const restoreUnavailableLabel =
    suggestion.origin === "ai" ? "Restore AI suggestion" : "Restore suggestion";
  const terminalStatusMessage =
    suggestion.status === "accepted"
      ? "Suggestion accepted. Restore it to reopen review actions."
      : suggestion.status === "rejected"
        ? "Suggestion rejected. Restore it to review this change again."
        : "Suggestion resolved. Restore it to review this change again.";

  function handleDraftChange(nextDraft: string) {
    setDraft(nextDraft);
    onDraftChange?.(nextDraft);
  }

  function handleRestoreSuggestion() {
    handleDraftChange(suggestion.suggestedText);
    if (
      isTerminalStatus ||
      suggestion.status === "edited" ||
      typeof suggestion.editedText === "string"
    ) {
      onRestore?.();
    }
  }

  return (
    <Tile className="rl-suggestion-editor">
      <div className="rl-section-header">
        <div>
          <h4>{suggestion.title}</h4>
          <p className="rl-muted">{suggestion.rationale}</p>
        </div>

        {suggestion.origin === "ai" &&
        explainability &&
        !canRestoreSuggestion ? (
          <ReviewAILabel explainability={explainability} showModelDetails />
        ) : null}
      </div>

      <div className="rl-suggestion-actions" aria-label="Suggestion actions">
        {isPending ? (
          <InlineLoading description="Updating suggestion" status="active" />
        ) : null}
        {isTerminalStatus ? (
          <>
            <span className="rl-muted">{terminalStatusMessage}</span>
            <Button
              kind="ghost"
              size="sm"
              type="button"
              disabled={isPending}
              onClick={handleRestoreSuggestion}
            >
              {restoreLabel}
            </Button>
          </>
        ) : (
          <>
            {isDirty ? (
              <span className="rl-muted">Manual edits pending.</span>
            ) : null}

            <Button
              kind="primary"
              size="sm"
              type="button"
              disabled={isPending}
              onClick={() => onApply?.(draft)}
            >
              {isDirty ? "Save edited suggestion" : "Apply suggestion"}
            </Button>
            <Button
              kind="secondary"
              size="sm"
              type="button"
              disabled={isPending}
              onClick={() => onReject?.()}
            >
              Reject
            </Button>
            <Button
              kind="tertiary"
              size="sm"
              type="button"
              disabled={isPending}
              onClick={() => textAreaRef.current?.focus()}
            >
              Edit suggestion
            </Button>
            <Button
              kind="tertiary"
              size="sm"
              type="button"
              disabled={isPending}
              onClick={() => onResolve?.()}
            >
              Mark resolved
            </Button>
            {canRestoreSuggestion ? (
              <Button
                kind="ghost"
                size="sm"
                type="button"
                disabled={isPending}
                onClick={handleRestoreSuggestion}
              >
                {restoreLabel}
              </Button>
            ) : (
              <Button
                kind="ghost"
                size="sm"
                type="button"
                disabled
                title="Restore is available after editing or taking an action."
              >
                {restoreUnavailableLabel}
              </Button>
            )}
          </>
        )}
      </div>

      <div className="rl-code-grid">
        <div>
          <p className="rl-muted">Original</p>
          <pre className="rl-mono">{originalText}</pre>
        </div>
        <div>
          <TextArea
            id={suggestion.id}
            ref={textAreaRef}
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
    </Tile>
  );
}
