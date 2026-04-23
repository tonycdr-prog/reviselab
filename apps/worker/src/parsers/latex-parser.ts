import JSZip from "jszip";
import { processLatexToAstViaUnified } from "@unified-latex/unified-latex";

import type { ParseResult } from "./types";

function stripLatex(value: string) {
  return value
    .replace(/\\[a-zA-Z]+\*?(?:\[[^\]]*\])?(?:\{[^}]*\})?/g, " ")
    .replace(/[{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractCommandValue(source: string, command: string) {
  const match = new RegExp(`\\\\${command}\\{([\\s\\S]*?)\\}`, "i").exec(
    source,
  );
  return match?.[1] ? stripLatex(match[1]) : null;
}

function extractAbstract(source: string) {
  const match = /\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/i.exec(source);
  return match?.[1] ? stripLatex(match[1]) : null;
}

function extractSections(source: string) {
  const sections: ParseResult["manuscript"]["sections"] = [];
  const pattern =
    /\\section\*?\{([^}]+)\}([\s\S]*?)(?=\\section\*?\{|\\end\{document\}|$)/g;

  for (const match of source.matchAll(pattern)) {
    sections.push({
      title: stripLatex(match[1] ?? ""),
      level: 1,
      text: stripLatex(match[2] ?? ""),
    });
  }

  return sections;
}

function selectMainTexFile(zip: JSZip) {
  const texFiles = Object.keys(zip.files).filter(
    (fileName) =>
      fileName.endsWith(".tex") && !fileName.startsWith("__MACOSX/"),
  );

  return (
    texFiles.find((fileName) => /(^|\/)main\.tex$/i.test(fileName)) ??
    texFiles.sort((left, right) => left.length - right.length)[0] ??
    null
  );
}

export async function parseLatexArchive(
  fileBuffer: ArrayBuffer,
): Promise<ParseResult> {
  const zip = await JSZip.loadAsync(fileBuffer);
  const mainTexFile = selectMainTexFile(zip);

  if (!mainTexFile) {
    throw new Error("No LaTeX source file was found in the uploaded ZIP.");
  }

  const source = await zip.file(mainTexFile)?.async("string");

  if (!source) {
    throw new Error("Unable to read the main LaTeX source file.");
  }

  await processLatexToAstViaUnified().process(source);

  const title = extractCommandValue(source, "title") ?? "Untitled manuscript";
  const abstract = extractAbstract(source) ?? "";

  return {
    parserEngine: "unified-latex",
    manuscript: {
      sourceKind: "latex-zip",
      title,
      abstract,
      authors: [],
      sections: extractSections(source),
      references: [],
      rawText: stripLatex(source),
      parseDiagnostics: [`Parsed ${mainTexFile} with Unified LaTeX.`],
    },
  };
}
