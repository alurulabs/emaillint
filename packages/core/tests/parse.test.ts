import { describe, it, expect } from "vitest";
import { parseHtml } from "../src/parser/parse.js";

describe("parseHtml", () => {
  it("returns a document and UTF-8 byte size", () => {
    const { document, sizeBytes } = parseHtml("<p>hi</p>");
    expect(document.nodeName).toBe("#document");
    expect(sizeBytes).toBe(Buffer.byteLength("<p>hi</p>", "utf8"));
  });

  it("throws TypeError on non-string input", () => {
    expect(() => parseHtml(null as unknown as string)).toThrow(TypeError);
  });

  it("accepts an empty string", () => {
    const { document, sizeBytes } = parseHtml("");
    expect(document.nodeName).toBe("#document");
    expect(sizeBytes).toBe(0);
  });
});

describe("parse doctype", () => {
  it("exposes a #documentType node when present", () => {
    const { document } = parseHtml("<!DOCTYPE html><html></html>");
    const top = (document as unknown as { childNodes?: { nodeName?: string }[] }).childNodes ?? [];
    expect(top.some((n) => n.nodeName === "#documentType")).toBe(true);
  });

  it("has no #documentType node when absent", () => {
    const { document } = parseHtml("<html></html>");
    const top = (document as unknown as { childNodes?: { nodeName?: string }[] }).childNodes ?? [];
    expect(top.some((n) => n.nodeName === "#documentType")).toBe(false);
  });
});
