import type { AnalysisResult, AnalyzeOptions, EmailRule, Issue, ProfileName, RuleSetting, Severity } from "./types/index.js";
import { buildEmailContext } from "./parser/context.js";
import { calculateScore } from "./scoring/index.js";
import { rules } from "./rules/index.js";
import { scopeWorstStatus } from "./rules/compat-lookup.js";
import { PROFILES } from "./profiles.js";

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

    if (rule.references) {
      for (const ref of rule.references) {
        if (!ref.url.startsWith("https://")) throw new Error(`Reference must be https:// (${rule.id}): ${ref.url}`);
      }
      const topUrls = new Set<string>();
      for (const ref of rule.references) {
        if (topUrls.has(ref.url)) throw new Error(`Duplicate reference (${rule.id}): ${ref.url}`);
        topUrls.add(ref.url);
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
  const profile: ProfileName = options?.profile ?? "recommended";
  const shift = PROFILES[profile];
  const clients = options?.clients;
  const filter = !!clients && clients.length > 0;
  const issues: Issue[] = [];
  for (const rule of rules) {
    const explicit = overrides[rule.id];
    const effective: RuleSetting = explicit ?? shift[rule.severity] ?? rule.severity;
    if (effective === "off") continue;
    const emitted = rule.check(context);
    for (let issue of emitted) {
      if (effective !== rule.severity) issue = { ...issue, severity: effective };
      if (filter && rule.category === "compatibility") {
        const worst = scopeWorstStatus(rule.compatibility?.support ?? [], clients!);
        if (worst === "supported") continue; // fully supported across all selected clients → drop
        // compatScope is an object (not a flat string) so future fields (affectedClients, counts)
        // can be added without a breaking change to this public Issue shape.
        issue = { ...issue, compatScope: { status: worst } };
      }
      issues.push(issue);
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
