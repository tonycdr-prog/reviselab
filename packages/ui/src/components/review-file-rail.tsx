"use client";

import { useRef, type KeyboardEvent } from "react";

import { getSeverityTagType, getStatusTagType } from "./review-diff-shared";
import { Tag } from "../carbon";
import type { ReviewFileRailProps } from "./review-diff-shared";

export function ReviewFileRail({
  files,
  selectedFilePath,
  unresolvedCountByPath,
  onSelectFile,
}: ReviewFileRailProps) {
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function focusAndSelect(path: ReviewFileRailProps["selectedFilePath"]) {
    buttonRefs.current[path]?.focus();
    onSelectFile(path);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();

    const currentIndex = Number(event.currentTarget.dataset.index ?? "-1");
    const fallbackIndex = Math.max(
      files.findIndex((file) => file.path === selectedFilePath),
      0,
    );
    const activeIndex = currentIndex >= 0 ? currentIndex : fallbackIndex;

    if (event.key === "Home") {
      const nextPath = files[0]?.path ?? selectedFilePath;
      focusAndSelect(nextPath);
      return;
    }

    if (event.key === "End") {
      const nextPath = files.at(-1)?.path ?? selectedFilePath;
      focusAndSelect(nextPath);
      return;
    }

    const direction = event.key === "ArrowDown" ? 1 : -1;
    const nextFile = files[activeIndex + direction];
    if (nextFile) {
      focusAndSelect(nextFile.path);
    }
  }

  return (
    <aside className="rl-file-rail" aria-label="Files changed">
      <div className="rl-file-rail-header">
        <h3>Files changed</h3>
        <p className="rl-muted">
          Select a file to inspect the recommended diff and linked policy
          context.
        </p>
      </div>

      <div
        className="rl-file-rail-list"
        role="listbox"
        aria-label="Review files changed"
      >
        {files.map((file, index) => (
          <button
            key={file.id}
            type="button"
            role="option"
            aria-selected={file.path === selectedFilePath}
            data-index={index}
            tabIndex={file.path === selectedFilePath ? 0 : -1}
            ref={(node) => {
              buttonRefs.current[file.path] = node;
            }}
            className={
              file.path === selectedFilePath
                ? "rl-file-rail-item rl-file-rail-item-selected"
                : "rl-file-rail-item"
            }
            onClick={() => focusAndSelect(file.path)}
            onKeyDown={handleKeyDown}
          >
            <div className="rl-file-rail-row">
              <strong>{file.path}</strong>
              <Tag type={getStatusTagType(file.status)}>{file.status}</Tag>
            </div>
            <div className="rl-file-rail-row">
              <span className="rl-muted">
                {file.changeCount} change{file.changeCount === 1 ? "" : "s"}
              </span>
              <Tag type={getSeverityTagType(file.severity)}>
                {file.severity}
              </Tag>
            </div>
            <div className="rl-file-rail-row">
              <span className="rl-muted">
                {unresolvedCountByPath[file.path] ?? 0} unresolved
              </span>
              <span className="rl-muted">
                {file.diffStats.changedLines} changed line
                {file.diffStats.changedLines === 1 ? "" : "s"}
              </span>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
