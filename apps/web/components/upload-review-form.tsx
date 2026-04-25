"use client";

import { useState, startTransition } from "react";
import { useRouter } from "next/navigation";

import type { PaperType } from "@reviselab/core";
import { UploadReviewFormView } from "@reviselab/ui";

type UploadResponse = {
  paperId: string;
  versionId: string;
};

type ReviewResponse = {
  reviewId: string;
};

const REQUEST_TIMEOUT_MS = 45_000;

async function readApiError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMessage: string,
) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(timeoutMessage);
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function UploadReviewForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [intendedCategory, setIntendedCategory] = useState("cs.AI");
  const [paperType, setPaperType] = useState<PaperType>("research");
  const [firstTimeSubmitter, setFirstTimeSubmitter] = useState(true);
  const [priorArxivAuthorship, setPriorArxivAuthorship] = useState(false);
  const [hasInstitutionalEmail, setHasInstitutionalEmail] = useState(false);
  const [hasPersonalEndorser, setHasPersonalEndorser] = useState(false);
  const [peerReviewedVenue, setPeerReviewedVenue] = useState("");
  const [journalRef, setJournalRef] = useState("");
  const [doi, setDoi] = useState("");
  const [aiAssistanceUsed, setAiAssistanceUsed] = useState(false);
  const [aiDisclosureText, setAiDisclosureText] = useState("");
  const [comments, setComments] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFormReady =
    title.trim().length > 0 &&
    abstract.trim().length > 0 &&
    selectedFile !== null;

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);

    try {
      const uploadForm = new FormData();
      uploadForm.set("title", title);
      uploadForm.set("abstract", abstract);
      uploadForm.set("intendedCategory", intendedCategory);
      uploadForm.set("paperType", paperType);
      uploadForm.set("firstTimeSubmitter", String(firstTimeSubmitter));
      uploadForm.set("priorArxivAuthorship", String(priorArxivAuthorship));
      uploadForm.set("hasInstitutionalEmail", String(hasInstitutionalEmail));
      uploadForm.set("hasPersonalEndorser", String(hasPersonalEndorser));
      uploadForm.set("peerReviewedVenue", peerReviewedVenue);
      uploadForm.set("journalRef", journalRef);
      uploadForm.set("doi", doi);
      uploadForm.set("aiAssistanceUsed", String(aiAssistanceUsed));
      uploadForm.set("aiDisclosureText", aiDisclosureText);
      uploadForm.set("comments", comments);
      if (selectedFile) {
        uploadForm.set("file", selectedFile);
      }

      const uploadResponse = await fetchWithTimeout(
        "/api/papers/upload",
        {
          method: "POST",
          body: uploadForm,
        },
        "The upload request timed out. Check that the local Supabase stack is running, then try again.",
      );

      if (!uploadResponse.ok) {
        throw new Error(await readApiError(uploadResponse, "Upload failed."));
      }

      const uploadData = (await uploadResponse.json()) as UploadResponse;

      const reviewResponse = await fetchWithTimeout(
        `/api/papers/${uploadData.paperId}/reviews`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            paperId: uploadData.paperId,
            versionId: uploadData.versionId,
            title,
            abstract,
            intendedCategory,
            paperType,
            firstTimeSubmitter,
            sourceKind: selectedFile?.name.toLowerCase().endsWith(".zip")
              ? "latex-zip"
              : "pdf",
            priorArxivAuthorship,
            hasInstitutionalEmail,
            hasPersonalEndorser,
            peerReviewedVenue,
            journalRef,
            doi,
            aiAssistanceUsed,
            aiDisclosureText,
            comments,
          }),
        },
        "The review creation request timed out. Check that the local Supabase queue is reachable, then try again.",
      );

      if (!reviewResponse.ok) {
        throw new Error(
          await readApiError(reviewResponse, "Review creation failed."),
        );
      }

      const reviewData = (await reviewResponse.json()) as ReviewResponse;

      startTransition(() => {
        router.push(
          `/papers/${uploadData.paperId}/reviews/${reviewData.reviewId}`,
        );
      });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Something went wrong while creating the review.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <UploadReviewFormView
      title={title}
      abstract={abstract}
      intendedCategory={intendedCategory}
      paperType={paperType}
      firstTimeSubmitter={firstTimeSubmitter}
      priorArxivAuthorship={priorArxivAuthorship}
      hasInstitutionalEmail={hasInstitutionalEmail}
      hasPersonalEndorser={hasPersonalEndorser}
      peerReviewedVenue={peerReviewedVenue}
      journalRef={journalRef}
      doi={doi}
      aiAssistanceUsed={aiAssistanceUsed}
      aiDisclosureText={aiDisclosureText}
      comments={comments}
      isSubmitting={isSubmitting}
      error={error}
      isFormReady={isFormReady}
      onTitleChange={setTitle}
      onAbstractChange={setAbstract}
      onIntendedCategoryChange={setIntendedCategory}
      onPaperTypeChange={setPaperType}
      onFirstTimeSubmitterChange={setFirstTimeSubmitter}
      onPriorArxivAuthorshipChange={setPriorArxivAuthorship}
      onHasInstitutionalEmailChange={setHasInstitutionalEmail}
      onHasPersonalEndorserChange={setHasPersonalEndorser}
      onPeerReviewedVenueChange={setPeerReviewedVenue}
      onJournalRefChange={setJournalRef}
      onDoiChange={setDoi}
      onAiAssistanceUsedChange={setAiAssistanceUsed}
      onAiDisclosureTextChange={setAiDisclosureText}
      onCommentsChange={setComments}
      onFileChange={setSelectedFile}
      onSubmit={handleSubmit}
      {...(selectedFile ? { selectedFileName: selectedFile.name } : {})}
    />
  );
}
