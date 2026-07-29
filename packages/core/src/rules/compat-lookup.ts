import type { CompatibilityMeta, DerivedCompat } from "../types/index.js";
import { mergeSlugs } from "./compat-derive.js";
import { COMPAT, COMPAT_DATA_VERSION } from "../generated/compat-data.js";

export function getCompatDataVersion(): string {
  return COMPAT_DATA_VERSION;
}

export function compatFor(
  features: string[],
  overrides: { alternatives?: string[] } = {},
  compat: Record<string, DerivedCompat> = COMPAT,
  dataVersion: string = COMPAT_DATA_VERSION,
): CompatibilityMeta {
  const missing = features.filter((f) => !compat[f]);
  if (missing.length) throw new Error(`compatFor: unknown feature slug(s): ${missing.join(", ")}`);
  const merged = mergeSlugs(features.map((f) => compat[f]));
  return {
    support: merged.support,
    references: merged.references,
    lastTested: merged.lastTested,
    dataVersion,
    alternatives: overrides.alternatives,
  };
}
