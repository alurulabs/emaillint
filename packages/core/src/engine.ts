import type { AnalysisResult, AnalyzeOptions, EmailRule, Issue } from "./types/index.js";
import { buildEmailContext } from "./parser/context.js";
import { calculateScore } from "./scoring/index.js";
import { rules } from "./rules/index.js";

const ID_RE = /^[A-Z][A-Z0-9_]+$/;

export function validateRules(ruleList: EmailRule[]): void {
  const seen = new Set<string>();
  for (const rule of ruleList) {
    if (!rule.id) throw new Error("Invalid rule: missing id");
    if (!ID_RE.test(rule.id)) throw new Error(`Invalid rule id (expected UPPERCASE_SNAKE): ${rule.id}`);
    if (!rule.name) throw new Error(`Invalid rule: missing name (${rule.id})`);
    if (!rule.description) throw new Error(`Invalid rule: missing description (${rule.id})`);
    if (!rule.why) throw new Error(`Invalid rule: missing why (${rule.id})`);
    if (!rule.howToFix) throw new Error(`Invalid rule: missing howToFix (${rule.id})`);
    if (seen.has(rule.id)) throw new Error(`Duplicate rule id: ${rule.id}`);
    seen.add(rule.id);

    if (rule.category === "compatibility") {
      if (!rule.features?.length) throw new Error(`Compat rule missing features: ${rule.id}`);
      const c = rule.compatibility;
      if (!c?.support?.length) throw new Error(`Compat rule missing support: ${rule.id}`);
      if (!c?.references?.length) throw new Error(`Compat rule missing references: ${rule.id}`);
      for (const ref of c.references) {
        if (!ref.url.startsWith("https://")) throw new Error(`Reference must be https:// (${rule.id}): ${ref.url}`);
      }
      const urls = new Set<string>();
      for (const ref of c.references) {
        if (urls.has(ref.url)) throw new Error(`Duplicate reference (${rule.id}): ${ref.url}`);
        urls.add(ref.url);
      }
    }
  }
}

// Rules are a static module-level constant; validating the registry on every
// analyze() is pure overhead. Validate once on first call, memoize.
let rulesValidated = false;

export function analyze(html: string, options?: AnalyzeOptions): AnalysisResult {
  if (typeof html !== "string") throw new TypeError("analyze(): html must be a string");
  if (!rulesValidated) {
    validateRules(rules);
    rulesValidated = true;
  }
  const context = buildEmailContext(html);
  const overrides = options?.rules ?? {};
  const issues: Issue[] = [];
  for (const rule of rules) {
    const setting = overrides[rule.id];
    if (setting === "off") continue;
    const emitted = rule.check(context);
    for (const issue of emitted) {
      issues.push(setting ? { ...issue, severity: setting } : issue);
    }
  }
  const score = calculateScore(issues);
  return { score, issues };
}

export function getRule(id: string): Readonly<EmailRule> | undefined {
  return rules.find((r) => r.id === id);
}

export function getRules(): ReadonlyArray<Readonly<EmailRule>> {
  return rules;
}
