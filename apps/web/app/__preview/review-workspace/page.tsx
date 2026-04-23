import { ReviewWorkspaceRecipe } from "@reviselab/ui";

import { createPreviewReview } from "../fixtures";

export default function PreviewReviewWorkspacePage() {
  return <ReviewWorkspaceRecipe review={createPreviewReview()} />;
}
