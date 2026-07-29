import { describe, expect, it } from "vitest";
import { elementRules, elementRuleSpecs } from "../../src/rules/compatibility/element-rules.js";
import { isFontUrl } from "../../src/rules/util.js";
import type { EmailContext } from "../../src/types/index.js";

function ctxWith(tags: { name: string; attrs?: Record<string, string> }[]): EmailContext {
  return {
    html: "",
    sizeBytes: 0,
    elements: tags.map((t) => ({ tagName: t.name, attributes: t.attrs ?? {}, line: 1, column: 1 })),
    images: [],
    links: [],
    cssDeclarations: [],
    cssAtRules: [],
    conditionalComments: [],
    headings: [],
    doctype: null,
  };
}

describe.each(elementRuleSpecs.map((s, i) => ({ spec: s, rule: elementRules[i] })))(
  "element rule $spec.id",
  ({ spec, rule }) => {
    it("triggers on every target tag", () => {
      const attrs = spec.attrFilter
        ? { [spec.attrFilter.name]: spec.attrFilter.contains }
        : undefined;
      for (const tag of spec.tags) {
        const issues = rule.check(ctxWith([{ name: tag, attrs }]));
        expect(issues.length, `tag <${tag}>`).toBeGreaterThan(0);
        expect(issues[0].ruleId).toBe(spec.id);
      }
    });

    it("does not trigger on a <div>", () => {
      expect(rule.check(ctxWith([{ name: "div" }]))).toHaveLength(0);
    });

    if (spec.attrFilter) {
      const filter = spec.attrFilter;
      it("does not trigger when the attrFilter value misses", () => {
        // Near-miss for attrFilter: LINK_STYLESHEET filters on rel containing
        // "stylesheet"; <link rel="icon"> must NOT trigger ("icon" misses).
        const issues = rule.check(
          ctxWith([{ name: spec.tags[0], attrs: { [filter.name]: "icon" } }]),
        );
        expect(issues).toHaveLength(0);
      });
    }
  },
);

describe("LINK_STYLESHEET defers font links to CSS_EXTERNAL_FONT", () => {
  const linkRule = elementRules.find((r) => r.id === "LINK_STYLESHEET")!;
  const fontHref = "https://fonts.googleapis.com/css?family=Roboto";

  it("does NOT fire on a font <link>", () => {
    expect(isFontUrl(fontHref)).toBe(true);
    const issues = linkRule.check(ctxWith([{ name: "link", attrs: { rel: "stylesheet", href: fontHref } }]));
    expect(issues).toHaveLength(0);
  });

  it("still fires on a non-font stylesheet <link>", () => {
    const issues = linkRule.check(ctxWith([{ name: "link", attrs: { rel: "stylesheet", href: "reset.css" } }]));
    expect(issues).toHaveLength(1);
  });
});
