import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { ROOT } from "./local-stack-lib.mjs";

const reportPath = path.join(
  ROOT,
  ".local-runtime",
  "real-manuscript-report.json",
);
const goldPath = path.join(ROOT, "docs", "rule-precision-gold.json");
const outputPath = path.join(
  ROOT,
  ".local-runtime",
  "rule-precision-report.json",
);

function keyFor(arxivId, ruleId) {
  return `${arxivId}:${ruleId}`;
}

function isFired(state) {
  return state === "warn" || state === "fail";
}

function outcomeFor(actual, label) {
  if (!actual) {
    return label.expectedState === "pass" ? "true-negative" : "false-negative";
  }

  if (actual.state === label.expectedState) {
    if (actual.severity !== label.expectedSeverity) {
      return "severity-mismatch";
    }
    return isFired(actual.state) ? "true-positive" : "true-negative";
  }

  if (isFired(actual.state) && label.expectedState === "pass") {
    return "false-positive";
  }

  if (actual.state === "pass" && isFired(label.expectedState)) {
    return "false-negative";
  }

  return "severity-mismatch";
}

function safeNumber(value) {
  return Number.isFinite(value) ? Number(value.toFixed(4)) : null;
}

function buildGoldLabels(gold) {
  const labels = new Map();

  for (const manuscript of gold.manuscripts ?? []) {
    for (const [ruleId, label] of Object.entries(manuscript.labels ?? {})) {
      labels.set(keyFor(manuscript.arxivId, ruleId), {
        arxivId: manuscript.arxivId,
        ruleId,
        ...label,
      });
    }
  }

  return labels;
}

function summarizeRules(findings) {
  const grouped = new Map();

  for (const finding of findings) {
    const group = grouped.get(finding.ruleId) ?? [];
    group.push(finding);
    grouped.set(finding.ruleId, group);
  }

  return Object.fromEntries(
    [...grouped.entries()].map(([ruleId, group]) => {
      const fired = group.filter((item) => isFired(item.actualState));
      const truePositives = group.filter(
        (item) => item.outcome === "true-positive",
      ).length;
      const falsePositives = group.filter(
        (item) => item.outcome === "false-positive",
      ).length;
      const warningCount = group.filter(
        (item) => item.actualSeverity === "warning",
      ).length;
      const blockerCount = group.filter(
        (item) => item.actualSeverity === "blocker",
      ).length;
      const denominator = truePositives + falsePositives;

      return [
        ruleId,
        {
          labeledCount: group.length,
          firedCount: fired.length,
          warningRate: safeNumber(warningCount / group.length),
          blockerRate: safeNumber(blockerCount / group.length),
          precision:
            denominator > 0 ? safeNumber(truePositives / denominator) : null,
          anchorCoverage:
            fired.length > 0
              ? safeNumber(
                  fired.filter((item) => item.hasAnchor).length / fired.length,
                )
              : 1,
          evidenceCoverage:
            fired.length > 0
              ? safeNumber(
                  fired.filter((item) => item.hasEvidence).length /
                    fired.length,
                )
              : 1,
          sourceCoverage:
            fired.length > 0
              ? safeNumber(
                  fired.filter((item) => item.hasSource).length / fired.length,
                )
              : 1,
        },
      ];
    }),
  );
}

function assertPrecisionBar(report) {
  const failures = [];

  for (const [ruleId, summary] of Object.entries(report.rules)) {
    if (
      summary.labeledCount > 0 &&
      summary.firedCount === summary.labeledCount
    ) {
      failures.push(`${ruleId} fired on every labeled manuscript.`);
    }

    if (summary.precision !== null && summary.precision < 0.8) {
      failures.push(`${ruleId} precision is below 0.8.`);
    }

    if (summary.anchorCoverage < 1) {
      failures.push(`${ruleId} has fired checks without anchors.`);
    }

    if (summary.evidenceCoverage < 1 || summary.sourceCoverage < 1) {
      failures.push(`${ruleId} has fired checks without source evidence.`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`Rule precision bar failed:\n- ${failures.join("\n- ")}`);
  }
}

async function main() {
  const [report, gold] = await Promise.all([
    readFile(reportPath, "utf8").then(JSON.parse),
    readFile(goldPath, "utf8").then(JSON.parse),
  ]);
  const labels = buildGoldLabels(gold);
  const findings = [];

  for (const result of report.results ?? []) {
    const checksByRule = new Map(
      (result.checks ?? []).map((check) => [check.rule_id, check]),
    );

    for (const [key, label] of labels.entries()) {
      if (!key.startsWith(`${result.arxivId}:`)) {
        continue;
      }

      const actual = checksByRule.get(label.ruleId);
      const outcome = outcomeFor(actual, label);

      findings.push({
        arxivId: result.arxivId,
        title: result.title,
        ruleId: label.ruleId,
        actualState: actual?.state ?? "missing",
        expectedState: label.expectedState,
        actualSeverity: actual?.severity,
        expectedSeverity: label.expectedSeverity,
        outcome,
        hasAnchor: Boolean(actual?.review_file_path && actual?.anchor_id),
        hasEvidence:
          Array.isArray(actual?.evidence_json) &&
          actual.evidence_json.length > 0,
        hasSource: Boolean(actual?.source_url && actual?.source_checked_at),
        ...(actual?.review_file_path
          ? { filePath: actual.review_file_path }
          : {}),
        rationale: label.rationale,
      });
    }
  }

  const precisionReport = {
    generatedAt: new Date().toISOString(),
    manuscriptCount: report.count ?? report.results?.length ?? 0,
    labeledFindingCount: findings.length,
    findings,
    rules: summarizeRules(findings),
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(precisionReport, null, 2)}\n`);

  console.log(`Rule precision report: ${outputPath}`);
  console.log(JSON.stringify(precisionReport.rules, null, 2));

  assertPrecisionBar(precisionReport);
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Rule precision failed.",
  );
  process.exitCode = 1;
});
