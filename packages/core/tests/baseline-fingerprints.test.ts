import { describe, it, expect } from "vitest";
import { buildEmailContext } from "../src/parser/context.js";
import { fingerprint } from "../src/baseline.js";
import type { EmailContext, Issue } from "../src/types/index.js";

// Compatibility contract: given this HTML, these fingerprints never change
// unless FINGERPRINT_VERSION bumps. A failing fixture is a deliberate
// compatibility decision (parser/impl change), not a bug to silently fix.
const T = "TEST_RULE";
const issueAt = (ctx: EmailContext, predicate: (e: EmailContext["elements"][number]) => boolean): Issue => {
  const el = ctx.elements.find(predicate);
  if (!el) throw new Error("fixture: element not found");
  return { ruleId: T, severity: "error", category: "accessibility", message: "m", line: el.line, column: el.column };
};
const cssIssueAt = (ctx: EmailContext, predicate: (d: EmailContext["cssDeclarations"][number]) => boolean): Issue => {
  const d = ctx.cssDeclarations.find(predicate);
  if (!d) throw new Error("fixture: declaration not found");
  return { ruleId: T, severity: "error", category: "compatibility", message: "m", line: d.line, column: d.column };
};

describe("fingerprint compatibility contract", () => {
  it("basic element", () => {
    const ctx = buildEmailContext(`<img src="x.png" width="10">`);
    expect(fingerprint(ctx, issueAt(ctx, (e) => e.tagName === "img"))).toBe(`${T}#img#src=x.png&width=10`);
  });

  it("attributes sorted regardless of source order", () => {
    const ctx = buildEmailContext(`<img width="10" src="x.png">`);
    expect(fingerprint(ctx, issueAt(ctx, (e) => e.tagName === "img"))).toBe(`${T}#img#src=x.png&width=10`);
  });

  it("mixed-case attribute name lowercased", () => {
    const ctx = buildEmailContext(`<img SRC="x.png">`);
    expect(fingerprint(ctx, issueAt(ctx, (e) => e.tagName === "img"))).toBe(`${T}#img#src=x.png`);
  });

  it("mixed-case tag name lowercased", () => {
    const ctx = buildEmailContext(`<IMG src="x.png">`);
    expect(fingerprint(ctx, issueAt(ctx, (e) => e.tagName.toLowerCase() === "img"))).toBe(`${T}#img#src=x.png`);
  });

  // `disabled` is a boolean attr in HTML but is NOT in the fingerprint
  // ALLOWLIST, so it is filtered out - only `type` survives. Pinned: the
  // allowlist, not booleanness, decides what enters the fingerprint.
  it("non-allowlisted boolean attribute excluded", () => {
    const ctx = buildEmailContext(`<input type="text" disabled>`);
    expect(fingerprint(ctx, issueAt(ctx, (e) => e.tagName === "input"))).toBe(`${T}#input#type=text`);
  });

  it("single-quoted value normalized", () => {
    const ctx = buildEmailContext(`<img src='x.png'>`);
    expect(fingerprint(ctx, issueAt(ctx, (e) => e.tagName === "img"))).toBe(`${T}#img#src=x.png`);
  });

  it("internal whitespace between attrs does not affect fingerprint", () => {
    const ctx = buildEmailContext(`<img   src="x.png"   width="10">`);
    expect(fingerprint(ctx, issueAt(ctx, (e) => e.tagName === "img"))).toBe(`${T}#img#src=x.png&width=10`);
  });

  it("volatile attrs (class/style/data-*) excluded", () => {
    const ctx = buildEmailContext(`<img src="x.png" class="c" style="s" data-d="1">`);
    expect(fingerprint(ctx, issueAt(ctx, (e) => e.tagName === "img"))).toBe(`${T}#img#src=x.png`);
  });

  it("entity in attribute value is decoded", () => {
    const ctx = buildEmailContext(`<img src="a&amp;b.png">`);
    // NOTE: the decoded value "a&b.png" contains "&", which collides with the
    // pair separator. This is a known edge: values containing "&" or "#" are
    // ambiguous in the string form. Pinned as current behavior; rare in practice
    // and fail-safe (false collision = masked duplicate = false negative).
    expect(fingerprint(ctx, issueAt(ctx, (e) => e.tagName === "img"))).toBe(`${T}#img#src=a&b.png`);
  });

  it("CSS declaration: whitespace around property/value trimmed", () => {
    const ctx = buildEmailContext(`<style>p { color : red ; }</style>`);
    expect(fingerprint(ctx, cssIssueAt(ctx, (d) => d.property === "color"))).toBe(`${T}#p#color#red`);
  });

  // SVG is XML foreign content. Mixed-case source attr "Width" is lowercased
  // to "width" by parse5 (HTML tokenizer lowercases attr names; the SVG
  // foreign-content adjustment table only re-cases a known few like viewBox).
  // The fingerprint additionally lowercases, so the key comes out "width".
  it("SVG foreign content: mixed-case attr name lowercased by parse5", () => {
    const ctx = buildEmailContext(`<svg><rect Width="10"/></svg>`);
    expect(fingerprint(ctx, issueAt(ctx, (e) => e.tagName === "rect"))).toBe(`${T}#rect#width=10`);
  });

  // CSS string escape (backslash-escape of U+2014). postcss keeps the escape
  // literal as "\2014" (not decoded to the codepoint); the declaration value
  // retains the surrounding quotes from the source.
  it("CSS escaping: backslash-escape preserved verbatim by postcss", () => {
    const ctx = buildEmailContext(`<style>p { content: "\\2014"; }</style>`);
    expect(fingerprint(ctx, cssIssueAt(ctx, (d) => d.property === "content"))).toBe(`${T}#p#content#"\\2014"`);
  });
});
