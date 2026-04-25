import { NextResponse } from "next/server";

import { isPaperType } from "@reviselab/core";

import { createUploadedPaper } from "@/lib/reviews/repository";

export async function POST(request: Request) {
  const formData = await request.formData();

  const title = String(formData.get("title") ?? "");
  const abstract = String(formData.get("abstract") ?? "");
  const normalizedTitle = title.trim();
  const normalizedAbstract = abstract.trim();
  const intendedCategory = String(formData.get("intendedCategory") ?? "cs.AI");
  const requestedPaperType = String(formData.get("paperType") ?? "research");
  const paperType = isPaperType(requestedPaperType) ? requestedPaperType : null;
  const firstTimeSubmitter =
    String(formData.get("firstTimeSubmitter") ?? "false") === "true";
  const priorArxivAuthorship =
    String(formData.get("priorArxivAuthorship") ?? "false") === "true";
  const hasInstitutionalEmail =
    String(formData.get("hasInstitutionalEmail") ?? "false") === "true";
  const hasPersonalEndorser =
    String(formData.get("hasPersonalEndorser") ?? "false") === "true";
  const aiAssistanceUsed =
    String(formData.get("aiAssistanceUsed") ?? "false") === "true";
  const peerReviewedVenue = String(formData.get("peerReviewedVenue") ?? "");
  const journalRef = String(formData.get("journalRef") ?? "");
  const doi = String(formData.get("doi") ?? "");
  const aiDisclosureText = String(formData.get("aiDisclosureText") ?? "");
  const comments = String(formData.get("comments") ?? "");
  const fileValue = formData.get("file");
  const file = fileValue instanceof File ? fileValue : null;
  const normalizedFileName = file?.name.toLowerCase() ?? "";

  if (!normalizedTitle || !normalizedAbstract || !file) {
    return NextResponse.json(
      { error: "Title, abstract, and a PDF or LaTeX ZIP are required." },
      { status: 400 },
    );
  }

  if (!paperType) {
    return NextResponse.json(
      { error: "Paper type is invalid." },
      { status: 400 },
    );
  }

  if (
    !normalizedFileName.endsWith(".pdf") &&
    !normalizedFileName.endsWith(".zip")
  ) {
    return NextResponse.json(
      { error: "Upload a PDF or LaTeX ZIP file." },
      { status: 400 },
    );
  }

  try {
    const uploaded = await createUploadedPaper({
      targetServer: "arxiv",
      title: normalizedTitle,
      abstract: normalizedAbstract,
      intendedCategory: intendedCategory.trim() || "cs.AI",
      paperType,
      firstTimeSubmitter,
      priorArxivAuthorship,
      hasInstitutionalEmail,
      hasPersonalEndorser,
      peerReviewedVenue: peerReviewedVenue.trim(),
      journalRef: journalRef.trim(),
      doi: doi.trim(),
      aiAssistanceUsed,
      aiDisclosureText: aiDisclosureText.trim(),
      comments: comments.trim(),
      file,
    });

    return NextResponse.json({
      paperId: uploaded.paperId,
      versionId: uploaded.versionId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Paper upload failed.",
      },
      { status: 400 },
    );
  }
}
