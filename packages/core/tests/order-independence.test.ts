import { describe, expect, it } from "vitest";
import { analyze } from "../src/engine.js";
import { rules } from "../src/rules/index.js";

describe("rule-order independence", () => {
  const html = "<!DOCTYPE html><html lang=en><head><title>x</title></head><body>"
    + '<div style="display:flex; border-radius:8px"></div>'
    + "<script>x()</script><h1></h1></body></html>";

  function canonical() {
    return analyze(html).issues
      .map((i) => `${i.ruleId}:${i.line ?? 0}:${i.column ?? 0}`)
      .sort()
      .join("|");
  }

  it("produces the same sorted issue set regardless of rule order", () => {
    const baseline = canonical();
    // Reverse the shared registry, measure, then restore — proves the engine
    // has no order-dependent state. try/finally so the shared `rules` array is
    // always restored even if canonical() throws.
    rules.reverse();
    try {
      const reversed = canonical();
      expect(reversed).toBe(baseline);
    } finally {
      rules.reverse(); // restore original order
    }
    expect(canonical()).toBe(baseline); // restored cleanly
  });
});
