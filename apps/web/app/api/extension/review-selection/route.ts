import { NextResponse } from "next/server";

import { isPaperType, type PaperType } from "@reviselab/core";

import { readJsonObject } from "@/app/api/_helpers/read-json-object";
import { reviewSelection } from "@/lib/reviews/extension-review";

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

type SelectionReviewRequestBody = {
  title?: string;
  abstract?: string;
  intendedCategory?: string;
  paperType?: PaperType;
  firstTimeSubmitter?: boolean;
};

export async function POST(request: Request) {
  const body = await readJsonObject<SelectionReviewRequestBody>(request);

  if (!body) {
    return NextResponse.json(
      { error: "Selection review body is invalid JSON." },
      { status: 400 },
    );
  }
  const pairedToken = getBearerToken(request);
  const normalizedAbstract = body.abstract?.trim() ?? "";

  if (body.paperType && !isPaperType(body.paperType)) {
    return NextResponse.json(
      { error: "Paper type is invalid." },
      { status: 400 },
    );
  }

  if (
    body.firstTimeSubmitter !== undefined &&
    typeof body.firstTimeSubmitter !== "boolean"
  ) {
    return NextResponse.json(
      { error: "First-time submitter must be a boolean value." },
      { status: 400 },
    );
  }

  if (!normalizedAbstract) {
    return NextResponse.json(
      { error: "Capture or paste manuscript text before sending a review." },
      { status: 400 },
    );
  }

  try {
    const snapshot = await reviewSelection(
      {
        title: body.title?.trim() || "Overleaf selection review",
        abstract: normalizedAbstract,
        intendedCategory: body.intendedCategory?.trim() || "cs.AI",
        paperType: body.paperType ?? "research",
        ...(body.firstTimeSubmitter === undefined
          ? {}
          : { firstTimeSubmitter: body.firstTimeSubmitter }),
      },
      pairedToken ?? undefined,
    );

    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Selection review failed.",
      },
      { status: 400 },
    );
  }
}
