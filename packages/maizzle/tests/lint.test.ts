import { describe, it, expect } from "vitest";
import { render } from "@maizzle/framework";
import { lint } from "../src/index.js";

const TRIGGER = "tests/fixture/emails/trigger.vue";

describe("full-pipeline rendering", () => {
  it("renders through the Tailwind pipeline (compiled CSS in output, not SSR-only HTML)", async () => {
    const { html } = await render(TRIGGER);
    // Spec finding 2: SSR-only input leaves raw classes; a path input
    // must produce compiled, inlined CSS. This assertion is the contract.
    expect(html).toMatch(/border-radius/);
    const m = html.match(/style="[^"]*border-radius[^"]*"/);
    expect(m).not.toBeNull();
  }, 30_000); // cold Vite SSR boot
});

describe("lint option pass-through", () => {
  it("passes rules overrides to analyze", async () => {
    const withRule = await lint(TRIGGER, { rules: { CSS_BORDER_RADIUS: "off" } });
    const without = await lint(TRIGGER);
    expect(withRule.issues.some((i) => i.ruleId === "CSS_BORDER_RADIUS")).toBe(false);
    expect(without.issues.some((i) => i.ruleId === "CSS_BORDER_RADIUS")).toBe(true);
  }, 60_000); // two sequential cold renders

  // gmail-desktop-webmail supports border-radius, so the compat rule is dropped
  // under that client scope. Canonical ClientId from the generated snapshot;
  // same ID as the MJML and react-email adapter tests.
  it("passes clients filter to analyze (rule dropped under a supporting client)", async () => {
    const filtered = await lint(TRIGGER, { clients: ["gmail-desktop-webmail"] });
    const unfiltered = await lint(TRIGGER);
    expect(unfiltered.issues.some((i) => i.ruleId === "CSS_BORDER_RADIUS")).toBe(true);
    expect(filtered.issues.some((i) => i.ruleId === "CSS_BORDER_RADIUS")).toBe(false);
  }, 60_000); // two sequential cold renders
});

describe("lint error contract", () => {
  it("propagates render exceptions unchanged", async () => {
    await expect(lint("tests/fixture/emails/nope.vue")).rejects.toThrow();
  }, 30_000); // cold Vite SSR boot
});
