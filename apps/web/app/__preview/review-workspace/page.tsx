import { Suspense } from "react";

import { createPreviewReview } from "../fixtures";
import { PreviewReviewWorkspace } from "./preview-review-workspace";

export default function PreviewReviewWorkspacePage() {
  return (
    <Suspense fallback={null}>
      <PreviewReviewWorkspace review={createPreviewReview()} />
    </Suspense>
  );
}
