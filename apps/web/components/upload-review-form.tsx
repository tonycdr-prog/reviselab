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

async function readApiError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

export function UploadReviewForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [intendedCategory, setIntendedCategory] = useState("cs.AI");
  const [paperType, setPaperType] = useState<PaperType>("research");
  const [firstTimeSubmitter, setFirstTimeSubmitter] = useState(true);
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
      if (selectedFile) {
        uploadForm.set("file", selectedFile);
      }

      const uploadResponse = await fetch("/api/papers/upload", {
        method: "POST",
        body: uploadForm,
      });

      if (!uploadResponse.ok) {
        throw new Error(await readApiError(uploadResponse, "Upload failed."));
      }

      const uploadData = (await uploadResponse.json()) as UploadResponse;

      const reviewResponse = await fetch(
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
          }),
        },
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
      isSubmitting={isSubmitting}
      error={error}
      isFormReady={isFormReady}
      onTitleChange={setTitle}
      onAbstractChange={setAbstract}
      onIntendedCategoryChange={setIntendedCategory}
      onPaperTypeChange={setPaperType}
      onFirstTimeSubmitterChange={setFirstTimeSubmitter}
      onFileChange={setSelectedFile}
      onSubmit={handleSubmit}
      {...(selectedFile ? { selectedFileName: selectedFile.name } : {})}
    />
  );
}
