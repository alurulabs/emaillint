import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyze } from "../src/engine.js";
import { rules } from "../src/rules/index.js";
import { diffFixture, type FixtureDiff, type ExpectedSpec } from "./labeled/diff.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LABELED_DIR = path.resolve(__dirname, "../tests/fixtures/labeled");
const REPORTS_DIR = new URL("../reports/", import.meta.url);

type Category = "trigger" | "contested" | "clean";

async function listCases(subdir: string): Promise<{ name: string; category: Category }[]> {
  const dir = path.join(LABELED_DIR, subdir);
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir);
  return entries
    .filter((f) => f.endsWith(".html"))
    .map((f) => ({ name: f.slice(0, -".html".length), category: subdir as Category }));
}

async function runOne(category: Category, name: string): Promise<FixtureDiff> {
  const html = await readFile(path.join(LABELED_DIR, category, `${name}.html`), "utf8");
  const issues = analyze(html).issues;
  const specPath = path.join(LABELED_DIR, category, `${name}.expected.json`);
  const raw = existsSync(specPath) ? JSON.parse(await readFile(specPath, "utf8")) : {};
  const spec: ExpectedSpec = { name, expected: raw.expected ?? [], strict: raw.strict ?? false };
  const diff = diffFixture(spec, issues.map((i) => i.ruleId));
  return { ...diff, category };
}

function renderMarkdown(diffs: FixtureDiff[]): string {
  const failing = diffs.filter((d) => d.status === "fail");
  const fpCandidates = diffs.filter((d) => d.extras.length > 0 && d.status === "pass");
  const covered = new Set<string>();
  for (const d of diffs) for (const id of d.actual) covered.add(id);
  const uncovered = rules.map((r) => r.id).filter((id) => !covered.has(id));

  const lines: string[] = ["# Labeled Corpus Report", "",
    `Fixtures: ${diffs.length} · Failing: ${failing.length} · FP-candidate fixtures: ${fpCandidates.length}`, "",
    "## Coverage gaps (rules with 0 firing fixtures)", "",
    uncovered.length ? uncovered.join(", ") : "_(none — every registered rule fired on ≥1 labeled fixture)_", "",
    "## Failing fixtures (missing expected / strict extras)", ""];
  for (const d of failing)
    lines.push(`- ${d.category}/${d.name}: missing=[${d.missing.join(",")}] extras=[${d.extras.join(",")}]`);
  lines.push("", "## FP-candidates (unexpected extras, non-strict)", "");
  for (const d of fpCandidates)
    lines.push(`- ${d.category}/${d.name}: extras=[${d.extras.join(",")}]`);
  return lines.join("\n");
}

async function main(): Promise<void> {
  const cats: Category[] = ["trigger", "contested", "clean"];
  const diffs: FixtureDiff[] = [];
  for (const c of cats) for (const { name, category } of await listCases(c))
    diffs.push(await runOne(category, name));

  await mkdir(REPORTS_DIR, { recursive: true });
  await writeFile(new URL("labeled-report.json", REPORTS_DIR), JSON.stringify(diffs, null, 2));
  await writeFile(new URL("labeled-report.md", REPORTS_DIR), renderMarkdown(diffs));

  const failing = diffs.filter((d) => d.status === "fail").length;
  console.log(`Labeled fixtures: ${diffs.length} · failing: ${failing}`);
  console.log("Report written to packages/core/reports/labeled-report.md");
}

main().catch((err) => { console.error(err); process.exit(1); });
