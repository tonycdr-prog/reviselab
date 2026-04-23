"use client";

import type { PaperType, ReviewSnapshot } from "@reviselab/core";

import {
  Button,
  Checkbox,
  InlineLoading,
  InlineNotification,
  Select,
  SelectItem,
  Tag,
  TextArea,
  TextInput,
  Theme,
  Tile,
} from "../carbon";
import { ReviewStatusTag } from "./review-status-tag";
const PAPER_TYPES: Array<{ label: string; value: PaperType }> = [
  { label: "Research article", value: "research" },
  { label: "Review article", value: "review" },
  { label: "Survey", value: "survey" },
  { label: "Position paper", value: "position" },
  { label: "Technical report", value: "technical-report" },
];

export type OverleafPanelViewProps = {
  brandName: string;
  categoryLabel: string;
  extensionDisplayName: string;
  apiBaseUrl: string;
  isSettingsReady?: boolean;
  title: string;
  abstract: string;
  intendedCategory: string;
  paperType: PaperType;
  firstTimeSubmitter: boolean;
  review: ReviewSnapshot | null;
  latestReviewHref?: string | null;
  isBootstrapping?: boolean;
  isLoading: boolean;
  error?: string | null;
  onTitleChange: (value: string) => void;
  onAbstractChange: (value: string) => void;
  onIntendedCategoryChange: (value: string) => void;
  onPaperTypeChange: (value: PaperType) => void;
  onFirstTimeSubmitterChange: (value: boolean) => void;
  onCaptureSelection: () => void;
  onRunReview: () => void;
  onOpenLatestReview?: () => void;
};

export function OverleafPanelView({
  brandName,
  categoryLabel,
  extensionDisplayName,
  apiBaseUrl,
  isSettingsReady = true,
  title,
  abstract,
  intendedCategory,
  paperType,
  firstTimeSubmitter,
  review,
  latestReviewHref = null,
  isBootstrapping = false,
  isLoading,
  error,
  onTitleChange,
  onAbstractChange,
  onIntendedCategoryChange,
  onPaperTypeChange,
  onFirstTimeSubmitterChange,
  onCaptureSelection,
  onRunReview,
  onOpenLatestReview,
}: OverleafPanelViewProps) {
  const canRunReview = abstract.trim().length > 0;
  const isRunReviewDisabled =
    isLoading || isBootstrapping || !isSettingsReady || !canRunReview;

  return (
    <Theme theme="white">
      <div className="rl-extension-panel rl-extension-root">
        <div className="cds--content rl-extension-section">
          <Tile className="rl-extension-section">
            <Tag type="blue">{categoryLabel}</Tag>
            <h2>{extensionDisplayName}</h2>
            <p>
              Send a selected abstract chunk or draft paragraph to {brandName}{" "}
              from Overleaf.
            </p>
            <p className="rl-extension-meta">
              {isSettingsReady
                ? `Connected to ${apiBaseUrl}`
                : "Extension settings are unavailable."}
            </p>
          </Tile>

          {error ? (
            <InlineNotification
              lowContrast
              kind="error"
              title="Problem"
              subtitle={error}
            />
          ) : null}

          <Tile className="rl-extension-section">
            {isBootstrapping ? (
              <InlineLoading
                status="active"
                description="Loading extension settings"
              />
            ) : null}
            <TextInput
              id="title"
              labelText="Draft title"
              value={title}
              onChange={(event) => onTitleChange(event.currentTarget.value)}
            />
            <TextArea
              id="selection"
              labelText="Selected text"
              helperText="Paste or capture the abstract section or paragraph you want reviewed."
              rows={10}
              value={abstract}
              onChange={(event) => onAbstractChange(event.currentTarget.value)}
            />
            <TextInput
              id="category"
              labelText="Intended category"
              value={intendedCategory}
              onChange={(event) =>
                onIntendedCategoryChange(event.currentTarget.value)
              }
            />
            <Select
              id="paperType"
              labelText="Paper type"
              value={paperType}
              onChange={(event) =>
                onPaperTypeChange(event.currentTarget.value as PaperType)
              }
            >
              {PAPER_TYPES.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  text={option.label}
                />
              ))}
            </Select>
            <Checkbox
              id="firstTimeSubmitter"
              labelText="First-time submitter in this category"
              checked={firstTimeSubmitter}
              onChange={(_, data) =>
                onFirstTimeSubmitterChange(Boolean(data.checked))
              }
            />
            <div className="rl-extension-actions rl-extension-action-grid">
              <Button
                kind="secondary"
                disabled={isLoading}
                onClick={onCaptureSelection}
              >
                Capture selection
              </Button>
              <Button disabled={isRunReviewDisabled} onClick={onRunReview}>
                Send to {brandName}
              </Button>
            </div>
          </Tile>

          <Tile className="rl-extension-section">
            <h3>Latest review</h3>
            {isLoading ? (
              <InlineLoading
                status="active"
                description="Creating selection review"
              />
            ) : review ? (
              <>
                <ReviewStatusTag
                  readiness={review.readiness}
                  status={review.status}
                />
                <p>{review.overview}</p>
                <ul className="rl-extension-list">
                  {review.checks.slice(0, 3).map((check) => (
                    <li key={check.id}>{check.summary}</li>
                  ))}
                </ul>
                {latestReviewHref && onOpenLatestReview ? (
                  <Button
                    kind="ghost"
                    type="button"
                    onClick={onOpenLatestReview}
                  >
                    Open latest review
                  </Button>
                ) : null}
              </>
            ) : (
              <>
                <p className="rl-extension-meta">
                  {latestReviewHref
                    ? "Open the latest workspace review or create a new selection review."
                    : "No review yet. Capture a selection from Overleaf or paste an abstract section."}
                </p>
                {latestReviewHref && onOpenLatestReview ? (
                  <Button
                    kind="ghost"
                    type="button"
                    onClick={onOpenLatestReview}
                  >
                    Open latest review
                  </Button>
                ) : null}
              </>
            )}
          </Tile>
        </div>
      </div>
    </Theme>
  );
}
