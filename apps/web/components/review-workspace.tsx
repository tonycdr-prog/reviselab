"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type {
  ReviewCheck,
  ReviewComment,
  ReviewFile,
  ReviewSnapshot,
  SuggestionAction,
} from "@reviselab/core";
import { ReviewWorkspaceRecipe } from "@reviselab/ui";

const VALID_TABS = new Set([
  "overview",
  "checks",
  "files",
  "comments",
  "history",
]);

function getDefaultFilePath(review: ReviewSnapshot) {
  const unresolvedFile =
    review.files.find(
      (file) => file.status !== "resolved" && file.status !== "unchanged",
    ) ?? review.files[0];

  return unresolvedFile?.path ?? "title.md";
}

function getCheckTarget(review: ReviewSnapshot, check: ReviewCheck) {
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

function updateReviewParams(
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

export function ReviewWorkspace({
  initialReview,
}: {
  initialReview: ReviewSnapshot;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [review, setReview] = useState(initialReview);
  const [isMutatingSuggestion, setIsMutatingSuggestion] = useState(false);
  const [isRetryingReview, setIsRetryingReview] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectedTab = useMemo(() => {
    const nextTab = searchParams.get("tab");
    return VALID_TABS.has(nextTab ?? "")
      ? (nextTab as NonNullable<typeof nextTab>)
      : "overview";
  }, [searchParams]);

  const selectedFilePath = useMemo(() => {
    const requested = searchParams.get("file");
    const defaultPath = getDefaultFilePath(review);

    if (!requested) {
      return defaultPath;
    }

    return review.files.some((file) => file.path === requested)
      ? (requested as ReviewFile["path"])
      : defaultPath;
  }, [review, searchParams]);

  const selectedAnchorId = searchParams.get("anchor");
  const selectedContextValue = searchParams.get("context");
  const selectedContext = selectedContextValue?.startsWith("check:")
    ? {
        type: "check" as const,
        id: selectedContextValue.slice("check:".length),
      }
    : selectedContextValue?.startsWith("comment:")
      ? {
          type: "comment" as const,
          id: selectedContextValue.slice("comment:".length),
        }
      : null;

  function replaceParams(next: Record<string, string | null>) {
    setActionError(null);
    startTransition(() => {
      router.replace(
        updateReviewParams(pathname, searchParams, next) as never,
        {
          scroll: false,
        },
      );
    });
  }

  function handleSelectCheck(check: ReviewCheck) {
    const target = getCheckTarget(review, check);
    replaceParams({
      tab: "files",
      file: target.filePath,
      anchor: target.anchorId,
      context: `check:${check.id}`,
    });
  }

  function handleSelectComment(comment: ReviewComment) {
    replaceParams({
      tab: "files",
      file: comment.filePath,
      anchor: comment.anchorId,
      context: `comment:${comment.id}`,
    });
  }

  async function handleSuggestionAction(
    suggestionId: string,
    action: SuggestionAction,
    editedText?: string,
  ) {
    setIsMutatingSuggestion(true);
    setActionError(null);

    try {
      const response = await fetch(
        `/api/reviews/${review.id}/suggestions/${suggestionId}/actions`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            action,
            editedText,
          }),
        },
      );

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Suggestion update failed.");
      }

      const updatedReview = (await response.json()) as ReviewSnapshot | null;
      if (updatedReview) {
        setReview(updatedReview);
      }
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Suggestion update failed.",
      );
    } finally {
      setIsMutatingSuggestion(false);
    }
  }

  useEffect(() => {
    if (review.status === "ready" || isMutatingSuggestion || isRetryingReview) {
      return undefined;
    }

    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/reviews/${review.id}`, {
          method: "GET",
        });

        if (!response.ok) {
          return;
        }

        const latestReview = (await response.json()) as ReviewSnapshot | null;

        if (latestReview) {
          setReview(latestReview);
        }
      } catch {
        // Ignore polling failures and let the next interval try again.
      }
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [isMutatingSuggestion, isRetryingReview, review.id, review.status]);

  async function handleRetryReview() {
    setIsRetryingReview(true);
    setActionError(null);

    try {
      const response = await fetch(`/api/reviews/${review.id}/retry`, {
        method: "POST",
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Unable to retry review.");
      }

      const nextReview = (await response.json()) as ReviewSnapshot | null;

      if (nextReview) {
        setReview(nextReview);
      }
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to retry review.",
      );
    } finally {
      setIsRetryingReview(false);
    }
  }

  return (
    <ReviewWorkspaceRecipe
      review={review}
      selectedTab={selectedTab as never}
      selectedFilePath={selectedFilePath}
      selectedAnchorId={selectedAnchorId}
      selectedContext={selectedContext}
      isMutatingSuggestion={isMutatingSuggestion}
      isRetryingReview={isRetryingReview}
      actionError={actionError}
      onRetryReview={handleRetryReview}
      onSelectTab={(tab) =>
        replaceParams({
          tab,
          ...(tab === "files"
            ? { file: selectedFilePath }
            : { file: null, anchor: null, context: null }),
        })
      }
      onSelectFile={(path) =>
        replaceParams({
          tab: "files",
          file: path,
          anchor: null,
          context: null,
        })
      }
      onSelectAnchor={(anchorId) =>
        replaceParams({
          tab: "files",
          file: selectedFilePath,
          anchor: anchorId,
          context: null,
        })
      }
      onSelectCheck={handleSelectCheck}
      onSelectComment={handleSelectComment}
      onSuggestionAction={handleSuggestionAction}
    />
  );
}
