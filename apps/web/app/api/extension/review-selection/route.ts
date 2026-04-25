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
  const normalizedTitle =
    typeof body.title === "string" ? body.title.trim() : "";
  const normalizedAbstract =
    typeof body.abstract === "string" ? body.abstract.trim() : "";
  const normalizedCategory =
    typeof body.intendedCategory === "string"
      ? body.intendedCategory.trim()
      : "";

  if (
    (body.title !== undefined && typeof body.title !== "string") ||
    (body.abstract !== undefined && typeof body.abstract !== "string") ||
    (body.intendedCategory !== undefined &&
      typeof body.intendedCategory !== "string")
  ) {
    return NextResponse.json(
      { error: "Selection review text fields must be strings." },
      { status: 400 },
    );
  }

  if (
    body.paperType !== undefined &&
    (typeof body.paperType !== "string" || !isPaperType(body.paperType))
  ) {
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
        title: normalizedTitle || "Overleaf selection review",
        abstract: normalizedAbstract,
        intendedCategory: normalizedCategory || "cs.AI",
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
