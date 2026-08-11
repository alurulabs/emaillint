import { describe, it, expect } from "vitest";
import { lint } from "../src/index.js";
import { Html, Body, Text } from "@react-email/components";
import type { ReactElement } from "react";

// Explicit rule trigger: react-email components are unstyled by default, so an
// inline border-radius is required to guarantee CSS_BORDER_RADIUS fires (the
// MJML adapter got this from <mj-button>; here it is authored, not generated).
const WithRadius = (): ReactElement => (
  <Html>
    <Body>
      <div style={{ borderRadius: 8 }}>rounded</div>
      <Text>body</Text>
    </Body>
  </Html>
);

describe("lint option pass-through", () => {
  it("passes rules overrides to analyze", async () => {
    const withRule = await lint(<WithRadius />, { rules: { CSS_BORDER_RADIUS: "off" } });
    const without = await lint(<WithRadius />);
    expect(withRule.issues.some((i) => i.ruleId === "CSS_BORDER_RADIUS")).toBe(false);
    expect(without.issues.some((i) => i.ruleId === "CSS_BORDER_RADIUS")).toBe(true);
  });

  // gmail-desktop-webmail supports border-radius, so the compat rule is dropped
  // under that client scope. This is the canonical ClientId (sourced from the
  // generated snapshot); the same ID is used in the MJML adapter's test.
  it("passes clients filter to analyze (rule dropped under a supporting client)", async () => {
    const filtered = await lint(<WithRadius />, { clients: ["gmail-desktop-webmail"] });
    const unfiltered = await lint(<WithRadius />);
    expect(unfiltered.issues.some((i) => i.ruleId === "CSS_BORDER_RADIUS")).toBe(true);
    expect(filtered.issues.some((i) => i.ruleId === "CSS_BORDER_RADIUS")).toBe(false);
  });
});

describe("lint error contract", () => {
  it("does not catch or transform render exceptions", async () => {
    const Thrower = (): ReactElement => {
      throw new Error("boom");
    };
    // The adapter must not swallow the renderer's error; "boom" reaches the caller.
    await expect(lint(<Thrower />)).rejects.toThrow("boom");
  });
});
