import { describe, it, expect } from "vitest";
import { compatFor } from "../../src/rules/compat-lookup.js";
import type { DerivedCompat } from "../../src/types/index.js";

const COMPAT: Record<string, DerivedCompat> = {
  "css-display-flex": {
    support: [{ client: "outlook-windows", status: "unsupported" }],
    references: [{ title: "Can I Email", url: "https://www.caniemail.com/features/css-display-flex/", kind: "official" }],
    lastTested: "2021-11-02",
  },
  "css-at-import": {
    support: [{ client: "gmail-desktop-webmail", status: "unsupported" }],
    references: [{ title: "Can I Email", url: "https://www.caniemail.com/features/css-at-import/", kind: "official" }],
    lastTested: "2020-01-01",
  },
};

describe("compatFor", () => {
  it("resolves a single slug + stamps dataVersion/lastTested + merges alternatives", () => {
    const c = compatFor(["css-display-flex"], { alternatives: ["Table-based layout"] }, COMPAT, "test@abc (2020-01-01)");
    expect(c.support).toHaveLength(1);
    expect(c.references[0].url).toContain("css-display-flex");
    expect(c.lastTested).toBe("2021-11-02");
    expect(c.alternatives).toEqual(["Table-based layout"]);
    expect(c.dataVersion).toBe("test@abc (2020-01-01)");
  });

  it("merges multi-slug worst-case + min lastTested + union references", () => {
    const c = compatFor(["css-display-flex", "css-at-import"], {}, COMPAT);
    expect(c.support).toHaveLength(2);
    expect(c.references).toHaveLength(2);
    expect(c.lastTested).toBe("2020-01-01"); // min
  });

  it("throws on an unknown feature slug (drift guard)", () => {
    expect(() => compatFor(["css-display-flex", "nope"], {}, COMPAT)).toThrow(/unknown feature slug/);
  });
});
