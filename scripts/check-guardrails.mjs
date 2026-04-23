import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIRECTORY, "..");
const args = process.argv.slice(2);
const scopeIndex = args.indexOf("--scope");
const scope = scopeIndex >= 0 ? args[scopeIndex + 1] : null;
const ROOT_FILES = [
  ".editorconfig",
  ".gitattributes",
  ".gitignore",
  ".prettierignore",
  ".prettierrc.json",
  "CONTRIBUTING.md",
  "compose.yaml",
  "README.md",
  "RTK.md",
  "package.json",
  "pnpm-workspace.yaml",
  "tsconfig.base.json",
];

const SCAN_ROOTS = scope
  ? [scope]
  : [
      ".github",
      "apps",
      "packages",
      "supabase",
      "docs",
      "scripts",
      ...ROOT_FILES,
    ];
const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  ".next",
  ".wxt",
  ".output",
  "dist",
  "coverage",
  "playwright-report",
  "test-results",
  ".turbo",
  ".cache",
]);
const SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".css",
  ".sql",
  ".md",
  ".json",
  ".html",
  ".yml",
  ".yaml",
]);
const FORBIDDEN_ARTIFACT_PATHS = [
  ".cache",
  ".eslintcache",
  ".turbo",
  ".vercel",
  "apps/extension/.output",
  "apps/extension/.wxt",
  "apps/web/.next",
  "apps/web/test-results",
  "apps/worker/dist",
  "coverage",
  "playwright-report",
  "supabase/.temp",
  "test-results",
];
const COLOR_PROPERTIES = new Set([
  "background",
  "backgroundColor",
  "borderColor",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor",
  "color",
  "fill",
  "outlineColor",
  "stroke",
]);
const SPACING_PROPERTIES = new Set([
  "bottom",
  "columnGap",
  "gap",
  "left",
  "margin",
  "marginBlock",
  "marginBlockEnd",
  "marginBlockStart",
  "marginBottom",
  "marginInline",
  "marginInlineEnd",
  "marginInlineStart",
  "marginLeft",
  "marginRight",
  "marginTop",
  "padding",
  "paddingBlock",
  "paddingBlockEnd",
  "paddingBlockStart",
  "paddingBottom",
  "paddingInline",
  "paddingInlineEnd",
  "paddingInlineStart",
  "paddingLeft",
  "paddingRight",
  "paddingTop",
  "right",
  "rowGap",
  "top",
]);
const FORBIDDEN_ICON_PACKAGES = new Set([
  "@heroicons/react",
  "@phosphor-icons/react",
  "@tabler/icons-react",
  "lucide-react",
  "phosphor-react",
  "react-icons",
]);
const TEXT_SIZE_LIMIT = 50 * 1024;
const BINARY_SIZE_LIMIT = 500 * 1024;
const ALLOWLIST_PATH = path.join(ROOT, "docs/file-budget-allowlist.json");

function isInside(filePath, directory) {
  return (
    filePath === directory || filePath.startsWith(`${directory}${path.sep}`)
  );
}

function toRelative(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join("/");
}

function fileClass(filePath) {
  const relative = toRelative(filePath);

  if (relative.endsWith(".sql")) {
    return { soft: 400, hard: 600, label: "sql" };
  }

  if (relative.endsWith(".css")) {
    return { soft: 250, hard: 400, label: "css" };
  }

  if (relative.endsWith("/route.ts")) {
    return { soft: 150, hard: 200, label: "route" };
  }

  if (relative.endsWith("/page.tsx") || relative.endsWith("/layout.tsx")) {
    return { soft: 250, hard: 350, label: "view" };
  }

  if (relative.endsWith(".tsx")) {
    return { soft: 250, hard: 350, label: "component" };
  }

  if (relative.endsWith(".ts")) {
    return { soft: 200, hard: 300, label: "module" };
  }

  return null;
}

function isBinary(filePath) {
  return [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".ico",
    ".pdf",
    ".zip",
  ].includes(path.extname(filePath));
}

function isAllowedFileBudget(relativePath, allowlist) {
  return allowlist.some((entry) => entry.path === relativePath);
}

function scopeContains(relativePath) {
  if (!scope) {
    return true;
  }

  return relativePath === scope || relativePath.startsWith(`${scope}/`);
}

async function walk(entryPath, filePaths) {
  const stats = await stat(entryPath);
  const relative = toRelative(entryPath);

  if (stats.isDirectory()) {
    const name = path.basename(entryPath);
    if (IGNORE_DIRS.has(name)) {
      return;
    }

    const children = await readdir(entryPath);
    await Promise.all(
      children.map((child) => walk(path.join(entryPath, child), filePaths)),
    );
    return;
  }

  if (
    SOURCE_EXTENSIONS.has(path.extname(entryPath)) ||
    ROOT_FILES.includes(relative) ||
    path.basename(entryPath) === ".DS_Store" ||
    entryPath.endsWith(".tsbuildinfo") ||
    isBinary(entryPath)
  ) {
    filePaths.push(entryPath);
  }
}

function addError(errors, filePath, message) {
  errors.push(`${toRelative(filePath)}: ${message}`);
}

function assertNoDirectCarbonImports(filePath, content, errors) {
  if (isInside(filePath, path.join(ROOT, "packages/ui"))) {
    return;
  }

  const matches = content.matchAll(/from\s+["']([^"']+)["']/g);
  for (const match of matches) {
    const specifier = match[1];
    if (specifier === "@carbon/react" || specifier === "@carbon/icons-react") {
      addError(
        errors,
        filePath,
        `Direct Carbon import "${specifier}" is not allowed outside packages/ui.`,
      );
    }

    if (FORBIDDEN_ICON_PACKAGES.has(specifier)) {
      addError(
        errors,
        filePath,
        `Alternate icon package "${specifier}" is not allowed outside packages/ui/icons.`,
      );
    }
  }
}

function assertNoPaperlint(filePath, content, errors) {
  const brandPath = path.join(ROOT, "packages/core/src/brand.ts");
  if (
    filePath === brandPath ||
    filePath === path.join(ROOT, "scripts/check-guardrails.mjs")
  ) {
    return;
  }

  if (content.includes("Paperlint")) {
    addError(
      errors,
      filePath,
      'User-facing "Paperlint" reference found outside the internal codename source.',
    );
  }
}

function assertNoLocaleDrift(filePath, content, errors) {
  if (filePath === path.join(ROOT, "scripts/check-guardrails.mjs")) {
    return;
  }

  if (content.includes("toLocaleString(")) {
    addError(
      errors,
      filePath,
      "Use formatUiDateTime instead of raw toLocaleString() in shared UI or preview code.",
    );
  }
}

function assertEnvAccess(filePath, content, errors) {
  if (!content.includes("process.env")) {
    return;
  }

  const relative = toRelative(filePath);
  const allowed =
    relative.includes("/env.") ||
    relative.endsWith(".config.ts") ||
    relative.endsWith(".config.mjs") ||
    relative.startsWith("scripts/");

  if (!allowed) {
    addError(
      errors,
      filePath,
      "Use a dedicated env module instead of direct process.env access.",
    );
  }
}

function assertNoAbsoluteWorkspacePath(filePath, content, errors) {
  const absolutePathPattern =
    /(?:\/Users\/[^/\s"'`<>]+\/[^\s"'`<>]+|\/home\/[^/\s"'`<>]+\/[^\s"'`<>]+|[A-Za-z]:\\\\[^\s"'`<>]+)/;

  if (!content.includes(ROOT) && !absolutePathPattern.test(content)) {
    return;
  }

  addError(
    errors,
    filePath,
    "Machine-specific absolute workspace path found; use repo-relative paths instead.",
  );
}

function isAllowedCssValue(value) {
  const normalized = value.trim();
  return (
    normalized === "0" ||
    normalized === "auto" ||
    normalized === "transparent" ||
    normalized === "currentColor" ||
    normalized.startsWith("var(") ||
    normalized.startsWith("calc(")
  );
}

function assertCssValues(filePath, content, errors) {
  const lines = content.split("\n");
  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("/*") || !trimmed.includes(":")) {
      return;
    }

    const property = trimmed.split(":")[0]?.trim();
    const value = trimmed
      .split(":")
      .slice(1)
      .join(":")
      .replace(/;$/, "")
      .trim();

    if (!property) {
      return;
    }

    if (
      (COLOR_PROPERTIES.has(property) || property.includes("color")) &&
      /#(?:[0-9a-fA-F]{3,8})\b|rgba?\(|hsla?\(/.test(value)
    ) {
      addError(
        errors,
        filePath,
        `Raw color literal on line ${index + 1}; use Carbon tokens instead.`,
      );
    }

    if (
      (SPACING_PROPERTIES.has(property) ||
        property.startsWith("padding") ||
        property.startsWith("margin")) &&
      /(^|[\s(])-?\d*\.?\d+(px|rem|em|vh|vw)\b/.test(value) &&
      !isAllowedCssValue(value)
    ) {
      addError(
        errors,
        filePath,
        `Raw spacing literal on line ${index + 1}; use Carbon spacing tokens instead.`,
      );
    }
  });
}

function isSpacingOrColorProperty(name) {
  return COLOR_PROPERTIES.has(name) || SPACING_PROPERTIES.has(name);
}

function assertNoInlineDesignValues(filePath, content, errors) {
  if (!filePath.endsWith(".tsx")) {
    return;
  }

  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  function visit(node) {
    if (
      ts.isJsxAttribute(node) &&
      node.name.text === "style" &&
      node.initializer &&
      ts.isJsxExpression(node.initializer) &&
      node.initializer.expression &&
      ts.isObjectLiteralExpression(node.initializer.expression)
    ) {
      for (const property of node.initializer.expression.properties) {
        if (
          ts.isPropertyAssignment(property) &&
          (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
        ) {
          const name = property.name.text;
          const initializer = property.initializer;

          if (
            isSpacingOrColorProperty(name) &&
            (ts.isStringLiteral(initializer) ||
              ts.isNumericLiteral(initializer) ||
              initializer.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral)
          ) {
            addError(
              errors,
              filePath,
              `Inline ${name} value detected in JSX style prop; use Carbon classes or tokens instead.`,
            );
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

async function main() {
  const allowlist =
    JSON.parse(await readFile(ALLOWLIST_PATH, "utf8")).allowlist ?? [];
  const filePaths = [];
  const errors = [];

  for (const relativePath of FORBIDDEN_ARTIFACT_PATHS) {
    if (!scopeContains(relativePath)) {
      continue;
    }

    try {
      await stat(path.join(ROOT, relativePath));
      addError(
        errors,
        path.join(ROOT, relativePath),
        "Generated artifact directory or file must be cleaned before linting.",
      );
    } catch {
      // Not present, which is what we want.
    }
  }

  for (const root of SCAN_ROOTS) {
    const absolute = path.join(ROOT, root);
    try {
      await walk(absolute, filePaths);
    } catch (error) {
      if (scope) {
        throw error;
      }
    }
  }

  for (const filePath of filePaths) {
    const relative = toRelative(filePath);
    const fileStats = await stat(filePath);

    if (path.basename(filePath) === ".DS_Store") {
      addError(
        errors,
        filePath,
        "Finder metadata files must not be kept in the workspace.",
      );
      continue;
    }

    if (filePath.endsWith(".tsbuildinfo")) {
      addError(
        errors,
        filePath,
        "Generated TypeScript build info must not be committed.",
      );
      continue;
    }

    if (isBinary(filePath)) {
      if (
        fileStats.size > BINARY_SIZE_LIMIT &&
        !isAllowedFileBudget(relative, allowlist)
      ) {
        addError(
          errors,
          filePath,
          `Binary file exceeds ${BINARY_SIZE_LIMIT} bytes.`,
        );
      }
      continue;
    }

    const content = await readFile(filePath, "utf8");
    const budget = fileClass(filePath);
    const loc = content.split("\n").length;

    if (
      fileStats.size > TEXT_SIZE_LIMIT &&
      !isAllowedFileBudget(relative, allowlist)
    ) {
      addError(errors, filePath, `Text file exceeds ${TEXT_SIZE_LIMIT} bytes.`);
    }

    if (
      budget &&
      loc > budget.hard &&
      !isAllowedFileBudget(relative, allowlist)
    ) {
      addError(
        errors,
        filePath,
        `${budget.label} file exceeds ${budget.hard} line hard cap (${loc} lines).`,
      );
    }

    if (
      budget &&
      loc > budget.soft &&
      !isAllowedFileBudget(relative, allowlist)
    ) {
      console.warn(
        `${relative}: exceeds ${budget.soft} line soft target (${loc} lines).`,
      );
    }

    if (
      [".ts", ".tsx", ".js", ".mjs", ".json"].includes(path.extname(filePath))
    ) {
      assertNoDirectCarbonImports(filePath, content, errors);
      assertNoPaperlint(filePath, content, errors);
      assertNoLocaleDrift(filePath, content, errors);
      assertEnvAccess(filePath, content, errors);
    }

    if (
      [".md", ".json", ".ts", ".tsx", ".js", ".mjs", ".yml", ".yaml"].includes(
        path.extname(filePath),
      ) ||
      ROOT_FILES.includes(relative)
    ) {
      assertNoAbsoluteWorkspacePath(filePath, content, errors);
    }

    if (filePath.endsWith(".tsx")) {
      assertNoInlineDesignValues(filePath, content, errors);
    }

    if (filePath.endsWith(".css")) {
      assertCssValues(filePath, content, errors);
    }
  }

  if (errors.length > 0) {
    console.error("Guardrail checks failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("Guardrail checks passed.");
}

await main();
