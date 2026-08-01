import type { ClientId } from "../generated/compat-data.js";
import { COMPAT } from "../generated/compat-data.js";

// Every caniemail client ID seen in the snapshot. Derived (not hand-maintained)
// so it can never drift from the generated ClientId union.
export const CLIENT_IDS: readonly ClientId[] = [
  ...new Set(Object.values(COMPAT).flatMap((d) => d.support.map((s) => s.client))),
].sort() as ClientId[];

// Friendly preset names -> caniemail client IDs. `all` == CLIENT_IDS (== no filtering).
export const CLIENT_PRESETS: Record<string, readonly ClientId[]> = {
  outlook: ["outlook-windows", "outlook-windows-mail", "outlook-macos", "outlook-outlook-com", "outlook-ios", "outlook-android"],
  gmail: ["gmail-desktop-webmail", "gmail-ios", "gmail-android", "gmail-mobile-webmail"],
  "apple-mail": ["apple-mail-macos", "apple-mail-ios"],
  yahoo: ["yahoo-desktop-webmail", "yahoo-ios", "yahoo-android"],
  all: CLIENT_IDS,
};
