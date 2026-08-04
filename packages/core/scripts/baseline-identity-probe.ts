// Baseline identity stability probe - measurement tool that settled the
// baseline-mode identity model (reject position, choose allowlist semantic
// fingerprint + count-based diff). Re-run when revisiting identity (e.g. the
// staged discriminator or layered-ladder upgrades) to re-measure against the
// corpus. Not shipped runtime code; a dev analysis script like corpus/labeled.
//
// Measures, against the full corpus:
//   (a) Allowlist fingerprint (stable attrs only, excluding volatile class/style/data-*) still
//       preserves identity across churn at ~99-100%.
//   (b) Collision rate rises with the allowlist (fewer distinguishing attrs) - and how much.
//   (c) Count-based multiset diff catches duplicate-adds that a de-duplicating Set would mask.
//
// Run: cd packages/core && npm run baseline-probe

import { readdir, readFile, writeFile } from "node:fs/promises";
import { analyze } from "../src/engine.js";
import { buildEmailContext } from "../src/parser/context.js";
import type { EmailContext, Issue } from "../src/types/index.js";

// Stable structural attrs only. Excludes volatile presentational/generated attrs
// (class, style, data-*, aria-*, role, tabindex, ...) that churn on regen and would cause
// false "new" issues unrelated to the violation.
const ALLOWLIST = new Set([
  "id", "name", "src", "href", "alt", "width", "height",
  "type", "colspan", "rowspan", "target", "rel", "value",
]);
const VOID = new Set(["img", "br", "hr", "input", "link", "source", "meta", "area", "base", "col", "embed", "param", "track", "wbr"]);

type Transform = { name: string; fn: (html: string) => string };
const TRANSFORMS: Transform[] = [
  { name: "insert-top-5", fn: (h) => "<!-- injected -->\n\n\n\n\n" + h },
  { name: "insert-top-50", fn: (h): string => "<!-- injected -->\n" + "\n".repeat(49) + h },
  { name: "indent-2sp", fn: (h) => h.split("\n").map((l) => (l.length ? "  " + l : l)).join("\n") },
  { name: "collapse-ws", fn: (h) => h.split("\n").map((l) => l.replace(/\s+$/, "")).join("\n").replace(/\n{2,}/g, "\n\n") },
];

const SYNTHETIC_DIR = new URL("../tests/fixtures/corpus/synthetic/", import.meta.url);
const REAL_DIR = new URL("../tests/fixtures/corpus/real/", import.meta.url);
const REPORTS_DIR = new URL("../reports/", import.meta.url);

async function listHtml(dir: URL): Promise<{ name: string; url: URL }[]> {
  let entries: string[];
  try { entries = await readdir(dir); } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
  return entries.filter((n) => n.endsWith(".html")).map((name) => ({ name, url: new URL(name, dir) }));
}

function findElement(ctx: EmailContext, issue: Issue) {
  return ctx.elements.find((e) => e.line === issue.line && e.column === issue.column);
}

// Allowlist semantic fingerprint: ruleId + tag + sorted allowlist attrs only.
function semId(ctx: EmailContext, issue: Issue): { id: string; matched: boolean } {
  const el = findElement(ctx, issue);
  if (el) {
    const attrKey = Object.keys(el.attributes)
      .filter((k) => ALLOWLIST.has(k.toLowerCase()))
      .sort()
      .map((k) => `${k.toLowerCase()}=${el.attributes[k]}`)
      .join("&");
    return { id: `${issue.ruleId}#${el.tagName}#${attrKey}`, matched: true };
  }
  return { id: `${issue.ruleId}#${issue.message}`, matched: false };
}

function posId(issue: Issue): string {
  return `${issue.ruleId}#${issue.line ?? 0}:${issue.column ?? 0}`;
}

function preservation(baseIds: Set<string>, tIds: Set<string>): number {
  if (baseIds.size === 0) return 1;
  let kept = 0;
  for (const id of baseIds) if (tIds.has(id)) kept++;
  return kept / baseIds.size;
}

// Count-based multiset "new" count: how many current instances exceed baseline per fingerprint.
function countNew(baseCounts: Map<string, number>, curCounts: Map<string, number>): number {
  let n = 0;
  for (const [id, c] of curCounts) n += Math.max(0, c - (baseCounts.get(id) ?? 0));
  return n;
}

// Build a duplicate element string from an element's tag + allowlist attrs, missing whatever
// the violation was (we copy attrs verbatim, so e.g. an img missing alt stays missing alt).
function duplicateTag(el: { tagName: string; attributes: Record<string, string> }): string {
  const attrs = Object.keys(el.attributes)
    .filter((k) => ALLOWLIST.has(k.toLowerCase()))
    .map((k) => `${k}="${el.attributes[k]}"`)
    .join(" ");
  const tag = el.tagName;
  return VOID.has(tag) ? `<${tag} ${attrs}>` : `<${tag} ${attrs}></${tag}>`;
}

function injectBeforeBodyClose(html: string, snippet: string): string {
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${snippet}</body>`);
  if (/<\/html>/i.test(html)) return html.replace(/<\/html>/i, `${snippet}</html>`);
  return html + snippet;
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}
function pct(x: number): string {
  return `${(x * 100).toFixed(1)}%`;
}

async function main(): Promise<void> {
  const files = [
    ...(await listHtml(SYNTHETIC_DIR)).map((f) => ({ ...f, source: "synthetic" as const })),
    ...(await listHtml(REAL_DIR)).map((f) => ({ ...f, source: "real" as const })),
  ];

  let totalElement = 0;
  let totalCollisions = 0;
  let filesWithCollisions = 0;
  const preservationByT: Record<string, { pos: number[]; sem: number[] }> = {};
  for (const t of TRANSFORMS) preservationByT[t.name] = { pos: [], sem: [] };

  // Duplicate-add validation counters (c).
  let dupAttempted = 0;       // files where we tried to duplicate an element-scoped issue
  let dupReproduced = 0;      // duplicate actually re-triggered the same rule
  let countCaughtSetMasked = 0; // reproduced cases where count new>0 and set new==0 (count wins)

  for (const f of files) {
    const html = await readFile(f.url, "utf8");
    const base = analyze(html);
    const baseCtx = buildEmailContext(html);

    // Element-scoped ids + collision count (allowlist).
    const semIds: string[] = [];
    for (const is of base.issues) {
      const { id, matched } = semId(baseCtx, is);
      if (matched) semIds.push(id);
    }
    totalElement += semIds.length;
    const counts = new Map<string, number>();
    for (const id of semIds) counts.set(id, (counts.get(id) ?? 0) + 1);
    const collisions = semIds.reduce((acc, id) => acc + (counts.get(id)! > 1 ? 1 : 0), 0);
    totalCollisions += collisions;
    if (collisions > 0) filesWithCollisions++;

    // Preservation across churn (element-scoped only).
    const basePosEl = new Set<string>();
    const baseSemEl = new Set<string>();
    const baseSemCounts = new Map<string, number>();
    for (const is of base.issues) {
      const { id, matched } = semId(baseCtx, is);
      if (matched) {
        basePosEl.add(posId(is));
        baseSemEl.add(id);
        baseSemCounts.set(id, (baseSemCounts.get(id) ?? 0) + 1);
      }
    }
    for (const t of TRANSFORMS) {
      const tHtml = t.fn(html);
      const tIssues = analyze(tHtml).issues;
      const tCtx = buildEmailContext(tHtml);
      const tPosEl = new Set<string>();
      const tSemEl = new Set<string>();
      for (const is of tIssues) {
        const { id, matched } = semId(tCtx, is);
        if (matched) { tPosEl.add(posId(is)); tSemEl.add(id); }
      }
      preservationByT[t.name].pos.push(preservation(basePosEl, tPosEl));
      preservationByT[t.name].sem.push(preservation(baseSemEl, tSemEl));
    }

    // (c) Duplicate-add: take the first element-scoped issue's element, inject a duplicate,
    // check set-based masks it while count-based catches it.
    const firstElIssue = base.issues.find((is) => semId(baseCtx, is).matched);
    if (firstElIssue) {
      const el = findElement(baseCtx, firstElIssue);
      if (el) {
        dupAttempted++;
        const dupHtml = injectBeforeBodyClose(html, duplicateTag(el));
        const dupIssues = analyze(dupHtml).issues;
        const dupCtx = buildEmailContext(dupHtml);
        // Did the duplicate re-trigger the same rule? Count current issues of that ruleId+element-tag.
        const beforeRuleTag = base.issues.filter((is) => is.ruleId === firstElIssue.ruleId).length;
        const afterRuleTag = dupIssues.filter((is) => is.ruleId === firstElIssue.ruleId).length;
        if (afterRuleTag > beforeRuleTag) {
          dupReproduced++;
          // Build current sem-counts for that file's issues of this ruleId.
          const curSemCounts = new Map<string, number>();
          for (const is of dupIssues) {
            const { id, matched } = semId(dupCtx, is);
            if (matched && is.ruleId === firstElIssue.ruleId) curSemCounts.set(id, (curSemCounts.get(id) ?? 0) + 1);
          }
          const baseSemThis = new Map<string, number>();
          for (const is of base.issues) {
            if (is.ruleId !== firstElIssue.ruleId) continue;
            const { id, matched } = semId(baseCtx, is);
            if (matched) baseSemThis.set(id, (baseSemThis.get(id) ?? 0) + 1);
          }
          const setNew = [...curSemCounts.keys()].filter((id) => !baseSemThis.has(id)).length;
          const countN = countNew(baseSemThis, curSemCounts);
          if (countN > 0 && setNew === 0) countCaughtSetMasked++;
        }
      }
    }
  }

  console.log(`Corpus: ${files.length} files, ${totalElement} element-scoped issues\n`);
  console.log(`(b) Collision rate with ALLOWLIST fingerprint:`);
  console.log(`    ${totalCollisions}/${totalElement} (${pct(totalElement ? totalCollisions / totalElement : 0)}) element-scoped issues collide`);
  console.log(`    across ${filesWithCollisions}/${files.length} (${pct(filesWithCollisions / files.length)}) files`);
  console.log(`    (vs all-attrs probe: 34.0% / 60% - allowlist raises collisions as expected)\n`);

  console.log(`(a) Preservation after churn (element-scoped, allowlist fingerprint):`);
  console.log(`${"transform".padEnd(16)} ${"position".padEnd(12)} ${"semantic-allowlist".padEnd(18)}`);
  for (const t of TRANSFORMS) {
    const p = mean(preservationByT[t.name].pos);
    const s = mean(preservationByT[t.name].sem);
    console.log(`${t.name.padEnd(16)} ${pct(p).padEnd(12)} ${pct(s).padEnd(18)}`);
  }

  console.log(`\n(c) Duplicate-add validation (count-based vs set-based):`);
  console.log(`    attempted on ${dupAttempted} files; duplicate reproduced the rule in ${dupReproduced}`);
  console.log(`    of those, count-based caught a new issue that set-based MASKED: ${countCaughtSetMasked}/${dupReproduced}`);
  console.log(`    (set-based masks duplicate-adds of baselined elements; count-based catches them)`);

  await writeFile(
    new URL("baseline-identity-probe-v2.json", REPORTS_DIR),
    JSON.stringify({
      collision: { totalCollisions, totalElement, filesWithCollisions, files: files.length },
      preservation: Object.fromEntries(
        Object.entries(preservationByT).map(([k, v]) => [k, { pos: mean(v.pos), sem: mean(v.sem) }]),
      ),
      duplicateAdd: { dupAttempted, dupReproduced, countCaughtSetMasked },
    }, null, 2),
  );
  console.log("\nDetailed data: packages/core/reports/baseline-identity-probe-v2.json");
}

main().catch((err) => { console.error(err); process.exit(1); });
