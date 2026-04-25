"use client";

import { useMemo } from "react";
import { diffCleanupSemantic, diffMain } from "diff-match-patch-es";

type InlineDiffPreviewProps = {
  originalText: string;
  nextText: string;
};

export function InlineDiffPreview({
  originalText,
  nextText,
}: InlineDiffPreviewProps) {
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
