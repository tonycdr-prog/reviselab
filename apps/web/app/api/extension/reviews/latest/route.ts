import { NextResponse } from "next/server";

import { getLatestReviewForToken } from "@/lib/reviews/extension-review";

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

export async function GET(request: Request) {
  const pairedToken = getBearerToken(request);

  if (!pairedToken) {
    return NextResponse.json(
      { error: "Missing paired token." },
      { status: 401 },
    );
  }

  let latestReview;

  try {
    latestReview = await getLatestReviewForToken(pairedToken);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load the latest review.",
      },
      { status: 400 },
    );
  }

  if (!latestReview) {
    return NextResponse.json(
      { error: "No reviews found for this workspace." },
      { status: 404 },
    );
  }

  return NextResponse.json(latestReview);
}
