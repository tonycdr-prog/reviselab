"use client";

import {
  type ReviewFile,
  type ReviewSnapshot,
  type SuggestionAction,
} from "@reviselab/core";

import {
  Button,
  Column,
  DataTableSkeleton,
  Grid,
  InlineNotification,
  InlineLoading,
  Layer,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tile,
} from "../carbon";
import { ReviewStageTag } from "./review-stage-tag";
import {
  ChecksPanel,
  CommentsPanel,
  FilesChangedPanel,
  HistoryPanel,
  OverviewPanel,
  ReviewHeader,
  ReviewSidebar,
  type ReviewWorkspaceTab,
} from "./review-workspace-panels";

type ReviewWorkspaceRecipeProps = {
  review: ReviewSnapshot;
  selectedTab?: ReviewWorkspaceTab;
  selectedFilePath?: ReviewFile["path"];
  selectedAnchorId?: string | null;
  selectedContext?:
    | {
        type: "check";
        id: string;
      }
    | {
        type: "comment";
        id: string;
      }
    | null;
  isMutatingSuggestion?: boolean;
  isRetryingReview?: boolean;
  actionError?: string | null;
  onRetryReview?: () => void;
  onSelectTab?: (tab: ReviewWorkspaceTab) => void;
  onSelectFile?: (path: ReviewFile["path"]) => void;
  onSelectAnchor?: (anchorId: string) => void;
  onSelectCheck?: (check: ReviewSnapshot["checks"][number]) => void;
  onSelectComment?: (comment: ReviewSnapshot["comments"][number]) => void;
  onSuggestionAction?: (
    suggestionId: string,
    action: SuggestionAction,
    editedText?: string,
  ) => void;
};

const TAB_ORDER: ReviewWorkspaceTab[] = [
  "overview",
  "checks",
  "files",
  "comments",
  "history",
];

function getSelectedTabIndex(tab: ReviewWorkspaceTab) {
  const index = TAB_ORDER.indexOf(tab);
  return index >= 0 ? index : 0;
}

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
  const resolvedSelectedFilePath =
    selectedFilePath ??
    review.files.find((file) => file.status !== "resolved")?.path ??
    review.files[0]?.path ??
    "title.md";

  if (review.status !== "ready") {
    return (
      <Grid fullWidth className="rl-page-grid">
        <Column sm={4} md={8} lg={16}>
          <Tile className="rl-section" data-review-workspace="canonical">
            <div className="rl-section-header">
              <div>
                <h3>{review.progress.label}</h3>
                <p className="rl-muted">{review.progress.description}</p>
              </div>
              <ReviewStageTag progress={review.progress} />
            </div>
            {review.progress.stage === "failed-parse" ||
            review.progress.stage === "failed-review" ? (
              <InlineNotification
                lowContrast
                kind="error"
                title={review.progress.label}
                subtitle={
                  actionError ?? review.progress.error ?? review.overview
                }
              />
            ) : (
              <InlineLoading
                description={
                  isRetryingReview
                    ? "Retrying this review"
                    : review.progress.description
                }
                status="active"
              />
            )}
            <DataTableSkeleton
              columnCount={4}
              rowCount={4}
              showHeader={false}
              headers={[
                { key: "event", header: "Event" },
                { key: "detail", header: "Detail" },
                { key: "file", header: "File" },
                { key: "created", header: "Created" },
              ]}
            />
            {review.progress.canRetry ? (
              <div className="rl-toolbar">
                <Button
                  type="button"
                  kind="secondary"
                  disabled={isRetryingReview}
                  onClick={onRetryReview}
                >
                  Retry review
                </Button>
              </div>
            ) : null}
          </Tile>
        </Column>
      </Grid>
    );
  }

  return (
    <Grid fullWidth className="rl-page-grid">
      <Column sm={4} md={8} lg={16}>
        <div className="rl-review-grid" data-review-workspace="canonical">
          <div className="rl-review-main">
            <ReviewHeader review={review} />

            <Layer>
              <Tabs
                selectedIndex={getSelectedTabIndex(selectedTab)}
                onChange={({ selectedIndex }) =>
                  onSelectTab(TAB_ORDER[selectedIndex] ?? "overview")
                }
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
                      onSelectCheck={onSelectCheck}
                    />
                  </TabPanel>
                  <TabPanel>
                    <FilesChangedPanel
                      review={review}
                      selectedFilePath={resolvedSelectedFilePath}
                      selectedAnchorId={selectedAnchorId ?? null}
                      selectedContext={selectedContext}
                      isMutatingSuggestion={isMutatingSuggestion}
                      actionError={actionError ?? null}
                      onSelectFile={onSelectFile}
                      onSelectAnchor={onSelectAnchor}
                      onSuggestionAction={onSuggestionAction}
                    />
                  </TabPanel>
                  <TabPanel>
                    <CommentsPanel
                      review={review}
                      onSelectComment={onSelectComment}
                    />
                  </TabPanel>
                  <TabPanel>
                    <HistoryPanel review={review} />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Layer>
          </div>

          <ReviewSidebar review={review} />
        </div>
      </Column>
    </Grid>
  );
}
