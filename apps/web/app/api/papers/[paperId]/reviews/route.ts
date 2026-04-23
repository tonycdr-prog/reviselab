import { NextResponse } from "next/server";

import { isPaperType, type PaperType } from "@reviselab/core";

import { readJsonObject } from "@/app/api/_helpers/read-json-object";
import { createReview } from "@/lib/reviews/repository";

type RouteProps = {
  params: Promise<{
    paperId: string;
  }>;
};

type ReviewCreateRequestBody = {
  versionId: string;
  title: string;
  abstract: string;
  intendedCategory: string;
  paperType: PaperType;
  firstTimeSubmitter: boolean;
};

export async function POST(request: Request, { params }: RouteProps) {
  const { paperId } = await params;
  const body = await readJsonObject<ReviewCreateRequestBody>(request);

  if (!body) {
    return NextResponse.json(
      { error: "Review request body is invalid JSON." },
      { status: 400 },
    );
  }

  if (
    typeof body.versionId !== "string" ||
    !body.versionId.trim() ||
    typeof body.title !== "string" ||
    !body.title.trim() ||
    typeof body.abstract !== "string" ||
    !body.abstract.trim() ||
    typeof body.intendedCategory !== "string" ||
    !body.intendedCategory.trim() ||
    typeof body.paperType !== "string" ||
    !isPaperType(body.paperType) ||
    typeof body.firstTimeSubmitter !== "boolean"
  ) {
    return NextResponse.json(
      {
        error:
          "Review request is missing required fields or contains invalid values.",
      },
      { status: 400 },
    );
  }

  try {
    const review = await createReview({
      paperId,
      versionId: body.versionId.trim(),
      title: body.title.trim(),
      abstract: body.abstract.trim(),
      intendedCategory: body.intendedCategory.trim(),
      paperType: body.paperType,
      firstTimeSubmitter: body.firstTimeSubmitter,
    });

    return NextResponse.json({
      reviewId: review.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Review creation failed.",
      },
      { status: 400 },
    );
  }
}
