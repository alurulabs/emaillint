#!/usr/bin/env node
import { parseArgs, UsageError } from "./args.js";
import { run, NoFilesMatched } from "./run.js";
import { format } from "./reporter.js";
import { exitCode } from "./exit-code.js";

// Mirror packages/cli/package.json version (single source = bump both on release).
const VERSION = "0.9.0";

const USAGE = `emaillint <paths...> [options]

  --format <text|json>      output format (default: text)
  --rule <ID>=<LEVEL>       override a rule (LEVEL: off|info|warning|error); repeatable
  -h, --help                show help
  -v, --version             show version`;

async function main(): Promise<void> {
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
    rr = await run(opts.paths, opts.rules);
  } catch (e) {
    if (e instanceof NoFilesMatched) { process.stderr.write(`${e.message}\n`); process.exit(1); }
    process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
    process.exit(2);
  }
  process.stdout.write(`${format(rr, opts.format)}\n`);
  process.exit(exitCode(rr));
}

main();
