"use client";

import { startTransition, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type {
  ReviewCheck,
  ReviewComment,
  ReviewSnapshot,
} from "@reviselab/core";
import { ReviewWorkspaceRecipe } from "@reviselab/ui";

import {
  getCheckTarget,
  getSelectedContext,
  getSelectedFilePath,
  getSelectedTab,
  updateReviewParams,
} from "../../../components/review-workspace-routing";

export function PreviewReviewWorkspace({ review }: { review: ReviewSnapshot }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedTab = useMemo(
    () => getSelectedTab(searchParams),
    [searchParams],
  );
  const selectedFilePath = useMemo(
    () => getSelectedFilePath(review, searchParams),
    [review, searchParams],
  );
  const selectedAnchorId = searchParams.get("anchor");
  const selectedContext = getSelectedContext(searchParams);

  function replaceParams(next: Record<string, string | null>) {
    startTransition(() => {
      router.replace(
        updateReviewParams(pathname, searchParams, next) as never,
        { scroll: false },
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

  return (
    <ReviewWorkspaceRecipe
      review={review}
      selectedTab={selectedTab as never}
      selectedFilePath={selectedFilePath}
      selectedAnchorId={selectedAnchorId}
      selectedContext={selectedContext}
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
    />
  );
}
