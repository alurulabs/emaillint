#!/usr/bin/env node
import { parseArgs, UsageError, resolveCommand } from "./args.js";
import { run, NoFilesMatched } from "./run.js";
import { format } from "./reporter.js";
import { exitCode } from "./exit-code.js";
import { CLIENT_IDS, CLIENT_PRESETS } from "emaillint-core";
import type { ClientId } from "emaillint-core";
import { VERSION } from "./version.js";

const USAGE = `emaillint <paths...> [options]

  --format <text|json|sarif>  output format (default: text)
  --rule <ID>=<LEVEL>         override a rule (LEVEL: off|info|warning|error); repeatable
  --preset <name>             target a client preset (outlook|gmail|apple-mail|yahoo|all)
  --clients <id,id,...>       target specific caniemail client IDs (see: emaillint clients)
  -h, --help                  show help
  -v, --version               show version`;

async function main(): Promise<void> {
  const sub = resolveCommand(process.argv[2]);
  if (sub === "clients") { process.stdout.write(`${[...CLIENT_IDS].join("\n")}\n`); process.exit(0); }
  if (sub === "presets") { process.stdout.write(`${Object.keys(CLIENT_PRESETS).join("\n")}\n`); process.exit(0); }

  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    process.stderr.write(`${e instanceof UsageError ? e.message : String(e)}\n${USAGE}\n`);
    process.exit(2);
  }
  if (opts.help) { process.stdout.write(`${USAGE}\n`); process.exit(0); }
  if (opts.version) { process.stdout.write(`${VERSION}\n`); process.exit(0); }
  if (opts.paths.length === 0) { process.stderr.write(`${USAGE}\n`); process.exit(2); }

  let rr;
  try {
    rr = await run(opts.paths, { rules: opts.rules, clients: opts.clientIds as ClientId[] });
  } catch (e) {
    if (e instanceof NoFilesMatched) { process.stderr.write(`${e.message}\n`); process.exit(1); }
    process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
    process.exit(2);
  }
  process.stdout.write(`${format(rr, opts.format)}\n`);
  process.exit(exitCode(rr));
}

main();
