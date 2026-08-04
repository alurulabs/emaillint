import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeFile, mkdir, rm, readFile } from "node:fs/promises";
import { writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, relative } from "node:path";
import { runBaseline, BaselineNotFoundError, BaselineScopeError, BaselineParseError } from "../src/baseline.js";
import { run } from "../src/run.js";

const dir = join(import.meta.dirname, "tmp-baseline");
const htmlPath = join(dir, "t.html");
const baselinePath = join(dir, ".emaillint-baseline.json");

// SCRIPT_ELEMENT is error-severity by default, so it enters the baseline.
const htmlWithScript = `<script>var x=1;</script>`;

beforeEach(async () => { await mkdir(dir, { recursive: true }); });
afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

async function rr() {
  return run([htmlPath], { collectCtx: true });
}

// relativize() in baseline.ts resolves against GITHUB_WORKSPACE ?? process.cwd().
// In the test env GITHUB_WORKSPACE is unset and cwd is packages/cli (an ancestor
// of htmlPath), so the stored key is the cwd-relative path, not htmlPath.
const expectedKey = () => relative(process.cwd(), htmlPath);

describe("runBaseline: update mode", () => {
  it("creates a baseline file from current errors", async () => {
    await writeFile(htmlPath, htmlWithScript);
    const outcome = await runBaseline({ mode: "update", baselinePath }, await rr());
    expect(outcome.mode).toBe("update");
    expect(outcome.writtenPath).toBe(baselinePath);
    const written = JSON.parse(await readFile(baselinePath, "utf8"));
    expect(written.version).toBe(1);
    expect(written.fingerprintVersion).toBe(1);
    const storedKey = Object.keys(written.files)[0];
    expect(storedKey).toBe(expectedKey());
    expect(written.files[storedKey]["SCRIPT_ELEMENT#script#"]).toBe(1);
  });
});

describe("runBaseline: check mode", () => {
  it("no new errors -> empty newErrors, suppressed counts the known one", async () => {
    await writeFile(htmlPath, htmlWithScript);
    await runBaseline({ mode: "update", baselinePath }, await rr());
    const outcome = await runBaseline({ mode: "check", baselinePath }, await rr());
    expect(outcome.newErrors).toEqual([]);
    expect(outcome.suppressed).toBe(1);
  });

  it("new error -> flagged", async () => {
    await writeFile(htmlPath, htmlWithScript);
    await runBaseline({ mode: "update", baselinePath }, await rr());
    await writeFile(htmlPath, `<script>var x=1;</script><script>var y=2;</script>`);
    const outcome = await runBaseline({ mode: "check", baselinePath }, await rr());
    expect(outcome.newErrors).toHaveLength(1);
    expect(outcome.newErrors[0].count).toBe(1);
  });

  it("missing baseline file -> BaselineNotFoundError", async () => {
    await writeFile(htmlPath, htmlWithScript);
    await expect(runBaseline({ mode: "check", baselinePath }, await rr())).rejects.toBeInstanceOf(BaselineNotFoundError);
  });
});

describe("runBaseline: invalid baseline file", () => {
  it("invalid JSON -> BaselineParseError", async () => {
    await writeFile(htmlPath, htmlWithScript);
    writeFileSync(baselinePath, `{not json`);
    await expect(runBaseline({ mode: "check", baselinePath }, await rr())).rejects.toBeInstanceOf(BaselineParseError);
  });

  it("schema mismatch -> BaselineParseError", async () => {
    await writeFile(htmlPath, htmlWithScript);
    writeFileSync(baselinePath, JSON.stringify({ version: 99, fingerprintVersion: 1, files: {} }));
    await expect(runBaseline({ mode: "check", baselinePath }, await rr())).rejects.toBeInstanceOf(BaselineParseError);
  });
});

describe("runBaseline: client-scope guard", () => {
  it("baseline with clients, run without -> BaselineScopeError", async () => {
    await writeFile(htmlPath, htmlWithScript);
    await runBaseline({ mode: "update", baselinePath, clients: ["gmail-ios"] }, await rr());
    await expect(runBaseline({ mode: "check", baselinePath }, await rr())).rejects.toBeInstanceOf(BaselineScopeError);
  });

  it("baseline without clients, run with clients -> BaselineScopeError", async () => {
    await writeFile(htmlPath, htmlWithScript);
    await runBaseline({ mode: "update", baselinePath }, await rr());
    await expect(runBaseline({ mode: "check", baselinePath, clients: ["gmail-ios"] }, await rr())).rejects.toBeInstanceOf(BaselineScopeError);
  });
});

// End-to-end through the built CLI binary (dist/index.js). The dist is built by
// `npm run build` before the suite runs (same convention as cli.smoke.test.ts).
function cli(args: string[]): { code: number; stdout: string; stderr: string } {
  const bin = join(import.meta.dirname, "..", "dist", "index.js");
  try {
    const stdout = execFileSync(process.execPath, [bin, ...args], { encoding: "utf8", cwd: dir });
    return { code: 0, stdout, stderr: "" };
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; status?: number };
    return { code: err.status ?? 1, stdout: err.stdout ?? "", stderr: err.stderr ?? "" };
  }
}

describe("CLI baseline end-to-end (subprocess)", () => {
  it("generate -> check (green) -> add error (red) -> update -> check (green)", () => {
    const baselineFile = join(dir, "bl.json");
    writeFileSync(htmlPath, `<script>x</script>`);
    // generate (update) -> exit 0
    let r = cli(["--update-baseline", baselineFile, htmlPath]);
    expect(r.code).toBe(0);
    // check: green (the script is baselined)
    r = cli(["--baseline", baselineFile, htmlPath]);
    expect(r.code).toBe(0);
    // add a second script -> new error -> red
    writeFileSync(htmlPath, `<script>x</script><script>y</script>`);
    r = cli(["--baseline", baselineFile, htmlPath]);
    expect(r.code).toBe(1);
    expect(r.stdout).toContain("new");
    // JSON baseline output via the binary (state: 1 new error)
    const rj = cli(["--baseline", baselineFile, "--format", "json", htmlPath]);
    const j = JSON.parse(rj.stdout);
    expect(j.baseline.newErrors).toHaveLength(1);
    expect(typeof j.baseline.suppressed).toBe("number");
    // SARIF baseline output via the binary
    const rs = cli(["--baseline", baselineFile, "--format", "sarif", htmlPath]);
    expect(JSON.parse(rs.stdout).runs[0].results).toHaveLength(1);
    // update absorbs it -> green
    r = cli(["--update-baseline", baselineFile, htmlPath]);
    expect(r.code).toBe(0);
    r = cli(["--baseline", baselineFile, htmlPath]);
    expect(r.code).toBe(0);
  });

  it("missing baseline -> exit 2", () => {
    writeFileSync(htmlPath, `<script>x</script>`);
    const r = cli(["--baseline", join(dir, "nope.json"), htmlPath]);
    expect(r.code).toBe(2);
    expect(r.stderr.toLowerCase()).toContain("not found");
  });

  it("invalid baseline file -> exit 2", () => {
    writeFileSync(htmlPath, `<script>x</script>`);
    const baselineFile = join(dir, "bad.json");
    writeFileSync(baselineFile, `{not json`);
    const r = cli(["--baseline", baselineFile, htmlPath]);
    expect(r.code).toBe(2);
    expect(r.stderr.toLowerCase()).toContain("invalid");
  });
});
