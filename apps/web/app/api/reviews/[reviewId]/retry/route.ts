import { NextResponse } from "next/server";

import { retryReview } from "@/lib/reviews/repository";

type RouteProps = {
  params: Promise<{
    reviewId: string;
  }>;
};

export async function POST(_: Request, { params }: RouteProps) {
  const { reviewId } = await params;

  try {
    const review = await retryReview(reviewId);
    return NextResponse.json(review);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to retry review.",
      },
      { status: 400 },
    );
  }
}
