import type { EmailRule } from "../../types/index.js";
import { makeIssue } from "../util.js";

export interface CssRuleSpec {
  id: string;
  name: string;
  description: string;
  why: string;
  howToFix: string;
  since?: string;
  features: string[];
  alternatives?: string[];
  /** Declaration matches if property ∈ properties (normalized) — omit for property-agnostic. */
  properties?: string[];
  /** Skip when lowercased+trimmed value === this (e.g. "none"). */
  unlessValue?: string;
  /** Extra value predicate on lowercased+trimmed value. */
  matchValue?: (v: string) => boolean;
}

const lower = (v: string): string => v.trim().toLowerCase();

export function createCssRule(spec: CssRuleSpec): EmailRule {
  const props = new Set(spec.properties ?? []);
  return {
    id: spec.id,
    name: spec.name,
    category: "compatibility",
    severity: "warning",
    description: spec.description,
    why: spec.why,
    howToFix: spec.howToFix,
    since: spec.since ?? "0.9.0",
    features: spec.features,
    alternatives: spec.alternatives,
    check(ctx) {
      return ctx.cssDeclarations
        .filter((d) => {
          if (props.size !== 0 && !props.has(d.property)) return false;
          const v = lower(d.value);
          if (spec.unlessValue && v === spec.unlessValue) return false;
          if (spec.matchValue && !spec.matchValue(v)) return false;
          return true;
        })
        .map((d) =>
          makeIssue(this, {
            message: `${d.property}: ${d.value} is not reliably supported across email clients.`,
            selector: d.selector,
            line: d.line,
            column: d.column,
          }),
        );
    },
  };
}

// CSS declaration-based compatibility rules. `support`/`references` are derived
// by the registry via compatFor() from each spec's `features` (caniemail data).
export const cssRuleSpecs: CssRuleSpec[] = [
  {
    id: "CSS_GRID", name: "CSS Grid",
    properties: ["display"], matchValue: (v) => v.includes("grid"),
    description: "display:grid is not supported by Outlook and is inconsistent elsewhere.",
    why: "Outlook (Word engine) ignores grid layout; Gmail strips some grid properties.",
    howToFix: "Use nested <table> layouts as the structural fallback.",
    features: ["css-display-grid"],
    alternatives: ["Nested tables"],
  },
  {
    id: "CSS_FIXED_POSITION", name: "position: fixed",
    properties: ["position"], matchValue: (v) => v === "fixed",
    description: "position:fixed is not supported by most email clients.",
    why: "Fixed positioning is ignored or stripped; elements flow inline instead.",
    howToFix: "Avoid fixed positioning; restructure with tables or static layout.",
    features: ["css-position"],
  },
  {
    id: "CSS_FLOAT", name: "float",
    properties: ["float"], unlessValue: "none",
    description: "float is unreliably supported in email, especially Outlook.",
    why: "Outlook ignores float; other clients render it inconsistently.",
    howToFix: "Use align/valign attributes or table cells for alignment.",
    features: ["css-float"],
  },
  {
    id: "CSS_TRANSFORM", name: "transform",
    properties: ["transform"], unlessValue: "none",
    description: "transform is not supported by Outlook and most webmail clients.",
    why: "Transforms are ignored; visual effects do not appear.",
    howToFix: "Pre-render transformed graphics as images.",
    features: ["css-transform"],
  },
  {
    id: "CSS_TRANSITION", name: "transition",
    properties: ["transition", "transition-property"],
    description: "transitions are unsupported in most email clients.",
    why: "Transitions do not animate; only Apple Mail/iOS offer partial support.",
    howToFix: "Do not rely on transitions; design static states.",
    features: ["css-transition"],
  },
  {
    id: "CSS_ANIMATION", name: "animation",
    properties: ["animation", "animation-name", "animation-duration"],
    description: "CSS animation is unsupported in most email clients.",
    why: "Animations do not play outside Apple Mail/iOS.",
    howToFix: "Use an animated GIF if motion is essential.",
    features: ["css-animation"],
    alternatives: ["Animated GIF"],
  },
  {
    id: "CSS_FILTER", name: "filter",
    properties: ["filter"], unlessValue: "none",
    description: "CSS filter is unsupported in most email clients.",
    why: "Filters are ignored; effects do not render.",
    howToFix: "Bake effects into the image asset.",
    features: ["css-filter"],
  },
  {
    id: "CSS_BACKDROP_FILTER", name: "backdrop-filter",
    properties: ["backdrop-filter"], unlessValue: "none",
    description: "backdrop-filter is unsupported in email clients.",
    why: "Backdrop filters are ignored everywhere in email.",
    howToFix: "Use a solid/semi-transparent background instead.",
    features: ["css-backdrop-filter"],
  },
  {
    id: "CSS_CALC", name: "calc()",
    matchValue: (v) => v.includes("calc("),
    description: "calc() is unsupported by Outlook and inconsistent elsewhere.",
    why: "Outlook ignores calc(); the computed length falls back or breaks.",
    howToFix: "Pre-compute the value and use a fixed length.",
    features: ["css-unit-calc"],
  },
  {
    id: "CSS_ASPECT_RATIO", name: "aspect-ratio",
    properties: ["aspect-ratio"],
    description: "aspect-ratio is unsupported in most email clients.",
    why: "The ratio is ignored; sizing collapses.",
    howToFix: "Set explicit width/height on the element.",
    features: ["css-aspect-ratio"],
  },
  {
    id: "CSS_OBJECT_FIT", name: "object-fit",
    properties: ["object-fit"],
    description: "object-fit is unsupported by Outlook.",
    why: "Outlook ignores object-fit; images render at intrinsic size.",
    howToFix: "Size images explicitly; avoid cover/contain cropping in Outlook.",
    features: ["css-object-fit"],
  },
  {
    id: "CSS_MIX_BLEND_MODE", name: "mix-blend-mode",
    properties: ["mix-blend-mode"], unlessValue: "normal",
    description: "mix-blend-mode is unsupported in email clients.",
    why: "Blend modes are ignored; layers composite normally.",
    howToFix: "Pre-composite the blended image.",
    features: ["css-mix-blend-mode"],
  },
  {
    id: "CSS_MIN_MAX_CLAMP", name: "min()/max()/clamp()",
    matchValue: (v) => /\b(min|max|clamp)\s*\(/.test(v),
    description: "min()/max()/clamp() are unsupported in Outlook.",
    why: "These math functions are ignored; the value falls back or breaks.",
    howToFix: "Pre-compute and use a fixed value.",
    features: ["css-function-clamp"],
  },
  {
    id: "CSS_OVERFLOW", name: "overflow",
    properties: ["overflow", "overflow-x", "overflow-y"], unlessValue: "visible",
    description: "overflow clipping is unreliable in Outlook.",
    why: "Outlook ignores overflow:hidden; clipping does not apply.",
    howToFix: "Do not depend on overflow clipping for layout in Outlook.",
    features: ["css-overflow"],
  },
];

export const cssRules: EmailRule[] = cssRuleSpecs.map(createCssRule);
