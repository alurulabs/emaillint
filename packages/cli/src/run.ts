// packages/cli/src/run.ts
import { glob, isDynamicPattern } from "tinyglobby";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { analyze, buildEmailContext } from "emaillint-core";
import type { RuleSetting, ClientId } from "emaillint-core";
import type { RunResult, FileResult } from "./types.js";

export class NoFilesMatched extends Error {
  constructor(patterns: string[]) {
    super(`no files matched: ${patterns.join(" ")}`);
    this.name = "NoFilesMatched";
  }
}

export async function run(
  paths: string[],
  opts: { rules?: Record<string, RuleSetting>; clients?: ClientId[]; collectCtx?: boolean },
): Promise<RunResult> {
  // tinyglobby returns cwd-relative paths and silently drops literal paths
  // that don't exist on disk. Keep literal inputs (resolved to absolute) so a
  // missing file surfaces as a readError (not NoFilesMatched), absolute output
  // lines up with glob's, and overlaps dedup in the Set below.
  const matched = await glob(paths, { absolute: true });
  const literals = paths.filter((p) => !isDynamicPattern(p)).map((p) => resolve(p));
  const all = [...new Set([...literals, ...matched])];
  if (all.length === 0) throw new NoFilesMatched(paths);
  const sorted = all.sort();
  const results: FileResult[] = [];
  for (const path of sorted) {
    try {
      const html = await readFile(path, "utf8");
      const result = analyze(html, { rules: opts.rules, clients: opts.clients });
      results.push(
        opts.collectCtx
          ? { path, result, ctx: buildEmailContext(html) } // ponytail: double-parse; share ctx out of analyze() if profiling demands
          : { path, result },
      );
    } catch (e) {
      results.push({ path, readError: e instanceof Error ? e.message : String(e) });
    }
  }
  return { results, clients: opts.clients };
}
