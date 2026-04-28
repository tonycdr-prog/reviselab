"use client";

import { useEffect, useMemo, useState } from "react";

import { Tile } from "../carbon";
import { ReviewContextPanel } from "./review-context-panel";
import { DiffSurfaceAdapter } from "./review-diff-renderer";
import {
  getSuggestionSaveAction,
  type ReviewDiffSurfaceProps,
} from "./review-diff-shared";
import { ReviewFileRail } from "./review-file-rail";
import type { ReviewFile } from "@reviselab/core";

const CARBON_LG_MAX_MEDIA_QUERY = "(max-width: 1055px)";

export function ReviewDiffSurface({
  review,
  selectedFilePath,
  selectedAnchorId,
  selectedContext,
  isPending = false,
  actionError = null,
  onSelectFile,
  onSelectSuggestion,
  onSuggestionAction,
}: ReviewDiffSurfaceProps) {
  const [viewType, setViewType] = useState<"split" | "unified">("split");
  const [activeDraft, setActiveDraft] = useState<string | null>(null);
  const selectedFile =
    review.files.find((file) => file.path === selectedFilePath) ??
    review.files[0] ??
    null;

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(CARBON_LG_MAX_MEDIA_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setViewType(event.matches ? "unified" : "split");
    };

    setViewType(mediaQuery.matches ? "unified" : "split");
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);
  const fileSuggestions = selectedFile
    ? review.suggestions.filter(
        (suggestion) => suggestion.filePath === selectedFile.path,
      )
    : [];
  const selectedAnchorSuggestion = selectedAnchorId
    ? fileSuggestions.find(
        (suggestion) => suggestion.anchor.id === selectedAnchorId,
      )
    : undefined;
  const activeSuggestion = selectedAnchorId
    ? (selectedAnchorSuggestion ?? null)
    : (fileSuggestions[0] ?? null);

  useEffect(() => {
    if (!activeSuggestion) {
      setActiveDraft(null);
      return;
    }

    setActiveDraft(
      activeSuggestion.editedText ?? activeSuggestion.suggestedText,
    );
  }, [
    activeSuggestion?.editedText,
    activeSuggestion?.id,
    activeSuggestion?.suggestedText,
  ]);

  const unresolvedCountByPath = useMemo(() => {
    const counts: Partial<Record<ReviewFile["path"], number>> = {};

    for (const suggestion of review.suggestions) {
      if (suggestion.status !== "suggested" && suggestion.status !== "edited") {
        continue;
      }

      counts[suggestion.filePath] = (counts[suggestion.filePath] ?? 0) + 1;
    }

    return counts;
  }, [review.suggestions]);

  const relevantEvents = useMemo(() => {
    if (!selectedFile) {
      return review.history.filter(
        (event) => !event.filePath && !event.suggestionId,
      );
    }

    return review.history.filter((event) => {
      if (activeSuggestion?.id && event.suggestionId === activeSuggestion.id) {
        return true;
      }

      if (event.filePath === selectedFile.path) {
        return true;
      }

      return !event.filePath && !event.suggestionId;
    });
  }, [activeSuggestion?.id, review.history, selectedFile]);

  if (!selectedFile) {
    return (
      <Tile className="rl-empty-state">
        <p className="rl-muted">
          No file diffs have been generated for this review yet.
        </p>
      </Tile>
    );
  }

  return (
    <div className="rl-diff-workspace">
      <ReviewFileRail
        files={review.files}
        selectedFilePath={selectedFile.path}
        unresolvedCountByPath={unresolvedCountByPath}
        onSelectFile={onSelectFile}
      />

      <div className="rl-diff-main">
        <Tile className="rl-section rl-diff-surface">
          <DiffSurfaceAdapter
            file={selectedFile}
            suggestions={fileSuggestions}
            selectedAnchorId={selectedAnchorId ?? null}
            viewType={viewType}
            onSelectSuggestion={onSelectSuggestion}
          />
        </Tile>
      </div>

      <ReviewContextPanel
        file={selectedFile}
        activeSuggestion={activeSuggestion}
        selectedContext={selectedContext}
        events={relevantEvents}
        isPending={isPending}
        actionError={actionError}
        onDraftChange={setActiveDraft}
        onApply={(suggestion, editedText) =>
          onSuggestionAction(
            suggestion.id,
            getSuggestionSaveAction(suggestion, editedText),
            editedText,
          )
        }
        onReject={(suggestion) => onSuggestionAction(suggestion.id, "reject")}
        onResolve={(suggestion) => onSuggestionAction(suggestion.id, "resolve")}
        onRestore={(suggestion) => onSuggestionAction(suggestion.id, "restore")}
      />
    </div>
  );
}
