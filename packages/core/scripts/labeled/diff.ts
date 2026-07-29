export interface ExpectedSpec {
  name: string;
  expected: string[];
  strict: boolean;
}

export interface FixtureDiff {
  name: string;
  category: "trigger" | "contested" | "clean";
  status: "pass" | "fail";
  expected: string[];
  actual: string[];
  missing: string[]; // expected \ actual  -> FN (recall regression)
  extras: string[];  // actual \ expected -> FP-candidate
}

export function diffFixture(
  spec: { name: string; expected: string[]; strict: boolean },
  actual: string[],
): Omit<FixtureDiff, "category"> {
  const exp = new Set(spec.expected);
  const act = new Set(actual);
  const missing = [...exp].filter((id) => !act.has(id)).sort();
  const extras = [...act].filter((id) => !exp.has(id)).sort();
  // fail if a recall rule is missing, OR (strict) any extra fired
  const status = missing.length > 0 || (spec.strict && extras.length > 0) ? "fail" : "pass";
  return { name: spec.name, status, expected: spec.expected.slice().sort(), actual: [...act].sort(), missing, extras };
}
