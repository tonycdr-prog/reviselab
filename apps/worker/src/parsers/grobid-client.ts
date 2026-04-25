import { getGrobidUrl } from "../env";
import type { ParseFallbackContext, ParseResult } from "./types";

function stripXml(xml: string) {
  return xml
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findFirstMatch(xml: string, pattern: RegExp) {
  const match = pattern.exec(xml);
  return match?.[1] ? stripXml(match[1]) : null;
}

function buildFallbackResult(
  fallback: ParseFallbackContext,
  diagnostics: string[],
  parserEngine: string,
): ParseResult {
  return {
    parserEngine,
    manuscript: {
      sourceKind: fallback.sourceKind,
      title: fallback.title,
      abstract: fallback.abstract,
      authors: [],
      sections: [],
      references: [],
      rawText: fallback.rawText,
      parseDiagnostics: diagnostics,
      ...(fallback.artifactPath ? { artifactPath: fallback.artifactPath } : {}),
    },
  };
}

export async function parsePdfWithGrobid(
  fileBuffer: ArrayBuffer,
  fallback: ParseFallbackContext,
): Promise<ParseResult> {
  const grobidUrl = getGrobidUrl();

  if (!grobidUrl) {
    throw new Error("GROBID_URL is not configured for live PDF parsing.");
  }

  try {
    const formData = new FormData();
    formData.set(
      "input",
      new Blob([fileBuffer], {
        type: "application/pdf",
      }),
      "manuscript.pdf",
    );

    const response = await fetch(
      `${grobidUrl.replace(/\/$/, "")}/api/processFulltextDocument`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!response.ok) {
      throw new Error(`GROBID responded with ${response.status}`);
    }

    const xml = await response.text();
    const extractedTitle = findFirstMatch(
      xml,
      /<title[^>]*level="a"[^>]*>([\s\S]*?)<\/title>/i,
    );
    const extractedAbstract = findFirstMatch(
      xml,
      /<abstract[^>]*>[\s\S]*?<p>([\s\S]*?)<\/p>[\s\S]*?<\/abstract>/i,
    );
    const rawText = stripXml(xml);

    if (!extractedTitle || !extractedAbstract || rawText.length < 200) {
      throw new Error(
        "GROBID could not extract a reliable title, abstract, and body text from the PDF.",
      );
    }

    return {
      parserEngine: "grobid",
      manuscript: {
        sourceKind: fallback.sourceKind,
        title: extractedTitle,
        abstract: extractedAbstract,
        authors: [],
        sections: [],
        references: [],
        rawText,
        parseDiagnostics: ["Parsed with GROBID full-text extraction."],
        ...(fallback.artifactPath
          ? { artifactPath: fallback.artifactPath }
          : {}),
      },
    };
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `GROBID parsing failed: ${error.message}`
        : "GROBID parsing failed.",
    );
  }
}
