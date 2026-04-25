"use client";

import { useEffect, useState } from "react";

import type { ReviewFile, ReviewSnapshot } from "@reviselab/core";

import {
  Column,
  Grid,
  Layer,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "../carbon";
import {
  ChecksPanel,
  CommentsPanel,
  FilesChangedPanel,
  HistoryPanel,
  OverviewPanel,
  ReviewHeader,
  ReviewSidebar,
} from "./review-workspace-panels";
import { ReviewWorkspaceProgress } from "./review-workspace-progress";
import type {
  ReviewWorkspaceRecipeProps,
  SelectedReviewContext,
} from "./review-workspace-recipe-types";
import {
  getSelectedTabIndex,
  REVIEW_WORKSPACE_TAB_ORDER,
  type ReviewWorkspaceTab,
} from "./review-workspace-tabs";

export function ReviewWorkspaceRecipe({
  review,
  selectedTab = "overview",
  selectedFilePath,
  selectedAnchorId,
  selectedContext = null,
  isMutatingSuggestion = false,
  isRetryingReview = false,
  actionError = null,
  onRetryReview = () => undefined,
  onSelectTab = () => undefined,
  onSelectFile = () => undefined,
  onSelectAnchor = () => undefined,
  onSelectCheck = () => undefined,
  onSelectComment = () => undefined,
  onSuggestionAction = () => undefined,
}: ReviewWorkspaceRecipeProps) {
  const [activeTab, setActiveTab] = useState<ReviewWorkspaceTab>(selectedTab);
  const [activeFilePath, setActiveFilePath] = useState<
    ReviewFile["path"] | undefined
  >(selectedFilePath);
  const [activeAnchorId, setActiveAnchorId] = useState<string | null>(
    selectedAnchorId ?? null,
  );
  const [activeContext, setActiveContext] = useState<SelectedReviewContext>(
    selectedContext ?? null,
  );
  const resolvedSelectedFilePath =
    activeFilePath ??
    review.files.find((file) => file.status !== "resolved")?.path ??
    review.files[0]?.path ??
    "title.md";
  const isFilesWorkbench = activeTab === "files";

  useEffect(() => {
    setActiveTab(selectedTab);
  }, [selectedTab]);

  useEffect(() => {
    if (selectedFilePath) {
      setActiveFilePath(selectedFilePath);
    }
  }, [selectedFilePath]);

  useEffect(() => {
    setActiveAnchorId(selectedAnchorId ?? null);
  }, [selectedAnchorId]);

  useEffect(() => {
    setActiveContext(selectedContext ?? null);
  }, [selectedContext]);

  function handleSelectTab(selectedIndex: number) {
    const nextTab = REVIEW_WORKSPACE_TAB_ORDER[selectedIndex] ?? "overview";

    setActiveTab(nextTab);
    onSelectTab(nextTab);
  }

  function handleSelectFile(path: ReviewFile["path"]) {
    setActiveFilePath(path);
    setActiveAnchorId(null);
    setActiveContext(null);
    onSelectFile(path);
  }

  function handleSelectAnchor(anchorId: string) {
    setActiveAnchorId(anchorId);
    onSelectAnchor(anchorId);
  }

  function handleSelectCheck(check: ReviewSnapshot["checks"][number]) {
    setActiveTab("files");
    if (check.reviewFilePath) {
      setActiveFilePath(check.reviewFilePath);
    }
    setActiveAnchorId(check.anchorId ?? null);
    setActiveContext({ type: "check", id: check.id });
    onSelectTab("files");
    onSelectCheck(check);
  }

  function handleSelectComment(comment: ReviewSnapshot["comments"][number]) {
    setActiveTab("files");
    setActiveFilePath(comment.filePath);
    setActiveAnchorId(comment.anchorId);
    setActiveContext({ type: "comment", id: comment.id });
    onSelectTab("files");
    onSelectComment(comment);
  }

  if (review.status !== "ready") {
    return (
      <ReviewWorkspaceProgress
        review={review}
        isRetryingReview={isRetryingReview}
        actionError={actionError}
        onRetryReview={onRetryReview}
      />
    );
  }

  return (
    <Grid fullWidth className="rl-page-grid">
      <Column sm={4} md={8} lg={16}>
        <div
          className={
            isFilesWorkbench
              ? "rl-review-grid rl-review-grid-workbench"
              : "rl-review-grid"
          }
          data-review-workspace="canonical"
        >
          <div className="rl-review-main">
            <ReviewHeader review={review} />

            <Layer>
              <Tabs
                selectedIndex={getSelectedTabIndex(activeTab)}
                onChange={({ selectedIndex }) => handleSelectTab(selectedIndex)}
              >
                <TabList aria-label="Review workspace sections" contained>
                  <Tab>Overview</Tab>
                  <Tab>Checks</Tab>
                  <Tab>Files changed</Tab>
                  <Tab>Comments</Tab>
                  <Tab>History</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
                    <OverviewPanel review={review} />
                  </TabPanel>
                  <TabPanel>
                    <ChecksPanel
                      review={review}
                      onSelectCheck={handleSelectCheck}
                    />
                  </TabPanel>
                  <TabPanel>
                    <FilesChangedPanel
                      review={review}
                      selectedFilePath={resolvedSelectedFilePath}
                      selectedAnchorId={activeAnchorId}
                      selectedContext={activeContext}
                      isMutatingSuggestion={isMutatingSuggestion}
                      actionError={actionError ?? null}
                      onSelectFile={handleSelectFile}
                      onSelectAnchor={handleSelectAnchor}
                      onSuggestionAction={onSuggestionAction}
                    />
                  </TabPanel>
                  <TabPanel>
                    <CommentsPanel
                      review={review}
                      onSelectComment={handleSelectComment}
                    />
                  </TabPanel>
                  <TabPanel>
                    <HistoryPanel review={review} />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Layer>
          </div>

          {isFilesWorkbench ? null : <ReviewSidebar review={review} />}
        </div>
      </Column>
    </Grid>
  );
}
