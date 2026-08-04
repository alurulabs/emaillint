import { readFile, writeFile } from "node:fs/promises";
import { relative, isAbsolute } from "node:path";
import {
  createBaseline, diffAgainstBaseline, parseBaseline, getCompatDataVersion,
  type AnalyzedFile, type BaselineFile, type ClientId,
} from "emaillint-core";
import type { RunResult, BaselineOutcome } from "./types.js";

export class BaselineNotFoundError extends Error {}
export class BaselineScopeError extends Error {}
export class BaselineParseError extends Error {}

interface RunBaselineArgs {
  mode: "check" | "update";
  baselinePath: string;
  clients?: string[];
}

// Relativize against the same base SARIF uses so gen and CI produce identical keys.
function relativize(p: string): string {
  const base = process.env.GITHUB_WORKSPACE ?? process.cwd();
  return isAbsolute(p) ? relative(base, p) : p;
}

function toAnalyzed(rr: RunResult): AnalyzedFile[] {
  const out: AnalyzedFile[] = [];
  for (const f of rr.results) {
    if ("result" in f && f.ctx) out.push({ path: relativize(f.path), issues: f.result.issues, ctx: f.ctx });
  }
  return out;
}

function setEqual(a: string[] | undefined, b: string[] | undefined): boolean {
  const sa = new Set(a ?? []);
  const sb = new Set(b ?? []);
  return sa.size === sb.size && [...sa].every((x) => sb.has(x));
}

export async function runBaseline(args: RunBaselineArgs, rr: RunResult): Promise<BaselineOutcome> {
  const files = toAnalyzed(rr);
  const clients = (args.clients?.length ? args.clients : undefined) as ClientId[] | undefined;

  if (args.mode === "update") {
    const baseline = createBaseline(files, { clients });
    await writeFile(args.baselinePath, JSON.stringify(baseline, null, 2), "utf8");
    return { mode: "update", newErrors: [], suppressed: 0, writtenPath: args.baselinePath };
  }

  // check mode
  let raw: string;
  try {
    raw = await readFile(args.baselinePath, "utf8");
  } catch {
    throw new BaselineNotFoundError(`baseline not found at ${args.baselinePath}; run --update-baseline first`);
  }
  let baseline: BaselineFile;
  try {
    baseline = parseBaseline(JSON.parse(raw));
  } catch (e) {
    throw new BaselineParseError(`baseline at ${args.baselinePath} is invalid: ${e instanceof Error ? e.message : String(e)}`);
  }

  // client-scope guard (set-equal, order-independent; presence must match both sides)
  if (!setEqual(baseline.clients, clients)) {
    throw new BaselineScopeError(
      `baseline generated under clients=[${(baseline.clients ?? []).join(",")}]; re-run with matching clients or regenerate with --update-baseline`,
    );
  }

  // compat-data drift: warn, do not fail
  let compatWarning: string | undefined;
  const currentData = getCompatDataVersion();
  if (baseline.compatDataVersion && baseline.compatDataVersion !== currentData) {
    compatWarning = `compat data updated since baseline (${baseline.compatDataVersion} -> ${currentData}); compat issues may appear new; re-run --update-baseline if expected`;
  }

  const { newErrors, suppressed } = diffAgainstBaseline(files, baseline);
  return { mode: "check", newErrors, suppressed, compatWarning };
}
