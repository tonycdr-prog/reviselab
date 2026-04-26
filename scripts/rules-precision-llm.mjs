import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { ROOT } from "./local-stack-lib.mjs";

const precisionReportPath = path.join(
  ROOT,
  ".local-runtime",
  "rule-precision-report.json",
);
const manuscriptReportPath = path.join(
  ROOT,
  ".local-runtime",
  "real-manuscript-report.json",
);
const outputPath = path.join(
  ROOT,
  ".local-runtime",
  "rule-precision-llm-report.json",
);
const model = process.env.OPENAI_MODEL ?? "gpt-5.4-mini";

function redactFinding(finding, manuscripts) {
  const manuscript = manuscripts.find(
    (item) => item.arxivId === finding.arxivId,
  );

  return {
    arxivId: finding.arxivId,
    title: finding.title,
    ruleId: finding.ruleId,
    actualState: finding.actualState,
    expectedState: finding.expectedState,
    actualSeverity: finding.actualSeverity,
    expectedSeverity: finding.expectedSeverity,
    outcome: finding.outcome,
    hasAnchor: finding.hasAnchor,
    hasEvidence: finding.hasEvidence,
    hasSource: finding.hasSource,
    filePath: finding.filePath,
    rationale: finding.rationale,
    check: manuscript?.checks?.find(
      (check) => check.rule_id === finding.ruleId,
    ),
  };
}

async function callOpenAI(input) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            "You evaluate deterministic submission-readiness rule precision. The deterministic rule remains production authority. Label whether each finding is a true issue, false positive, false negative, severity mismatch, bad anchor, missing evidence, or unsupported by source. Do not judge scientific correctness or novelty.",
        },
        {
          role: "user",
          content: JSON.stringify(input),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "rule_precision_adjudication",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["model", "adjudications"],
            properties: {
              model: { type: "string" },
              adjudications: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: [
                    "arxivId",
                    "ruleId",
                    "label",
                    "confidence",
                    "rationale",
                  ],
                  properties: {
                    arxivId: { type: "string" },
                    ruleId: { type: "string" },
                    label: {
                      type: "string",
                      enum: [
                        "true_positive",
                        "true_negative",
                        "false_positive",
                        "false_negative",
                        "wrong_severity",
                        "bad_anchor",
                        "missing_evidence",
                        "unsupported_by_source",
                      ],
                    },
                    confidence: {
                      type: "number",
                      minimum: 0,
                      maximum: 1,
                    },
                    rationale: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI adjudication failed with ${response.status}.`);
  }

  const payload = await response.json();
  const text = payload.output_text;

  if (typeof text !== "string") {
    throw new Error("OpenAI response did not include output_text.");
  }

  return JSON.parse(text);
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is required for optional LLM rule precision adjudication.",
    );
  }

  const [precisionReport, manuscriptReport] = await Promise.all([
    readFile(precisionReportPath, "utf8").then(JSON.parse),
    readFile(manuscriptReportPath, "utf8").then(JSON.parse),
  ]);
  const reviewQueue = precisionReport.findings
    .filter((finding) => finding.outcome !== "true-negative")
    .map((finding) => redactFinding(finding, manuscriptReport.results ?? []));

  if (reviewQueue.length === 0) {
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(
      outputPath,
      `${JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          model,
          adjudications: [],
        },
        null,
        2,
      )}\n`,
    );
    console.log("No non-true-negative findings needed LLM adjudication.");
    return;
  }

  const adjudication = await callOpenAI({
    generatedAt: new Date().toISOString(),
    model,
    findings: reviewQueue,
  });

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        ...adjudication,
      },
      null,
      2,
    )}\n`,
  );

  console.log(`LLM rule precision report: ${outputPath}`);
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "LLM rule precision adjudication failed.",
  );
  process.exitCode = 1;
});
