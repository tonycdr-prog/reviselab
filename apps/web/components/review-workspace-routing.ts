import type { ReviewCheck, ReviewFile, ReviewSnapshot } from "@reviselab/core";

const VALID_TABS = new Set([
  "overview",
  "checks",
  "files",
  "comments",
  "history",
]);

export function getDefaultFilePath(review: ReviewSnapshot) {
  const unresolvedFile =
    review.files.find(
      (file) => file.status !== "resolved" && file.status !== "unchanged",
    ) ?? review.files[0];

  return unresolvedFile?.path ?? "title.md";
}

export function getCheckTarget(review: ReviewSnapshot, check: ReviewCheck) {
  const suggestion = review.suggestions.find((candidate) =>
    check.linkedSuggestionIds.includes(candidate.id),
  );

  return {
    filePath:
      check.reviewFilePath ??
      suggestion?.filePath ??
      getDefaultFilePath(review),
    anchorId: check.anchorId ?? suggestion?.anchor.id ?? null,
  };
}

export function getSelectedTab(searchParams: URLSearchParams) {
  const nextTab = searchParams.get("tab");
  return VALID_TABS.has(nextTab ?? "")
    ? (nextTab as NonNullable<typeof nextTab>)
    : "overview";
}

export function getSelectedFilePath(
  review: ReviewSnapshot,
  searchParams: URLSearchParams,
) {
  const requested = searchParams.get("file");
  const defaultPath = getDefaultFilePath(review);

  if (!requested) {
    return defaultPath;
  }

  return review.files.some((file) => file.path === requested)
    ? (requested as ReviewFile["path"])
    : defaultPath;
}

export function getSelectedContext(searchParams: URLSearchParams) {
  const value = searchParams.get("context");

  if (value?.startsWith("check:")) {
    return {
      type: "check" as const,
      id: value.slice("check:".length),
    };
  }

  if (value?.startsWith("comment:")) {
    return {
      type: "comment" as const,
      id: value.slice("comment:".length),
    };
  }

  return null;
}

export function updateReviewParams(
  pathname: string,
  current: URLSearchParams,
  next: Record<string, string | null>,
) {
  const params = new URLSearchParams(current.toString());

  for (const [key, value] of Object.entries(next)) {
    if (!value) {
      params.delete(key);
      continue;
    }

    params.set(key, value);
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
