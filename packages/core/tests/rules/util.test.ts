import { describe, it, expect } from "vitest";
import { isFontUrl, extractUrl, normalizeUrl } from "../../src/rules/util.js";

describe("isFontUrl", () => {
  it("true for google fonts / .woff / family= / typekit", () => {
    expect(isFontUrl("https://fonts.googleapis.com/css?family=Roboto")).toBe(true);
    expect(isFontUrl("https://example.com/brand.woff2")).toBe(true);
    expect(isFontUrl("https://www.typekit.com/x.css")).toBe(true);
  });
  it("false for a non-font URL (false-positive guard)", () => {
    expect(isFontUrl("https://example.com/assets/somefont-lib.css")).toBe(false);
    expect(isFontUrl("")).toBe(false);
  });
});

describe("extractUrl", () => {
  it("strips url() wrapper and quotes", () => {
    expect(extractUrl("url(https://x/a.css)")).toBe("https://x/a.css");
    expect(extractUrl("url('https://x/a.css')")).toBe("https://x/a.css");
    expect(extractUrl('url("https://x/a.css")')).toBe("https://x/a.css");
  });
  it("returns bare/quoted strings as-is (unquoted)", () => {
    expect(extractUrl("https://x/a.css")).toBe("https://x/a.css");
    expect(extractUrl("'https://x/a.css'")).toBe("https://x/a.css");
  });
});

describe("normalizeUrl", () => {
  it("lowercases, drops protocol + leading slashes, drops trailing slash, keeps query", () => {
    expect(normalizeUrl("https://fonts.googleapis.com/css?family=Roboto")).toBe(
      "fonts.googleapis.com/css?family=roboto",
    );
    expect(normalizeUrl("//fonts.googleapis.com/css/")).toBe("fonts.googleapis.com/css");
  });
  it("equal for url()-wrapped and bare forms of the same URL", () => {
    expect(normalizeUrl("url(https://fonts.googleapis.com/css?family=Roboto)")).toBe(
      normalizeUrl("https://fonts.googleapis.com/css?family=Roboto"),
    );
  });
});
