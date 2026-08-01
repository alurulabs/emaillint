import { describe, it, expect } from "vitest";
import { CLIENT_IDS, CLIENT_PRESETS } from "../src/rules/presets.js";

describe("presets", () => {
  it("CLIENT_IDS is non-empty and sorted", () => {
    expect(CLIENT_IDS.length).toBeGreaterThan(0);
    expect([...CLIENT_IDS]).toEqual([...CLIENT_IDS].sort());
  });

  it("gmail preset has the 4 gmail clients", () => {
    expect(CLIENT_PRESETS.gmail).toEqual([
      "gmail-desktop-webmail", "gmail-ios", "gmail-android", "gmail-mobile-webmail",
    ]);
  });

  it("every preset client is a known CLIENT_ID", () => {
    for (const ids of Object.values(CLIENT_PRESETS)) {
      for (const id of ids) expect(CLIENT_IDS).toContain(id);
    }
  });

  it('"all" preset equals CLIENT_IDS', () => {
    expect(CLIENT_PRESETS.all).toBe(CLIENT_IDS);
  });
});
