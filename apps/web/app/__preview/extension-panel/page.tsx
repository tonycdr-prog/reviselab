"use client";

import { brandConfig } from "@reviselab/core";
import { OverleafPanelView } from "@reviselab/ui";

import { createPreviewReview } from "../fixtures";

export default function PreviewExtensionPanelPage() {
  return (
    <div className="rl-preview-extension-shell">
      <OverleafPanelView
        brandName={brandConfig.name}
        categoryLabel={brandConfig.categoryLabel}
        extensionDisplayName={brandConfig.extensionDisplayName}
        apiBaseUrl="http://127.0.0.1:3000"
        title="Overleaf selection review"
        abstract="We benchmark moderation-fit review workflows for scientific writing assistants using realistic abstract revisions."
        intendedCategory="cs.AI"
        paperType="research"
        firstTimeSubmitter={false}
        review={createPreviewReview()}
        isLoading={false}
        error={null}
        onTitleChange={() => undefined}
        onAbstractChange={() => undefined}
        onIntendedCategoryChange={() => undefined}
        onPaperTypeChange={() => undefined}
        onFirstTimeSubmitterChange={() => undefined}
        onCaptureSelection={() => undefined}
        onRunReview={() => undefined}
      />
    </div>
  );
}
