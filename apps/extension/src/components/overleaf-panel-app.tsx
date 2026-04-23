import { useEffect, useState } from "react";

import {
  brandConfig,
  type PaperType,
  type ReviewSnapshot,
} from "@reviselab/core";
import { OverleafPanelView } from "@reviselab/ui";

import {
  createSelectionReview,
  getLatestReviewLink,
} from "../lib/review-client";
import { getSettings } from "../lib/settings";

function readSelection() {
  return window.getSelection()?.toString().trim() ?? "";
}

export function OverleafPanelApp() {
  const [abstract, setAbstract] = useState("");
  const [title, setTitle] = useState("Overleaf selection review");
  const [intendedCategory, setIntendedCategory] = useState("cs.AI");
  const [paperType, setPaperType] = useState<PaperType>("research");
  const [firstTimeSubmitter, setFirstTimeSubmitter] = useState(false);
  const [review, setReview] = useState<ReviewSnapshot | null>(null);
  const [latestReviewHref, setLatestReviewHref] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState("http://localhost:3000");
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false);
  const [isBootstrappingSettings, setIsBootstrappingSettings] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getSettings()
      .then((settings) => {
        if (!isMounted) {
          return;
        }

        setApiBaseUrl(settings.apiBaseUrl);
        setHasLoadedSettings(true);
        setIsBootstrappingSettings(false);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setError("Unable to load extension settings.");
        setHasLoadedSettings(false);
        setIsBootstrappingSettings(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedSettings) {
      setLatestReviewHref(null);
      return;
    }

    let isMounted = true;

    getLatestReviewLink()
      .then((href) => {
        if (!isMounted) {
          return;
        }

        setLatestReviewHref(href);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setLatestReviewHref(null);
      });

    return () => {
      isMounted = false;
    };
  }, [hasLoadedSettings, review?.id]);

  function handleTitleChange(value: string) {
    setTitle(value);
    setError(null);
    setReview(null);
  }

  function handleAbstractChange(value: string) {
    setAbstract(value);
    setError(null);
    setReview(null);
  }

  function handleIntendedCategoryChange(value: string) {
    setIntendedCategory(value);
    setError(null);
    setReview(null);
  }

  function handlePaperTypeChange(value: PaperType) {
    setPaperType(value);
    setError(null);
    setReview(null);
  }

  function handleFirstTimeSubmitterChange(value: boolean) {
    setFirstTimeSubmitter(value);
    setError(null);
    setReview(null);
  }

  function captureSelection() {
    const selection = readSelection();

    if (!selection) {
      setError("Select some manuscript text in Overleaf first.");
      return;
    }

    setAbstract(selection);
    setError(null);
    setReview(null);
  }

  async function runReview() {
    if (isLoading) {
      return;
    }

    if (!abstract.trim()) {
      setError(
        "Capture or paste some manuscript text before sending a review.",
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    setReview(null);

    try {
      const snapshot = await createSelectionReview({
        title,
        abstract,
        intendedCategory,
        paperType,
        firstTimeSubmitter,
      });
      setReview(snapshot);
    } catch (reviewError) {
      setError(
        reviewError instanceof Error ? reviewError.message : "Review failed.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function openLatestReview() {
    if (!latestReviewHref) {
      return;
    }

    window.open(latestReviewHref, "_blank", "noopener,noreferrer");
  }

  return (
    <OverleafPanelView
      brandName={brandConfig.name}
      categoryLabel={brandConfig.categoryLabel}
      extensionDisplayName={brandConfig.extensionDisplayName}
      apiBaseUrl={apiBaseUrl}
      isSettingsReady={hasLoadedSettings}
      title={title}
      abstract={abstract}
      intendedCategory={intendedCategory}
      paperType={paperType}
      firstTimeSubmitter={firstTimeSubmitter}
      review={review}
      latestReviewHref={latestReviewHref}
      isBootstrapping={isBootstrappingSettings}
      isLoading={isLoading}
      error={error}
      onTitleChange={handleTitleChange}
      onAbstractChange={handleAbstractChange}
      onIntendedCategoryChange={handleIntendedCategoryChange}
      onPaperTypeChange={handlePaperTypeChange}
      onFirstTimeSubmitterChange={handleFirstTimeSubmitterChange}
      onCaptureSelection={captureSelection}
      onRunReview={runReview}
      onOpenLatestReview={openLatestReview}
    />
  );
}
