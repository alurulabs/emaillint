import type { FeatureData } from "../../src/types/index.js";
export type { FeatureData };

// Extract the YAML-ish block between the first two "---" lines.
function extractFrontMatter(md: string): string {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? m[1] : "";
}

// Capture a top-level `key: { ... }` flow block (brace-matched, multi-line).
function captureBlock(fm: string, key: string): string | null {
  const idx = fm.search(new RegExp(`^${key}:\\s*\\{`, "m"));
  if (idx === -1) return null;
  let i = fm.indexOf("{", idx);
  let depth = 0;
  for (; i < fm.length; i++) {
    const c = fm[i];
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return fm.slice(idx, i + 1); }
  }
  return null;
}

// Tolerant transform: a `key: { ... }` block -> valid JSON. Strips trailing
// commas, quotes unquoted keys.
function tolerantParse(block: string): Record<string, unknown> {
  const braceIdx = block.indexOf("{");
  let body = block.slice(braceIdx);
  body = body.replace(/,\s*(?=[\]}])/g, ""); // trailing commas (incl. newlines)
  body = body.replace(
    /"(?:[^"\\]|\\.)*"|([{,]\s*)([A-Za-z][\w-]*)(\s*:)/g,
    (m, pre, key, post) => (pre ? `${pre}"${key}"${post}` : m),
  ); // unquoted keys (skips string-literal contents)
  return JSON.parse(body);
}

function scalar(fm: string, key: string): string | undefined {
  const m = fm.match(new RegExp(`^${key}:\\s*"?(.*?)"?\\s*$`, "m"));
  return m ? m[1] : undefined;
}

export function parseFeatureFrontMatter(md: string, slug: string): FeatureData {
  const fm = extractFrontMatter(md);
  const statsBlock = captureBlock(fm, "stats");
  const notesBlock = captureBlock(fm, "notes_by_num");
  return {
    slug,
    lastTested: scalar(fm, "last_test_date"),
    stats: statsBlock ? (tolerantParse(statsBlock) as FeatureData["stats"]) : {},
    notesByNum: notesBlock ? (tolerantParse(notesBlock) as FeatureData["notesByNum"]) : {},
  };
}
