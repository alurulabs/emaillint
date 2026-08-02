import type { ClientEntry } from "../types/index.js";

/**
 * @deprecated Divergent hand-maintained IDs that do not match the generated
 * caniemail vocabulary. Replaced by `CLIENTS` (id + label). Removed in 1.0.
 */
export const KNOWN_CLIENTS: readonly ClientEntry[] = [
  { id: "outlook-windows", label: "Outlook for Windows" },
  { id: "outlook-com", label: "Outlook on the web" },
  { id: "outlook-mac", label: "Outlook for Mac" },
  { id: "outlook-ios", label: "Outlook for iOS" },
  { id: "outlook-android", label: "Outlook for Android" },
  { id: "gmail-web", label: "Gmail (Web)" },
  { id: "gmail-app-ios", label: "Gmail (iOS)" },
  { id: "gmail-app-android", label: "Gmail (Android)" },
  { id: "apple-mail", label: "Apple Mail" },
  { id: "apple-mail-ios", label: "Apple Mail (iOS)" },
  { id: "yahoo", label: "Yahoo Mail" },
  { id: "samsung-mail", label: "Samsung Mail" },
  { id: "sfr", label: "SFR" },
  { id: "orange", label: "Orange" },
  { id: "thunderbird", label: "Thunderbird" },
];
