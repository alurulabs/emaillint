import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { analyze } from "../../src/engine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cases = ["email-001", "email-002", "email-003"];

describe.each(cases)("regression %s", (name) => {
  it("matches golden output", () => {
    const html = readFileSync(path.join(__dirname, `${name}.html`), "utf8");
    const actual = analyze(html);
    const file = path.join(__dirname, `${name}.json`);
    if (process.env.UPDATE_GOLDEN === "1") {
      writeFileSync(file, JSON.stringify(actual, null, 2) + "\n");
      return;
    }
    const expected = JSON.parse(readFileSync(file, "utf8"));
    expect(actual).toEqual(expected);
  });
});
