import type { Category, Issue, Severity } from "../../src/types/index.js";

export interface TemplateResult {
  name: string;
  source: "synthetic" | "real";
  sizeBytes: number;
  score: number;
  issues: Issue[];
}

export interface RuleSample {
  template: string;
  message: string;
  line?: number;
  column?: number;
}

export interface RuleAggregate {
  ruleId: string;
  severity: Severity;
  category: Category;
  hits: number;
  templateCount: number;
  templatePrevalence: number; // 0-100
  samples: RuleSample[];
}

export interface Distribution {
  avg: number;
  median: number;
  max: number;
}

export function distribution(results: TemplateResult[]): Distribution {
  const counts = results.map((r) => r.issues.length).sort((a, b) => a - b);
  const n = counts.length;
  if (n === 0) return { avg: 0, median: 0, max: 0 };
  const sum = counts.reduce((acc, c) => acc + c, 0);
  const mid = Math.floor(n / 2);
  const median =
    n % 2 === 1 ? counts[mid] : (counts[mid - 1] + counts[mid]) / 2;
  return { avg: sum / n, median, max: counts[n - 1] };
}

export function aggregateByRule(results: TemplateResult[]): RuleAggregate[] {
  const totalTemplates = results.length;
  const rules = new Map<
    string,
    {
      severity: Severity;
      category: Category;
      hits: number;
      templates: Set<string>;
      samples: RuleSample[];
    }
  >();

  for (const template of results) {
    const seenHere = new Set<string>();
    for (const issue of template.issues) {
      let entry = rules.get(issue.ruleId);
      if (!entry) {
        entry = {
          severity: issue.severity,
          category: issue.category,
          hits: 0,
          templates: new Set<string>(),
          samples: [],
        };
        rules.set(issue.ruleId, entry);
      }
      entry.hits += 1;
      if (!seenHere.has(issue.ruleId)) {
        seenHere.add(issue.ruleId);
        entry.templates.add(template.name);
      }
      if (entry.samples.length < 3) {
        entry.samples.push({
          template: template.name,
          message: issue.message,
          line: issue.line,
          column: issue.column,
        });
      }
    }
  }

  const aggregates: RuleAggregate[] = [];
  for (const [ruleId, entry] of rules) {
    const templateCount = entry.templates.size;
    aggregates.push({
      ruleId,
      severity: entry.severity,
      category: entry.category,
      hits: entry.hits,
      templateCount,
      templatePrevalence:
        totalTemplates === 0 ? 0 : (templateCount / totalTemplates) * 100,
      samples: entry.samples,
    });
  }

  aggregates.sort(
    (a, b) =>
      b.templatePrevalence - a.templatePrevalence || b.hits - a.hits,
  );
  return aggregates;
}

export function topRuleIds(issues: Issue[], limit: number): string[] {
  const counts = new Map<string, number>();
  for (const i of issues) counts.set(i.ruleId, (counts.get(i.ruleId) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
}

export function computeZeroHit(
  byRule: RuleAggregate[],
  registeredIds: string[],
): string[] {
  const hit = new Set(byRule.map((r) => r.ruleId));
  return registeredIds.filter((id) => !hit.has(id));
}
