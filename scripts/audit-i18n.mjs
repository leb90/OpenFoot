import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");
const LOCALES_DIR = path.join(SRC_DIR, "i18n", "locales");

const FRONTEND_EXTENSIONS = new Set([".ts", ".tsx"]);
const FRONTEND_IGNORE_RE =
  /(?:\.test\.|\.spec\.|[\\/]i18n[\\/]locales[\\/]|node_modules|dist)/;

const FRONTEND_ATTRIBUTE_ALLOWLIST = new Set([
  "placeholder",
  "title",
  "alt",
  "aria-label",
  "aria-description",
  "label",
]);

const FRONTEND_PROPERTY_ALLOWLIST = new Set([
  "title",
  "label",
  "description",
  "body",
  "headline",
  "subject",
  "sender",
  "sender_role",
  "text",
  "message",
  "defaultValue",
  "helperText",
  "caption",
  "ctaLabel",
  "emptyState",
  "tabLabel",
]);

const FRONTEND_ATTRIBUTE_SKIP = new Set([
  "className",
  "id",
  "key",
  "path",
  "to",
  "type",
  "size",
  "variant",
  "role",
  "href",
  "src",
  "target",
  "rel",
  "name",
  "value",
  "icon",
]);

function walkFiles(dir, predicate, collected = []) {
  if (!fs.existsSync(dir)) return collected;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (FRONTEND_IGNORE_RE.test(fullPath) || predicate(fullPath)) {
        continue;
      }

      walkFiles(fullPath, predicate, collected);
      continue;
    }

    if (predicate(fullPath)) {
      collected.push(fullPath);
    }
  }

  return collected;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function collectMissingKeys(reference, candidate, pathSegments = []) {
  return Object.entries(reference).flatMap(([key, value]) => {
    const nextPath = [...pathSegments, key];
    const candidateValue = candidate?.[key];

    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      if (
        candidateValue === null ||
        typeof candidateValue !== "object" ||
        Array.isArray(candidateValue)
      ) {
        return [nextPath.join(".")];
      }

      return collectMissingKeys(value, candidateValue, nextPath);
    }

    return candidateValue === undefined ||
      (candidateValue !== null && typeof candidateValue === "object")
      ? [nextPath.join(".")]
      : [];
  });
}

function isTranslationKey(text) {
  return /^[a-z0-9_-]+(?:\.[a-z0-9_-]+)+$/i.test(text);
}

function looksLikeRouteOrIdentifier(text) {
  if (/^[./\\]/.test(text)) return true;
  if (!/[./\\:\d_-]/.test(text)) return false;

  return (
    /^[a-z0-9_-]+$/i.test(text) ||
    /^[a-z0-9_-]+:[a-z0-9:_-]+$/i.test(text)
  );
}

function looksLikeUserFacingText(text) {
  const trimmed = text.trim();
  if (trimmed.length < 2) return false;
  if (isTranslationKey(trimmed)) return false;
  if (/^[\d\s.,:%/-]+$/.test(trimmed)) return false;
  if (looksLikeRouteOrIdentifier(trimmed)) return false;

  const hasLetters = /\p{L}/u.test(trimmed);
  if (!hasLetters) return false;

  if (/\s/.test(trimmed)) return true;
  if (/[!?]/.test(trimmed)) return true;
  if (/^[A-Z][a-z]/.test(trimmed)) return true;
  if (/[^\u0000-\u007F]/.test(trimmed)) return true;

  return false;
}

function getLine(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function getFrontendFindingKind(node, sourceFile) {
  let current = node.parent;

  while (current) {
    if (ts.isImportDeclaration(current) || ts.isExportDeclaration(current)) {
      return null;
    }

    if (ts.isJsxAttribute(current)) {
      const attributeName = current.name.getText(sourceFile);
      if (
        FRONTEND_ATTRIBUTE_ALLOWLIST.has(attributeName) &&
        !FRONTEND_ATTRIBUTE_SKIP.has(attributeName)
      ) {
        return `jsx-attr:${attributeName}`;
      }

      return null;
    }

    if (ts.isPropertyAssignment(current)) {
      const propertyName = current.name.getText(sourceFile).replace(/['"]/g, "");
      if (FRONTEND_PROPERTY_ALLOWLIST.has(propertyName)) {
        return `property:${propertyName}`;
      }

      return null;
    }

    if (ts.isCallExpression(current)) {
      const calleeText = current.expression.getText(sourceFile);
      const argIndex = current.arguments.findIndex(
        (arg) => arg.pos <= node.pos && node.end <= arg.end,
      );

      if ((calleeText === "t" || calleeText.endsWith(".t")) && argIndex === 1) {
        return "t-default";
      }
    }

    current = current.parent;
  }

  return null;
}

function templateExpressionText(node) {
  const parts = [node.head.text];

  for (const span of node.templateSpans) {
    parts.push("${...}", span.literal.text);
  }

  return parts.join("").trim();
}

function scanFrontendFile(filePath) {
  const sourceText = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const findings = [];

  function pushFinding(node, kind, text) {
    findings.push({
      file: path.relative(ROOT, filePath),
      line: getLine(sourceFile, node),
      kind,
      text: text.trim(),
    });
  }

  function visit(node) {
    if (ts.isJsxText(node)) {
      const text = node.getText(sourceFile).replace(/\s+/g, " ").trim();
      if (looksLikeUserFacingText(text)) {
        pushFinding(node, "jsx-text", text);
      }
    }

    if (ts.isStringLiteralLike(node)) {
      const text = node.text.trim();
      if (!looksLikeUserFacingText(text)) {
        ts.forEachChild(node, visit);
        return;
      }

      const kind = getFrontendFindingKind(node, sourceFile);
      if (kind) {
        pushFinding(node, kind, text);
      }
    }

    if (ts.isTemplateExpression(node)) {
      const text = templateExpressionText(node);
      if (!looksLikeUserFacingText(text)) {
        ts.forEachChild(node, visit);
        return;
      }

      const kind = getFrontendFindingKind(node, sourceFile);
      if (kind) {
        pushFinding(node, kind, text);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return findings;
}

function scanFrontend() {
  const files = walkFiles(
    SRC_DIR,
    (filePath) =>
      FRONTEND_EXTENSIONS.has(path.extname(filePath)) &&
      !FRONTEND_IGNORE_RE.test(filePath),
  );

  return files.flatMap((filePath) => scanFrontendFile(filePath));
}

function groupByFile(findings) {
  return findings.reduce((accumulator, finding) => {
    const bucket = accumulator.get(finding.file) ?? [];
    bucket.push(finding);
    accumulator.set(finding.file, bucket);
    return accumulator;
  }, new Map());
}

function printLocaleCoverage() {
  const localeFiles = walkFiles(
    LOCALES_DIR,
    (filePath) => path.extname(filePath) === ".json",
  ).sort();
  const english = readJson(path.join(LOCALES_DIR, "en.json"));

  console.log("Locale coverage");

  let missingLocaleCount = 0;
  for (const filePath of localeFiles) {
    const localeCode = path.basename(filePath, ".json");
    if (localeCode === "en") continue;

    const missingKeys = collectMissingKeys(english, readJson(filePath));
    if (missingKeys.length === 0) continue;

    missingLocaleCount += 1;
    console.log(`- ${localeCode}: ${missingKeys.length} missing key(s)`);
    for (const key of missingKeys.slice(0, 20)) {
      console.log(`  - ${key}`);
    }
  }

  if (missingLocaleCount === 0) {
    console.log("- All supported locales match the English key set.");
  }

  console.log("");
}

function printFindingSection(title, findings) {
  console.log(title);

  if (findings.length === 0) {
    console.log("- No candidates found.");
    console.log("");
    return;
  }

  console.log(`- ${findings.length} candidate(s)`);

  const grouped = [...groupByFile(findings).entries()].sort((a, b) => {
    return b[1].length - a[1].length || a[0].localeCompare(b[0]);
  });

  for (const [file, fileFindings] of grouped.slice(0, 25)) {
    console.log(`- ${file} (${fileFindings.length})`);
    for (const finding of fileFindings.slice(0, 5)) {
      console.log(`  - L${finding.line} [${finding.kind}] ${finding.text}`);
    }
  }

  console.log("");
}

function main() {
  printLocaleCoverage();
  printFindingSection("Frontend hardcoded string candidates", scanFrontend());
}

main();
