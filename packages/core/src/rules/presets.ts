import { CLIENTS } from "../generated/compat-data.js";
import type { ClientId } from "../generated/compat-data.js";

// Every caniemail client ID, sourced from the generated CLIENTS list (the
// canonical id+label table) so there is a single derivation, not a parallel one.
export const CLIENT_IDS: readonly ClientId[] = CLIENTS.map((c) => c.id as ClientId);

// Friendly preset names -> caniemail client IDs. `all` == CLIENT_IDS (== no filtering).
export const CLIENT_PRESETS: Record<string, readonly ClientId[]> = {
  outlook: ["outlook-windows", "outlook-windows-mail", "outlook-macos", "outlook-outlook-com", "outlook-ios", "outlook-android"],
  gmail: ["gmail-desktop-webmail", "gmail-ios", "gmail-android", "gmail-mobile-webmail"],
  "apple-mail": ["apple-mail-macos", "apple-mail-ios"],
  yahoo: ["yahoo-desktop-webmail", "yahoo-ios", "yahoo-android"],
  all: CLIENT_IDS,
};
