import { describe, it, expect } from "vitest";
import mjml2html from "mjml";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = ["basic.mjml", "image.mjml", "button.mjml", "columns.mjml", "typography.mjml", "outlook.mjml"];

function load(name: string): string {
  return readFileSync(join(here, "fixtures", name), "utf8");
}

describe("validationLevel skip vs default (HTML equality)", () => {
  for (const name of fixtures) {
    it(`renders identical HTML under skip and default for ${name}`, async () => {
      const src = load(name);
      const def = (await mjml2html(src)).html;
      const skip = (await mjml2html(src, { validationLevel: "skip" })).html;
      expect(skip).toBe(def);
    });
  }
});
