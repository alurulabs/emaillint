import { describe, expect, it } from "vitest";
import { parseInlineStyle, parseStyleBlock } from "../src/parser/css.js";

describe("parseInlineStyle", () => {
  it("normalizes property to lowercase + trim, preserves value case", () => {
    const [d] = parseInlineStyle("  Color : RED ", 1, 1);
    expect(d.property).toBe("color");
    expect(d.value).toBe("RED");
  });

  it("splits on top-level semicolons only", () => {
    const decls = parseInlineStyle(
      "background: url(http://x.com/a;b.png); color: red",
      2,
      1,
    );
    expect(decls).toHaveLength(2);
    expect(decls[0].property).toBe("background");
    expect(decls[0].value).toBe("url(http://x.com/a;b.png)");
    expect(decls[1].property).toBe("color");
  });

  it("respects quoted strings", () => {
    const decls = parseInlineStyle('font-family: "a; b"; color: red', 3, 1);
    expect(decls[0].value).toBe('"a; b"');
  });

  it("strips comments", () => {
    const [d] = parseInlineStyle("color: /* x */ red", 4, 1);
    expect(d.value).toBe("red");
  });

  it("drops empty-property declarations", () => {
    expect(parseInlineStyle(": nope; color: red", 5, 1)).toHaveLength(1);
  });

  it("carries the element line + column", () => {
    const [d] = parseInlineStyle("color: red", 7, 12);
    expect(d.line).toBe(7);
    expect(d.column).toBe(12);
  });
});

describe("parseStyleBlock", () => {
  it("lowercases property and preserves value case", () => {
    const { decls } = parseStyleBlock("A { Border-Radius: 8PX; }", 1);
    expect(decls[0].property).toBe("border-radius");
    expect(decls[0].value).toBe("8PX");
    expect(decls[0].selector).toBe("A");
    expect(decls[0].column).toBeTypeOf("number");
  });
});
