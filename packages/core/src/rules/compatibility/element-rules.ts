import type { Category, EmailRule, Severity } from "../../types/index.js";
import { makeIssue, isFontUrl } from "../util.js";

export interface ElementRuleSpec {
  id: string;
  name: string;
  tags: string[];
  category: Category;
  severity: Severity;
  description: string;
  why: string;
  howToFix: string;
  since?: string;
  features?: string[];
  alternatives?: string[];
  /** Only match elements whose attribute `name` contains `contains` (case-insensitive). */
  attrFilter?: { name: string; contains: string };
  /** If set, elements whose attributes match this predicate are skipped. */
  skip?: (attributes: Record<string, string>) => boolean;
}

export function createElementRule(spec: ElementRuleSpec): EmailRule {
  const tags = new Set(spec.tags);
  return {
    id: spec.id,
    name: spec.name,
    category: spec.category,
    severity: spec.severity,
    description: spec.description,
    why: spec.why,
    howToFix: spec.howToFix,
    since: spec.since ?? "0.9.0",
    features: spec.features,
    alternatives: spec.alternatives,
    check(ctx) {
      return ctx.elements
        .filter((e) => {
          if (!tags.has(e.tagName)) return false;
          if (spec.attrFilter) {
            const val = (e.attributes[spec.attrFilter.name] ?? "").toLowerCase();
            if (!val.includes(spec.attrFilter.contains)) return false;
          }
          if (spec.skip && spec.skip(e.attributes)) return false;
          return true;
        })
        .map((e) =>
          makeIssue(this, {
            message: `<${e.tagName}> is not supported in email.`,
            line: e.line,
            column: e.column,
          }),
        );
    },
  };
}

export const elementRuleSpecs: ElementRuleSpec[] = [
  {
    id: "SCRIPT_ELEMENT", name: "<script> element",
    tags: ["script"], category: "invalid", severity: "error",
    description: "<script> is stripped by all major email clients.",
    why: "Clients remove <script> for security; no JavaScript executes in email.",
    howToFix: "Remove it. Move interactivity to the destination landing page.",
  },
  {
    id: "IFRAME_ELEMENT", name: "<iframe> element",
    tags: ["iframe"], category: "invalid", severity: "error",
    description: "<iframe> is unsupported in email clients.",
    why: "Iframes are stripped or blocked everywhere in email.",
    howToFix: "Remove it; link to the external content instead.",
  },
  {
    id: "CANVAS_ELEMENT", name: "<canvas> element",
    tags: ["canvas"], category: "invalid", severity: "error",
    description: "<canvas> is unsupported in email clients.",
    why: "Canvas requires scripting, which email clients strip.",
    howToFix: "Replace with a static image.",
  },
  {
    id: "OBJECT_ELEMENT", name: "<object> element",
    tags: ["object"], category: "invalid", severity: "error",
    description: "<object> is unsupported in email clients.",
    why: "Embedded objects are stripped by all major clients.",
    howToFix: "Use a linked image instead.",
  },
  {
    id: "EMBED_ELEMENT", name: "<embed> element",
    tags: ["embed"], category: "invalid", severity: "error",
    description: "<embed> is unsupported in email clients.",
    why: "Plugins/embeds are stripped by all major clients.",
    howToFix: "Use a linked image instead.",
  },
  {
    id: "FORM_ELEMENTS", name: "form elements",
    tags: ["form", "input", "select", "textarea", "button"], category: "invalid", severity: "error",
    description: "Form elements do not function in email clients.",
    why: "Forms are stripped or rendered inert; no submission is possible.",
    howToFix: "Link to a form on a landing page instead.",
  },
  {
    id: "VIDEO_ELEMENT", name: "<video> element",
    tags: ["video"], category: "compatibility", severity: "warning",
    description: "<video> is only partially supported across email clients.",
    why: "Apple Mail plays video; most other clients show a fallback or nothing.",
    howToFix: "Provide a poster image and a link; use animated GIF as fallback.",
    features: ["html-video"],
  },
  {
    id: "AUDIO_ELEMENT", name: "<audio> element",
    tags: ["audio"], category: "compatibility", severity: "warning",
    description: "<audio> has very limited support in email clients.",
    why: "Audio elements are stripped by most clients.",
    howToFix: "Link to external audio instead of embedding.",
    features: ["html-audio"],
  },
  {
    id: "LINK_STYLESHEET", name: "<link rel=stylesheet>",
    tags: ["link"], category: "compatibility", severity: "warning",
    attrFilter: { name: "rel", contains: "stylesheet" },
    skip: (attrs) => isFontUrl(attrs.href ?? ""),
    description: "External stylesheets are stripped by most email clients.",
    why: "Gmail strips <link>; external CSS rarely applies in email.",
    howToFix: "Inline the CSS or move it into a <style> block.",
    features: ["html-link"],
  },
];

export const elementRules: EmailRule[] = elementRuleSpecs.map(createElementRule);
