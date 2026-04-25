import { notFound } from "next/navigation";

import { pageTitle } from "@reviselab/core";
import { ReviewWorkspace } from "@/components/review-workspace";
import { getReviewById } from "@/lib/reviews/repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ReviewPageProps = {
  params: Promise<{
    paperId: string;
    reviewId: string;
  }>;
};

export async function generateMetadata({ params }: ReviewPageProps) {
  const { reviewId } = await params;
  const review = await getReviewById(reviewId);

  return {
    title: pageTitle(review?.context.title ?? "Review workspace"),
  };
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { reviewId } = await params;
  const review = await getReviewById(reviewId);

  if (!review) {
    notFound();
  }

  return <ReviewWorkspace initialReview={review} />;
}
