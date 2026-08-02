import { describe, it, expect } from "vitest";
import { parseFeatureFrontMatter } from "../../scripts/compat/parse.js";
import { deriveSlug } from "../../src/rules/compat-derive.js";
import { deriveFixtureCompat, COMPAT_SLUGS, clientIdsOf, parseNicenames } from "../../scripts/sync-compat.js";
import { COMPAT } from "../../src/generated/compat-data.js";

// A realistic caniemail feature .md (quirky front matter: unquoted keys, trailing commas, notes).
const FLEXBOX_MD = `---
title: "display:flex"
last_test_date: "2021-11-02"
stats: {
  outlook: {
    windows: { "2007": "n" },
    macos: { "2019-02": "y" },
  },
  gmail: {
    desktop-webmail: { "2019-02": "y" },
  },
}
notes_by_num: {}
---
body`;

describe("sync golden (offline)", () => {
  it("parses + derives a real caniemail fixture end-to-end", () => {
    const d = deriveSlug(parseFeatureFrontMatter(FLEXBOX_MD, "css-display-flex"));
    expect(d.support.map((s) => s.client).sort()).toEqual([
      "gmail-desktop-webmail",
      "outlook-macos",
      "outlook-windows",
    ]);
    expect(d.support.find((s) => s.client === "outlook-windows")?.status).toBe("unsupported");
    expect(d.support.find((s) => s.client === "gmail-desktop-webmail")?.status).toBe("supported");
    expect(d.references[0].url).toBe("https://www.caniemail.com/features/css-display-flex/");
    expect(d.lastTested).toBe("2021-11-02");
  });

  it("deriveFixtureCompat throws on a missing slug (orphan guard)", () => {
    const input: Record<string, string> = {};
    for (const s of COMPAT_SLUGS.slice(0, -1)) input[s] = FLEXBOX_MD; // all but last
    expect(() => deriveFixtureCompat(input)).toThrow(/missing feature files/);
  });

  it("committed artifact keys == COMPAT_SLUGS (artifact-level drift guard)", () => {
    expect(Object.keys(COMPAT).sort()).toEqual([...COMPAT_SLUGS].sort());
  });
});

describe("clientIdsOf", () => {
  it("returns the sorted union of client keys across features", () => {
    const COMPAT = {
      a: {
        support: [
          { client: "gmail-ios", status: "supported" },
          { client: "outlook-windows", status: "unsupported" },
        ],
        references: [],
      },
      b: {
        support: [{ client: "gmail-ios", status: "supported" }],
        references: [],
      },
    };
    expect(clientIdsOf(COMPAT as never)).toEqual(["gmail-ios", "outlook-windows"]);
  });
});

const NICENAMES_FIXTURE = `family:
  outlook: "Outlook"
  gmail: "Gmail"
  apple-mail: "Apple Mail"
platform:
  desktop-webmail: "Desktop Webmail"
  macos: "macOS"
  windows-mail: "Windows Mail"
  windows: "Windows"
support:
  supported: "Supported"
category:
  css: "CSS"
`;

describe("parseNicenames", () => {
  it("extracts family + platform maps, ignores other sections", () => {
    const n = parseNicenames(NICENAMES_FIXTURE);
    expect(n.family).toEqual({ outlook: "Outlook", gmail: "Gmail", "apple-mail": "Apple Mail" });
    expect(n.platform).toEqual({
      "desktop-webmail": "Desktop Webmail",
      macos: "macOS",
      "windows-mail": "Windows Mail",
      windows: "Windows",
    });
  });
});
