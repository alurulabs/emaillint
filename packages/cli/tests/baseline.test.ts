import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeFile, mkdir, rm, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { runBaseline, BaselineNotFoundError, BaselineScopeError } from "../src/baseline.js";
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

describe("runBaseline: client-scope guard", () => {
  it("baseline with clients, run without -> BaselineScopeError", async () => {
    await writeFile(htmlPath, htmlWithScript);
    await runBaseline({ mode: "update", baselinePath, clients: ["gmail-ios"] }, await rr());
    await expect(runBaseline({ mode: "check", baselinePath }, await rr())).rejects.toBeInstanceOf(BaselineScopeError);
  });
});
