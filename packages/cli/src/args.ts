// packages/cli/src/args.ts
import type { CliOptions, Format } from "./types.js";
import type { RuleSetting } from "emaillint-core";
import { CLIENT_IDS, CLIENT_PRESETS } from "emaillint-core";

export class UsageError extends Error {}

export function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = { paths: [], format: "text", rules: {}, clientIds: [], help: false, version: false };
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
    if (a === "--preset") {
      const v = argv[++i];
      if (v === undefined) throw new UsageError("--preset requires a name");
      if (!(v in CLIENT_PRESETS)) throw new UsageError(`--preset must be one of: ${Object.keys(CLIENT_PRESETS).join(", ")} (got ${v})`);
      opts.preset = v;
      addClients(opts, CLIENT_PRESETS[v]);
      continue;
    }
    if (a.startsWith("--preset=")) {
      const v = a.slice("--preset=".length);
      if (!(v in CLIENT_PRESETS)) throw new UsageError(`--preset must be one of: ${Object.keys(CLIENT_PRESETS).join(", ")} (got ${v})`);
      opts.preset = v;
      addClients(opts, CLIENT_PRESETS[v]);
      continue;
    }
    if (a === "--clients") {
      const v = argv[++i];
      if (v === undefined) throw new UsageError("--clients requires a comma-separated ID list");
      parseClients(v, opts);
      continue;
    }
    if (a.startsWith("--clients=")) { parseClients(a.slice("--clients=".length), opts); continue; }
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

function addClients(opts: CliOptions, ids: readonly string[]): void {
  for (const id of ids) if (!opts.clientIds.includes(id)) opts.clientIds.push(id);
}

function parseClients(spec: string, opts: CliOptions): void {
  const known = CLIENT_IDS as readonly string[];
  const ids: string[] = [];
  for (const raw of spec.split(",")) {
    const id = raw.trim();
    if (!id) continue;
    if (!known.includes(id)) throw new UsageError(`--clients unknown client ID: ${id} (see: emaillint clients)`);
    ids.push(id);
  }
  if (ids.length === 0) throw new UsageError("--clients requires at least one client ID (see: emaillint clients)");
  addClients(opts, ids);
}

// Subcommand dispatch: "clients"/"presets" as the first positional arg list
// valid options. Anything else (paths, flags) returns null. Note: a file
// literally named "clients" with no extension is not lintable via the CLI.
export function resolveCommand(arg: string | undefined): "clients" | "presets" | null {
  return arg === "clients" || arg === "presets" ? arg : null;
}
