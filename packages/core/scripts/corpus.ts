import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { analyze } from "../src/engine.js";
import { rules } from "../src/rules/index.js";
import {
  aggregateByRule,
  computeZeroHit,
  distribution,
  topRuleIds,
  type Distribution,
  type RuleAggregate,
  type TemplateResult,
} from "./corpus/aggregate.js";

interface TemplateSummary {
  name: string;
  source: "synthetic" | "real";
  sizeBytes: number;
  score: number;
  issueCount: number;
  topRules: string[];
}

interface CorpusReport {
  generatedAt: string;
  engineVersion: string;
  gitCommit?: string;
  totals: {
    synthetic: number;
    real: number;
    templates: number;
    totalIssues: number;
  };
  distribution: Distribution;
  byRule: RuleAggregate[];
  byTemplate: TemplateSummary[];
  zeroHitRules: string[];
}

const SYNTHETIC_DIR = new URL("../tests/fixtures/corpus/synthetic/", import.meta.url);
const REAL_DIR = new URL("../tests/fixtures/corpus/real/", import.meta.url);
const REPORTS_DIR = new URL("../reports/", import.meta.url);

async function listHtml(dir: URL): Promise<{ name: string; url: URL }[]> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
  return entries
    .filter((name) => name.endsWith(".html"))
    .map((name) => ({ name, url: new URL(name, dir) }));
}

async function runTemplate(
  name: string,
  source: "synthetic" | "real",
  url: URL,
): Promise<TemplateResult> {
  const html = await readFile(url, "utf8");
  const sizeBytes = Buffer.byteLength(html, "utf8");
  const { score, issues } = analyze(html);
  return { name, source, sizeBytes, score, issues };
}

function renderMarkdown(report: CorpusReport): string {
  const pct = (n: number) => `${n.toFixed(1)}%`;
  const lines: string[] = [];
  lines.push("# Corpus Validation Report");
  lines.push("");
  lines.push(
    `Synthetic: ${report.totals.synthetic} · Real: ${report.totals.real} · Total issues: ${report.totals.totalIssues} · Engine v${report.engineVersion} · ${report.generatedAt}`,
  );
  if (report.gitCommit) lines.push(`Git: ${report.gitCommit}`);
  lines.push("");
  lines.push("## Issues per template");
  lines.push("");
  lines.push(
    `avg ${report.distribution.avg.toFixed(1)} · median ${report.distribution.median} · max ${report.distribution.max}`,
  );
  lines.push("");
  lines.push("## Per-rule prevalence");
  lines.push("");
  lines.push("| ruleId | severity | category | hits | templates | prevalence | sample |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const r of report.byRule) {
    const s = r.samples[0];
    const sample = s ? `${s.template}: ${s.message}` : "—";
    lines.push(
      `| ${r.ruleId} | ${r.severity} | ${r.category} | ${r.hits} | ${r.templateCount} | ${pct(r.templatePrevalence)} | ${sample} |`,
    );
  }
  lines.push("");
  lines.push("## Per-template summary");
  lines.push("");
  lines.push("| template | source | size | score | issues | top rules |");
  lines.push("|---|---|---|---|---|---|");
  for (const t of report.byTemplate) {
    lines.push(
      `| ${t.name} | ${t.source} | ${t.sizeBytes} | ${t.score} | ${t.issueCount} | ${t.topRules.join(", ") || "—"} |`,
    );
  }
  lines.push("");
  lines.push("## Zero-hit rules");
  lines.push("");
  lines.push(
    report.zeroHitRules.length
      ? report.zeroHitRules.join(", ")
      : "_(none — every registered rule fired at least once)_",
  );
  lines.push("");
  lines.push("## Reading guide");
  lines.push("");
  lines.push(
    "- **FP suspect:** high prevalence, especially on clean baselines (now in `tests/fixtures/labeled/clean/`).",
  );
  lines.push(
    "- **FN suspect:** a template known to be problematic but with a low issue count, or a rule in zero-hit that should fire on represented patterns.",
  );
  return lines.join("\n");
}

async function main(): Promise<void> {
  const pkg = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  ) as { version: string };

  const syntheticFiles = await listHtml(SYNTHETIC_DIR);
  const realFiles = await listHtml(REAL_DIR);

  if (realFiles.length === 0) {
    console.warn(
      "note: real/ corpus empty — add your own templates to packages/core/tests/fixtures/corpus/real/",
    );
  }

  const results: TemplateResult[] = [];
  for (const { name, url } of syntheticFiles) {
    results.push(await runTemplate(name, "synthetic", url));
  }
  for (const { name, url } of realFiles) {
    results.push(await runTemplate(name, "real", url));
  }

  const byRule = aggregateByRule(results);
  const dist = distribution(results);
  const registeredIds = rules.map((r) => r.id);
  const zeroHitRules = computeZeroHit(byRule, registeredIds);
  const totalIssues = results.reduce((acc, r) => acc + r.issues.length, 0);

  const byTemplate: TemplateSummary[] = results.map((r) => ({
    name: r.name,
    source: r.source,
    sizeBytes: r.sizeBytes,
    score: r.score,
    issueCount: r.issues.length,
    topRules: topRuleIds(r.issues, 5),
  }));

  const report: CorpusReport = {
    generatedAt: new Date().toISOString(),
    engineVersion: pkg.version,
    gitCommit: process.env.GIT_SHA,
    totals: {
      synthetic: syntheticFiles.length,
      real: realFiles.length,
      templates: results.length,
      totalIssues,
    },
    distribution: dist,
    byRule,
    byTemplate,
    zeroHitRules,
  };

  await mkdir(REPORTS_DIR, { recursive: true });
  await writeFile(
    new URL("corpus-report.json", REPORTS_DIR),
    JSON.stringify(report, null, 2),
  );
  await writeFile(
    new URL("corpus-report.md", REPORTS_DIR),
    renderMarkdown(report),
  );

  console.log(
    `Synthetic: ${syntheticFiles.length} · Real: ${realFiles.length} · Total issues: ${totalIssues}`,
  );
  console.log("Report written to packages/core/reports/corpus-report.md");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
