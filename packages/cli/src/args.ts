// packages/cli/src/args.ts
import type { CliOptions, Format } from "./types.js";
import type { RuleSetting } from "emaillint-core";

export class UsageError extends Error {}

export function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = { paths: [], format: "text", rules: {}, help: false, version: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") { opts.help = true; continue; }
    if (a === "-v" || a === "--version") { opts.version = true; continue; }
    if (a === "--format") {
      const v = argv[++i];
      if (v !== "text" && v !== "json") throw new UsageError(`--format must be text or json (got ${v ?? "nothing"})`);
      opts.format = v as Format;
      continue;
    }
    if (a === "--rule") {
      const v = argv[++i];
      if (v === undefined) throw new UsageError("--rule requires ID=LEVEL");
      parseRule(v, opts.rules);
      continue;
    }
    if (a.startsWith("--rule=")) { parseRule(a.slice("--rule=".length), opts.rules); continue; }
    if (a.startsWith("--")) throw new UsageError(`unknown flag: ${a}`);
    opts.paths.push(a);
  }
  return opts;
}

function parseRule(spec: string, rules: Record<string, RuleSetting>): void {
  const m = spec.match(/^([A-Z][A-Z0-9_]*)=(off|info|warning|error)$/);
  if (!m) throw new UsageError(`--rule expects ID=LEVEL (off|info|warning|error), got: ${spec}`);
  rules[m[1]] = m[2] as RuleSetting;
}
