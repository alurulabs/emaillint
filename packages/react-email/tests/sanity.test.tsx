import { describe, it, expect } from "vitest";
import { lint } from "../src/index.js";
import { Html, Body, Text } from "@react-email/components";

const Hello = () => (
  <Html>
    <Body>
      <Text>Hi</Text>
    </Body>
  </Html>
);

describe("lint sanity", () => {
  it("renders a react-email template and returns an AnalysisResult", async () => {
    const result = await lint(<Hello />);
    expect(typeof result.score).toBe("number");
    expect(Array.isArray(result.issues)).toBe(true);
  });

  it("produces HTML that emaillint analyzed (score is finite in [0,100])", async () => {
    const result = await lint(<Hello />);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
