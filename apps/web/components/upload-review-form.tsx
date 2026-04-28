"use client";

import { useState, startTransition } from "react";
import { useRouter } from "next/navigation";

import type { PaperType } from "@reviselab/core";
import type { UploadReviewFormStatus } from "@reviselab/ui";
import { UploadReviewFormView } from "@reviselab/ui";
import {
  fetchWithTimeout,
  getValidationMessages,
  readApiError,
  type ReviewResponse,
  type UploadResponse,
} from "./upload-review-form-helpers";

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
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [status, setStatus] = useState<UploadReviewFormStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const isSubmitting = status !== "idle";
  const isFormReady =
    title.trim().length > 0 &&
    abstract.trim().length > 0 &&
    selectedFile !== null;
  const validationMessages = hasAttemptedSubmit
    ? getValidationMessages(title, abstract, selectedFile)
    : {};

  function handleFieldChange<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      if (error) {
        setError(null);
      }
    };
  }

  async function handleSubmit() {
    if (isSubmitting) {
      return;
    }

    setHasAttemptedSubmit(true);

    if (!isFormReady) {
      setError(
        "Add a title, abstract, and PDF or LaTeX ZIP before generating a review.",
      );
      return;
    }

    setError(null);
    setStatus("uploading");

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

      setStatus("creating-review");

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

      setStatus("redirecting");

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
      setStatus("idle");
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
      status={status}
      isSubmitting={isSubmitting}
      error={error}
      isFormReady={isFormReady}
      validationMessages={validationMessages}
      onTitleChange={handleFieldChange(setTitle)}
      onAbstractChange={handleFieldChange(setAbstract)}
      onIntendedCategoryChange={handleFieldChange(setIntendedCategory)}
      onPaperTypeChange={handleFieldChange(setPaperType)}
      onFirstTimeSubmitterChange={handleFieldChange(setFirstTimeSubmitter)}
      onPriorArxivAuthorshipChange={handleFieldChange(setPriorArxivAuthorship)}
      onHasInstitutionalEmailChange={handleFieldChange(
        setHasInstitutionalEmail,
      )}
      onHasPersonalEndorserChange={handleFieldChange(setHasPersonalEndorser)}
      onPeerReviewedVenueChange={handleFieldChange(setPeerReviewedVenue)}
      onJournalRefChange={handleFieldChange(setJournalRef)}
      onDoiChange={handleFieldChange(setDoi)}
      onAiAssistanceUsedChange={handleFieldChange(setAiAssistanceUsed)}
      onAiDisclosureTextChange={handleFieldChange(setAiDisclosureText)}
      onCommentsChange={handleFieldChange(setComments)}
      onFileChange={handleFieldChange(setSelectedFile)}
      onRemoveFile={() => {
        setSelectedFile(null);
        setHasAttemptedSubmit(false);
        setError(null);
      }}
      onSubmit={handleSubmit}
      {...(selectedFile
        ? {
            selectedFileName: selectedFile.name,
            selectedFileSize: selectedFile.size,
          }
        : {})}
    />
  );
}
