const REQUEST_TIMEOUT_MS = 45_000;

export type UploadResponse = { paperId: string; versionId: string };
export type ReviewResponse = { reviewId: string };

export async function readApiError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

export async function fetchWithTimeout(
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

export function getValidationMessages(
  title: string,
  abstract: string,
  selectedFile: File | null,
) {
  return {
    ...(title.trim().length === 0
      ? { title: "Add the manuscript title." }
      : {}),
    ...(abstract.trim().length === 0
      ? { abstract: "Add the manuscript abstract." }
      : {}),
    ...(selectedFile === null ? { file: "Upload a PDF or LaTeX ZIP." } : {}),
  };
}
