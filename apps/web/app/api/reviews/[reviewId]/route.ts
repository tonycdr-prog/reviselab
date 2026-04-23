import { NextResponse } from "next/server";

import { getReviewById } from "@/lib/reviews/repository";

type RouteProps = {
  params: Promise<{
    reviewId: string;
  }>;
};

export async function GET(_: Request, { params }: RouteProps) {
  const { reviewId } = await params;
  try {
    const review = await getReviewById(reviewId);

    if (!review) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    return NextResponse.json(review);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to load review.",
      },
      { status: 400 },
    );
  }
}
