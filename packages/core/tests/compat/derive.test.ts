import { describe, it, expect } from "vitest";
import { deriveSlug, mergeSlugs } from "../../src/rules/compat-derive.js";
import type { FeatureData } from "../../src/types/index.js";

const feat = (slug: string, stats: FeatureData["stats"], notes: Record<string, string> = {}, last?: string): FeatureData =>
  ({ slug, stats, notesByNum: notes, lastTested: last });

describe("deriveSlug", () => {
  it("takes last entry in document order as current status + attaches note", () => {
    const d = deriveSlug(feat("x", { gmail: { ios: { "2019-02": "y", "2020-11": "a #1" } } }, { "1": "note" }));
    const ios = d.support.find((s) => s.client === "gmail-ios");
    expect(ios?.status).toBe("partial");
    expect(ios?.note).toBe("note");
  });

  it("maps y/n/a", () => {
    const d = deriveSlug(feat("x", {
      a: { p: { "1": "y" } },
      b: { p: { "1": "n" } },
      c: { p: { "1": "a" } },
    }));
    // Synthetic ids ("a-p" etc.) are not real ClientIds; compare as strings.
    expect(d.support.find((s) => (s.client as string) === "a-p")?.status).toBe("supported");
    expect(d.support.find((s) => (s.client as string) === "b-p")?.status).toBe("unsupported");
    expect(d.support.find((s) => (s.client as string) === "c-p")?.status).toBe("partial");
  });

  it("forms references from the slug", () => {
    const d = deriveSlug(feat("css-display-flex", {}));
    expect(d.references[0].url).toBe("https://www.caniemail.com/features/css-display-flex/");
  });

  it("carries lastTested", () => {
    const d = deriveSlug(feat("x", {}, {}, "2021-11-02"));
    expect(d.lastTested).toBe("2021-11-02");
  });
});

describe("mergeSlugs", () => {
  it("worst-case over union of cells (unsupported > partial > supported)", () => {
    const a = deriveSlug(feat("a", { gmail: { ios: { "1": "y" } } }));
    const b = deriveSlug(feat("b", { gmail: { ios: { "1": "n" } } }));
    const m = mergeSlugs([a, b]);
    expect(m.support.find((s) => s.client === "gmail-ios")?.status).toBe("unsupported");
    expect(m.references).toHaveLength(2);
  });

  it("takes min lastTested across slugs", () => {
    const a = deriveSlug(feat("a", {}, {}, "2021-11-02"));
    const b = deriveSlug(feat("b", {}, {}, "2020-01-01"));
    expect(mergeSlugs([a, b]).lastTested).toBe("2020-01-01");
  });
});
