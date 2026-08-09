import { describe, it, expect, vi } from "vitest";

// Wrap mjml2html in a vi.fn seeded with the real implementation. The sanity
// tests below stay end-to-end (real mjml renders BASIC_MJML). Error-contract
// tests override the render output for cases mjml v5 never produces itself:
// mjml v5 always returns a full HTML document on success or throws, so the
// no-HTML guard in renderInternal is otherwise unreachable via real input.
vi.mock("mjml", async () => {
  const actual = await vi.importActual<typeof import("mjml")>("mjml");
  return { default: vi.fn(actual.default) };
});

import mjml2html from "mjml";
import { lint } from "../src/index.js";

const BASIC_MJML = `<mjml><mj-body><mj-section><mj-column><mj-text>Hello</mj-text></mj-column></mj-section></mj-body></mjml>`;

describe("lint", () => {
  it("renders MJML and returns an AnalysisResult with score and issues", async () => {
    const result = await lint(BASIC_MJML);
    expect(typeof result.score).toBe("number");
    expect(Array.isArray(result.issues)).toBe(true);
  });

  it("produces HTML that emaillint actually analyzed (score is finite in [0,100])", async () => {
    const result = await lint(BASIC_MJML);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

describe("lint error contract", () => {
  it("throws an adapter error when MJML produces no HTML", async () => {
    // mjml v5 never returns an empty html string on success (it always emits a
    // full HTML document, or throws). Override the render to return empty html:
    // the invariant is "no rendered HTML -> adapter throws an @emaillint/mjml error."
    vi.mocked(mjml2html).mockResolvedValueOnce({ html: "", errors: [] } as never);

    await expect(lint("<mjml></mjml>")).rejects.toThrow(/produced no HTML/);
  });

  it("propagates MJML's own exceptions unchanged (no wrapping)", async () => {
    // A non-string input makes mjml2html throw. The adapter must NOT wrap it.
    await expect(lint(undefined as unknown as string)).rejects.toThrow();
    // Confirm the thrown error is NOT the adapter's own message (i.e. not wrapped):
    try {
      await lint(undefined as unknown as string);
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as Error).message).not.toMatch(/@emaillint\/mjml/);
    }
  });
});
