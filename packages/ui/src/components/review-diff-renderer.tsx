"use client";

import { useEffect, useMemo, useRef } from "react";
import { diffCleanupSemantic, diffMain } from "diff-match-patch-es";
import {
  Decoration,
  Diff,
  Hunk,
  parseDiff,
  type HunkData,
} from "react-diff-view";

import { Button, Tag, Tile } from "../carbon";
import type {
  DiffRendererAdapterProps,
  DiffSurfaceAdapterProps,
} from "./review-diff-shared";
import { getSeverityTagType, getStatusTagType } from "./review-diff-shared";

function buildPatchText(
  suggestion: DiffRendererAdapterProps["suggestion"],
  originalText: string,
  nextText: string,
) {
  const originalLines = originalText.split(/\r?\n/);
  const nextLines = nextText.split(/\r?\n/);
  const originalCount = Math.max(originalLines.length, 1);
  const nextCount = Math.max(nextLines.length, 1);

  return [
    `diff --git a/${suggestion.filePath} b/${suggestion.filePath}`,
    `--- a/${suggestion.filePath}`,
    `+++ b/${suggestion.filePath}`,
    suggestion.anchor.hunkHeader ||
      `@@ -${suggestion.anchor.oldStartLine},${originalCount} +${suggestion.anchor.startLine},${nextCount} @@`,
    ...originalLines.map((line) => `-${line}`),
    ...nextLines.map((line) => `+${line}`),
    "",
  ].join("\n");
}

function InlineDiffPreview({
  originalText,
  nextText,
}: {
  originalText: string;
  nextText: string;
}) {
  const diffs = useMemo(() => {
    const tokens = diffMain(originalText, nextText);
    diffCleanupSemantic(tokens);
    return tokens;
  }, [nextText, originalText]);

  return (
    <div className="rl-inline-diff">
      <p className="rl-inline-diff-label">Changed spans</p>
      <div className="rl-inline-diff-grid">
        <div>
          {diffs.map(([operation, text], index) => (
            <span
              key={`old_${index}_${text}`}
              className={
                operation === -1
                  ? "rl-inline-diff-delete"
                  : operation === 0
                    ? "rl-inline-diff-equal"
                    : "rl-inline-diff-hidden"
              }
            >
              {operation === 1 ? "" : text}
            </span>
          ))}
        </div>
        <div>
          {diffs.map(([operation, text], index) => (
            <span
              key={`new_${index}_${text}`}
              className={
                operation === 1
                  ? "rl-inline-diff-insert"
                  : operation === 0
                    ? "rl-inline-diff-equal"
                    : "rl-inline-diff-hidden"
              }
            >
              {operation === -1 ? "" : text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DiffRendererAdapter({
  suggestion,
  viewType,
  isHighlighted,
  onSelect,
}: DiffRendererAdapterProps) {
  const tileRef = useRef<HTMLDivElement | null>(null);
  const nextText = suggestion.editedText ?? suggestion.suggestedText;
  const parsed = useMemo(() => {
    const diffText = buildPatchText(
      suggestion,
      suggestion.originalText,
      nextText,
    );
    return parseDiff(diffText, {
      nearbySequences: "zip",
    })[0];
  }, [nextText, suggestion]);

  const hunks = parsed?.hunks ?? [];

  useEffect(() => {
    if (!isHighlighted || !tileRef.current) {
      return;
    }

    if (typeof tileRef.current.scrollIntoView === "function") {
      tileRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }

    if (typeof tileRef.current.focus === "function") {
      tileRef.current.focus({
        preventScroll: true,
      });
    }
  }, [isHighlighted]);

  return (
    <Tile
      id={suggestion.anchor.id}
      ref={tileRef}
      tabIndex={-1}
      className={
        isHighlighted
          ? "rl-diff-block rl-diff-block-highlighted"
          : "rl-diff-block"
      }
    >
      <div className="rl-section-header">
        <div>
          <h4>{suggestion.title}</h4>
          <p className="rl-muted">{suggestion.rationale}</p>
        </div>
        <div className="rl-toolbar">
          <Tag type={getSeverityTagType(suggestion.severity)}>
            {suggestion.severity}
          </Tag>
          <Tag type={getStatusTagType(suggestion.status)}>
            {suggestion.status}
          </Tag>
        </div>
      </div>

      <div className="rl-diff-meta">
        <span className="rl-muted">
          +{suggestion.diffStats.additions} / -{suggestion.diffStats.deletions}{" "}
          / {suggestion.diffStats.changedLines} changed lines
        </span>
        <Button
          kind="ghost"
          size="sm"
          type="button"
          onClick={() => onSelect(suggestion.anchor.id)}
        >
          Focus context
        </Button>
      </div>

      {hunks.length > 0 ? (
        <div className="rl-diff-renderer">
          <Diff
            diffType={parsed?.type ?? "modify"}
            hunks={hunks}
            viewType={viewType}
            optimizeSelection
          >
            {(renderedHunks: HunkData[]) =>
              renderedHunks.flatMap((hunk, index) => [
                <Decoration key={`decoration_${suggestion.id}_${index}`}>
                  <div className="rl-hunk-decoration">
                    <strong>{suggestion.anchor.label}</strong>
                    <span className="rl-muted">{hunk.content}</span>
                  </div>
                </Decoration>,
                <Hunk key={`hunk_${suggestion.id}_${index}`} hunk={hunk} />,
              ])
            }
          </Diff>
        </div>
      ) : (
        <Tile className="rl-empty-state">
          <p className="rl-muted">
            No diff hunks were generated for this suggestion.
          </p>
        </Tile>
      )}

      <InlineDiffPreview
        originalText={suggestion.originalText}
        nextText={nextText}
      />
    </Tile>
  );
}

export function DiffSurfaceAdapter({
  file,
  suggestions,
  selectedAnchorId,
  viewType,
  onSelectSuggestion,
}: DiffSurfaceAdapterProps) {
  if (suggestions.length === 0) {
    return (
      <Tile className="rl-empty-state">
        <p className="rl-muted">
          No recommended changes were generated for this file.
        </p>
      </Tile>
    );
  }

  return (
    <div className="rl-diff-surface-stack">
      {suggestions.map((suggestion) => (
        <DiffRendererAdapter
          key={suggestion.id}
          suggestion={suggestion}
          viewType={viewType}
          isHighlighted={suggestion.anchor.id === selectedAnchorId}
          onSelect={onSelectSuggestion}
        />
      ))}
    </div>
  );
}
