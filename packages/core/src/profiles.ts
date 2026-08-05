import type { ProfileName, Severity } from "./types/index.js";

// Severity-tier shifts. Each profile maps a severity to a new severity; any
// severity not listed is unchanged. Profiles never produce "off" and never
// invent findings - they only change the reported severity of existing rules.
// New rules auto-participate: their calibrated severity is shifted the same as
// any other. PROFILES and the profile names are stable public API; renaming a
// profile is a breaking change.
export const PROFILES: Record<ProfileName, Partial<Record<Severity, Severity>>> = {
  recommended: {},
  strict: { warning: "error" },
  relaxed: { warning: "info" },
};
