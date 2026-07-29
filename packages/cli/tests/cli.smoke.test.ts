import { describe, it, expect } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join, resolve } from "node:path";

const pexec = promisify(execFile);
const BIN = resolve(import.meta.dirname, "..", "dist", "index.js");
const FX = join(import.meta.dirname, "fixtures");

const run = (args: string[]) => pexec("node", [BIN, ...args], { cwd: process.cwd() });

describe("cli smoke (built bin)", () => {
  it("clean file → exit 0, empty-issues summary", async () => {
    const { stdout } = await run([join(FX, "clean.html")]);
    expect(stdout).toMatch(/1 files, 0 issues/);
  });

  it("dirty file → exit 1, prints findings", async () => {
    const p = run([join(FX, "dirty.html")]);
    await expect(p).rejects.toMatchObject({ code: 1 });
    try {
      await p;
    } catch (e: unknown) {
      expect((e as { stdout: string }).stdout).toContain("SCRIPT_ELEMENT");
    }
  });

  it("--format json emits valid json with dataVersion", async () => {
    const { stdout } = await run([join(FX, "clean.html"), "--format", "json"]);
    const j = JSON.parse(stdout);
    expect(typeof j.dataVersion).toBe("string");
    expect(j.totals.files).toBe(1);
  });

  it("--help exits 0", async () => {
    const { stdout } = await run(["--help"]);
    expect(stdout).toContain("--format");
  });
});
