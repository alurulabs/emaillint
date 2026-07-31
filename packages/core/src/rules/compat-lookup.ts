import type { ClientStatus, ClientSupport, CompatibilityMeta, DerivedCompat } from "../types/index.js";
import { mergeSlugs } from "./compat-derive.js";
import { COMPAT, COMPAT_DATA_VERSION } from "../generated/compat-data.js";

const SCOPE_RANK: Record<ClientSupport, number> = { supported: 0, unknown: 1, partial: 2, unsupported: 3 };

// Worst support status among the selected clients (absent client => unknown).
// Returns "supported" only when every selected client is fully supported —
// the engine uses that as the signal to drop a compatibility issue.
export function scopeWorstStatus(
  support: readonly ClientStatus[],
  clients: readonly string[],
): ClientSupport {
  const byClient = new Map(support.map((s) => [s.client, s.status]));
  let worst: ClientSupport = "supported";
  for (const c of clients) {
    const st = byClient.get(c) ?? "unknown";
    if (SCOPE_RANK[st] > SCOPE_RANK[worst]) worst = st;
  }
  return worst;
}

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
