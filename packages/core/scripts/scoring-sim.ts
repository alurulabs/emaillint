// Compare the legacy linear scoring model against the current model over the
// full corpus. Dev tool — output is gitignored (reports/). Re-run on corpus
// expansion (calibration §8 process loop). See calibration §9.
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { analyze } from "../src/engine.js";
import { calculateScore } from "../src/scoring/index.js";
import type { Issue } from "../src/types/index.js";

// Legacy model (pre-2026-07-27): linear, info=1, uncapped. Inlined here as the
// comparison baseline so the sim stays valid regardless of future model changes.
const LEGACY_PENALTY: Record<Issue["severity"], number> = { error: 15, warning: 5, info: 1 };
function legacyScore(issues: Issue[]): number {
  const total = issues.reduce((s, i) => s + LEGACY_PENALTY[i.severity], 0);
  return Math.max(0, 100 - total);
}

const SYNTHETIC_DIR = new URL("../tests/fixtures/corpus/synthetic/", import.meta.url);
const REAL_DIR = new URL("../tests/fixtures/corpus/real/", import.meta.url);
const REPORTS_DIR = new URL("../reports/", import.meta.url);

async function listHtml(dir: URL) {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
  return entries.filter((n) => n.endsWith(".html")).map((n) => ({ name: n, url: new URL(n, dir) }));
}

interface Row {
  name: string;
  source: string;
  legacy: number;
  current: number;
  delta: number;
}

async function main() {
  const rows: Row[] = [];
  for (const [dir, source] of [[SYNTHETIC_DIR, "synthetic"], [REAL_DIR, "real"]] as const) {
    for (const { name, url } of await listHtml(dir)) {
      const html = await readFile(url, "utf8");
      const { score, issues } = analyze(html);
      const legacy = legacyScore(issues);
      rows.push({ name, source, legacy, current: score, delta: score - legacy });
    }
  }

  const avg = (f: (r: Row) => number) =>
    Number((rows.reduce((s, r) => s + f(r), 0) / rows.length).toFixed(1));
  const zeros = (f: (r: Row) => number) => rows.filter((r) => f(r) === 0).length;

  const summary = {
    templates: rows.length,
    legacyAvg: avg((r) => r.legacy),
    currentAvg: avg((r) => r.current),
    legacyZero: zeros((r) => r.legacy),
    currentZero: zeros((r) => r.current),
  };

  const bottom5 = [...rows]
    .sort((a, b) => a.current - b.current || a.name.localeCompare(b.name))
    .slice(0, 5);
  const ugg = rows.find((r) => r.name.includes("ugg-royale"));
  const uggLowest = ugg ? rows.every((r) => r.current >= ugg.current) : false;

  await mkdir(REPORTS_DIR, { recursive: true });
  await writeFile(
    new URL("scoring-sim.json", REPORTS_DIR),
    JSON.stringify({ summary, bottom5, ugg: ugg ?? null, rows }, null, 2),
  );

  const md = [
    "# Scoring Simulation — legacy vs current",
    "",
    `Templates: ${summary.templates}`,
    `avg: legacy ${summary.legacyAvg} · current ${summary.currentAvg} · Δ +${(summary.currentAvg - summary.legacyAvg).toFixed(1)}`,
    `score=0: legacy ${summary.legacyZero} · current ${summary.currentZero}`,
    "",
    "## Bottom 5 by current score",
    "",
    "| template | source | legacy | current | Δ |",
    "|---|---|---|---|---|",
    ...bottom5.map((r) => `| ${r.name} | ${r.source} | ${r.legacy} | ${r.current} | +${r.delta} |`),
    "",
    ugg
      ? `ugg-royale: legacy ${ugg.legacy} · current ${ugg.current} · lowest = ${uggLowest ? "yes" : "no"}`
      : "ugg-royale: not found in corpus",
    "",
  ].join("\n");
  await writeFile(new URL("scoring-sim.md", REPORTS_DIR), md);

  console.log(JSON.stringify(summary, null, 2));
  if (ugg) console.log(`ugg-royale: legacy ${ugg.legacy} · current ${ugg.current} · lowest = ${uggLowest ? "yes" : "no"}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
