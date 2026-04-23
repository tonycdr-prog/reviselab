import { NextResponse } from "next/server";

import type { SuggestionAction } from "@reviselab/core";

import { readJsonObject } from "@/app/api/_helpers/read-json-object";
import { applySuggestionAction } from "@/lib/reviews/repository";

type RouteProps = {
  params: Promise<{
    reviewId: string;
    suggestionId: string;
  }>;
};

const VALID_ACTIONS = new Set<SuggestionAction>([
  "apply",
  "reject",
  "resolve",
  "restore",
  "edit",
]);

export async function POST(request: Request, { params }: RouteProps) {
  const { reviewId, suggestionId } = await params;
  const body = await readJsonObject<{
    action?: SuggestionAction;
    editedText?: string;
  }>(request);

  if (!body) {
    return NextResponse.json(
      { error: "Suggestion action body is invalid JSON." },
      { status: 400 },
    );
  }

  if (!body.action) {
    return NextResponse.json(
      { error: "Suggestion action is required." },
      { status: 400 },
    );
  }

  if (!VALID_ACTIONS.has(body.action)) {
    return NextResponse.json(
      { error: "Suggestion action is invalid." },
      { status: 400 },
    );
  }

  if (body.editedText !== undefined && typeof body.editedText !== "string") {
    return NextResponse.json(
      { error: "Edited text must be a string." },
      { status: 400 },
    );
  }

  try {
    const review = await applySuggestionAction(
      reviewId,
      suggestionId,
      body.action,
      body.editedText,
    );

    return NextResponse.json(review);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update suggestion.",
      },
      { status: 400 },
    );
  }
}
