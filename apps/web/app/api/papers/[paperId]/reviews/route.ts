import { NextResponse } from "next/server";

import {
  isPaperSourceKind,
  isPaperType,
  type PaperType,
} from "@reviselab/core";

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
  sourceKind?: "pdf" | "latex-zip" | "selection";
  priorArxivAuthorship?: boolean;
  hasInstitutionalEmail?: boolean;
  hasPersonalEndorser?: boolean;
  peerReviewedVenue?: string;
  journalRef?: string;
  doi?: string;
  aiAssistanceUsed?: boolean;
  aiDisclosureText?: string;
  comments?: string;
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

  if (
    typeof body.sourceKind !== "undefined" &&
    (typeof body.sourceKind !== "string" || !isPaperSourceKind(body.sourceKind))
  ) {
    return NextResponse.json(
      { error: "Review source kind is invalid." },
      { status: 400 },
    );
  }

  if (
    [
      body.peerReviewedVenue,
      body.journalRef,
      body.doi,
      body.aiDisclosureText,
      body.comments,
    ].some((value) => value !== undefined && typeof value !== "string")
  ) {
    return NextResponse.json(
      { error: "Review context text fields must be strings." },
      { status: 400 },
    );
  }

  if (
    [
      body.priorArxivAuthorship,
      body.hasInstitutionalEmail,
      body.hasPersonalEndorser,
      body.aiAssistanceUsed,
    ].some((value) => value !== undefined && typeof value !== "boolean")
  ) {
    return NextResponse.json(
      { error: "Review context flags must be boolean values." },
      { status: 400 },
    );
  }

  try {
    const review = await createReview({
      targetServer: "arxiv",
      paperId,
      versionId: body.versionId.trim(),
      title: body.title.trim(),
      abstract: body.abstract.trim(),
      intendedCategory: body.intendedCategory.trim(),
      paperType: body.paperType,
      firstTimeSubmitter: body.firstTimeSubmitter,
      ...(body.sourceKind ? { sourceKind: body.sourceKind } : {}),
      priorArxivAuthorship: body.priorArxivAuthorship === true,
      hasInstitutionalEmail: body.hasInstitutionalEmail === true,
      hasPersonalEndorser: body.hasPersonalEndorser === true,
      peerReviewedVenue: body.peerReviewedVenue?.trim() ?? "",
      journalRef: body.journalRef?.trim() ?? "",
      doi: body.doi?.trim() ?? "",
      aiAssistanceUsed: body.aiAssistanceUsed === true,
      aiDisclosureText: body.aiDisclosureText?.trim() ?? "",
      comments: body.comments?.trim() ?? "",
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
