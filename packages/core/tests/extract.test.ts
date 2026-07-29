import { describe, it, expect } from "vitest";
import { parseHtml } from "../src/parser/parse.js";
import { extract } from "../src/parser/extract.js";

const doc = (html: string) => parseHtml(html).document;

describe("extract elements", () => {
  it("collects elements with tag name, attributes and line", () => {
    const { elements } = extract(doc('<div id="a"><span>x</span></div>'));
    const div = elements.find((e) => e.tagName === "div");
    expect(div?.attributes.id).toBe("a");
    expect(div?.line).toBe(1);
  });
});

describe("extract images", () => {
  it("distinguishes missing alt from empty alt", () => {
    const { images } = extract(doc('<img src="a.png"><img src="b.png" alt="">'));
    expect(images[0].alt).toBeUndefined();
    expect(images[0].src).toBe("a.png");
    expect(images[1].alt).toBe("");
  });
});

describe("extract links", () => {
  it("marks missing href, empty href, and present href", () => {
    const { links } = extract(doc('<a>x</a><a href="">y</a><a href="https://z">z</a>'));
    expect(links[0].href).toBeUndefined();
    expect(links[1].href).toBe("");
    expect(links[2].href).toBe("https://z");
  });
});

describe("extract conditional comments", () => {
  it("preserves Outlook conditional comments", () => {
    const { conditionalComments } = extract(doc("<!--[if mso]><table><![endif]-->"));
    expect(conditionalComments).toHaveLength(1);
    expect(conditionalComments[0].condition).toBe("mso");
    expect(conditionalComments[0].content).toContain("<table>");
  });

  it("ignores normal comments", () => {
    const { conditionalComments } = extract(doc("<!-- just a comment -->"));
    expect(conditionalComments).toHaveLength(0);
  });
});

describe("extract css", () => {
  it("parses inline style declarations (source inline, no selector)", () => {
    const { cssDeclarations } = extract(doc('<div style="display: flex;"></div>'));
    const d = cssDeclarations.find((x) => x.property === "display");
    expect(d?.value).toBe("flex");
    expect(d?.source).toBe("inline");
    expect(d?.selector).toBeUndefined();
  });

  it("parses <style> declarations with selector and offset line", () => {
    const html = ["<style>", ".b {", "  border-radius: 8px;", "}", "</style>"].join("\n");
    const { cssDeclarations } = extract(doc(html));
    const d = cssDeclarations.find((x) => x.property === "border-radius");
    expect(d?.value).toBe("8px");
    expect(d?.source).toBe("style");
    expect(d?.selector).toBe(".b");
    expect(d?.line).toBe(3);
  });

  it("captures at-rules from <style>", () => {
    const html = "<style>@font-face { font-family: x; }@import url('https://fonts.googleapis.com/css?family=Roboto');</style>";
    const { cssAtRules } = extract(doc(html));
    expect(cssAtRules.map((a) => a.name)).toEqual(["font-face", "import"]);
  });

  it("walks declarations inside @media", () => {
    const html = "<style>@media screen { .a { display: flex; } }</style>";
    const { cssDeclarations } = extract(doc(html));
    expect(cssDeclarations.some((d) => d.property === "display" && d.value.includes("flex"))).toBe(true);
  });
});

function run(html: string) {
  return extract(doc(html));
}

describe("extract headings + link text + doctype + columns", () => {
  it("captures headings with level + text", () => {
    const r = run("<h1>Title</h1><h3>Sub</h3>");
    expect(r.headings.map((h) => [h.level, h.text])).toEqual([[1, "Title"], [3, "Sub"]]);
  });

  it("captures anchor text content", () => {
    const r = run('<a href="x">Click here</a>');
    expect(r.links[0].text).toBe("Click here");
  });

  it("exposes doctype name (null when missing)", () => {
    expect(run("<!DOCTYPE html><html></html>").doctype?.name).toBe("html");
    expect(run("<html></html>").doctype).toBe(null);
  });

  it("attaches columns to elements", () => {
    const r = run("<img src=a>");
    expect(r.images[0].column).toBeTypeOf("number");
  });
});
