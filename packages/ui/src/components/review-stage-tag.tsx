import type { ReviewProgress, ReviewStage } from "@reviselab/core";

import { Tag } from "../carbon";

function getStageTagType(stage: ReviewStage) {
  switch (stage) {
    case "ready":
      return "green";
    case "failed-parse":
    case "failed-review":
      return "red";
    case "parsing":
    case "reviewing":
      return "blue";
    case "parse-queued":
    case "review-queued":
      return "cool-gray";
  }
}

export function ReviewStageTag({ progress }: { progress: ReviewProgress }) {
  return <Tag type={getStageTagType(progress.stage)}>{progress.label}</Tag>;
}
