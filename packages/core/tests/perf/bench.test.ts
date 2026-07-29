import { describe, expect, it } from "vitest";
import { analyze } from "../../src/engine.js";

function synthesize(targetBytes: number): string {
  const cell = '<td><img src="https://x/y.png" alt="z" style="border-radius:8px;display:flex"></td>';
  const row = `<tr>${cell.repeat(10)}</tr>`;
  const table = `<table>${row.repeat(50)}</table>`;
  let html = table;
  while (Buffer.byteLength(html, "utf8") < targetBytes) html += table;
  return html.slice(0, targetBytes);
}

describe("benchmark", () => {
  it("analyzes 100KB well under 100ms (documented target, not a CI gate)", () => {
    const html = synthesize(100 * 1024);
    const t = performance.now();
    analyze(html);
    const ms = performance.now() - t;
    // Soft expectation: log + assert a generous ceiling so gross regressions surface locally.
    console.log(`100KB analyzed in ${ms.toFixed(1)}ms`);
    expect(ms).toBeLessThan(500);
  });

  it("scales roughly linearly (500KB ≈ <5x of 100KB)", () => {
    const t1 = performance.now(); analyze(synthesize(100 * 1024)); const a = performance.now() - t1;
    const t2 = performance.now(); analyze(synthesize(500 * 1024)); const b = performance.now() - t2;
    console.log(`100KB=${a.toFixed(1)}ms 500KB=${b.toFixed(1)}ms ratio=${(b / a).toFixed(2)}`);
    expect(b / a).toBeLessThan(6); // O(n) guard, not a hard CI gate
  });
});
