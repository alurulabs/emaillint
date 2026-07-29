import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { analyze } from "../../src/engine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LABELED_DIR = path.resolve(__dirname, "../fixtures/labeled");

interface ExpectedSpec {
  expected?: string[];
  strict?: boolean;
}

// Each fixture = <name>.html + <name>.expected.json (sibling).
// strict:true  -> emitted ruleId-set must EQUAL expected (clean / FP-regression).
// strict:false -> expected must be a SUBSET of emitted (recall guard; extras are
//                 FP-candidates surfaced by scripts/labeled.ts, not test failures).
function loadCases(subdir: string) {
  const dir = path.join(LABELED_DIR, subdir);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".html"))
    .map((f) => f.slice(0, -".html".length));
}

function runCase(subdir: string, name: string) {
  const htmlPath = path.join(LABELED_DIR, subdir, `${name}.html`);
  const specPath = path.join(LABELED_DIR, subdir, `${name}.expected.json`);
  const html = readFileSync(htmlPath, "utf8");
  const actual = analyze(html).issues.map((i) => i.ruleId).sort();
  const spec: ExpectedSpec = existsSync(specPath)
    ? JSON.parse(readFileSync(specPath, "utf8"))
    : {};
  const expected = (spec.expected ?? []).slice().sort();

  if (process.env.UPDATE_EXPECTED === "1") {
    const next: ExpectedSpec = { expected: actual };
    if (spec.strict) next.strict = true;
    writeFileSync(specPath, JSON.stringify(next, null, 2) + "\n");
    return;
  }
  // recall: every expected rule must fire
  for (const id of expected) expect(actual).toContain(id);
  // strict: nothing else may fire
  if (spec.strict) expect(actual).toEqual(expected);
}

// Register a describe only for subdirs that have >=1 fixture, so an empty/absent
// subdir does not produce a "No test found in suite" failure. Coverage of empty
// subdirs is validated separately by scripts/labeled.ts.
const SUBDIRS = ["trigger", "contested", "clean"] as const;
for (const subdir of SUBDIRS) {
  const cases = loadCases(subdir);
  if (cases.length === 0) continue;
  describe(`labeled ${subdir}`, () => {
    for (const name of cases) {
      it(`${name} matches its expected spec`, () => runCase(subdir, name));
    }
  });
}

// Negative control: proves an empty strict-clean result is meaningful —
// analyze() does fire on bad input. Folded in from the former clean-baseline.test.ts.
describe("labeled negative control", () => {
  it("a deliberately dirty snippet does produce issues", () => {
    const { issues } = analyze('<img src="a.png"><a>no link</a>');
    expect(issues.length).toBeGreaterThan(0);
  });
});
