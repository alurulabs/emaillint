import type { Issue } from "../types/index.js";

// info = 0: compatibility notes (e.g. CSS_BORDER_RADIUS, VML-downgraded
// CSS_BACKGROUND_IMAGE) are not defects and do not penalize the score.
const PENALTY: Record<Issue["severity"], number> = {
  error: 15,
  warning: 5,
  info: 0,
};

// Per-rule cap = one error's weight. A persistently-firing rule-class is
// capped at the weight of one hard defect, so a single prolific rule cannot
// floor the score (calibration §9 saturation fix). See scoring-sim for data.
const CAP = 15;

export function calculateScore(issues: Issue[]): number {
  const perRule = new Map<string, number>();
  for (const issue of issues) {
    perRule.set(issue.ruleId, (perRule.get(issue.ruleId) ?? 0) + PENALTY[issue.severity]);
  }
  let total = 0;
  for (const contribution of perRule.values()) {
    total += Math.min(CAP, contribution);
  }
  return Math.max(0, 100 - total);
}
