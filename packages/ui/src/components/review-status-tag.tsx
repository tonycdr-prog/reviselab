import type { ReviewReadiness, ReviewStatus } from "@reviselab/core";

import { Tag } from "../carbon";

type ReviewStatusTagProps = {
  readiness?: ReviewReadiness | null;
  status?: ReviewStatus;
};

function getReviewStageLabel(status: ReviewStatus) {
  if (status === "failed") {
    return "Review failed";
  }

  if (status === "processing") {
    return "Processing";
  }

  if (status === "queued") {
    return "Queued";
  }

  return "Ready";
}

export function ReviewStatusTag({ readiness, status }: ReviewStatusTagProps) {
  if (status && status !== "ready") {
    return (
      <Tag type={status === "failed" ? "red" : "cool-gray"}>
        {getReviewStageLabel(status)}
      </Tag>
    );
  }

  if (!readiness) {
    return <Tag type="outline">Not scored yet</Tag>;
  }

  if (readiness === "Ready") {
    return <Tag type="green">{readiness}</Tag>;
  }

  if (readiness === "High submission risk") {
    return <Tag type="red">{readiness}</Tag>;
  }

  return <Tag type="warm-gray">{readiness}</Tag>;
}
