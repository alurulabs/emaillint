import { describe, expect, it } from "vitest";
import { analyze } from "../src/engine.js";

const gnarly = [
  "<div",
  "<table><tr><td>",
  "<style>body{",
  'style="color:red',
  "<!--[if mso]><table><tr><td>hi",
  "<img src=x onerror=alert(1)>",
  "<p>" + "a".repeat(200000),
  "<<<<>>>>",
  '<a href= style= >',
  "<html><head></head><body><h1>",
  "<style>@media{.a{color:red}",
  "<table><table><table><td>",
  "<!DOCTYPE html><html><body>",
  "<svg/onload=alert(1)>",
  '<div style="background:url(http://x;a);color:red">',
  "<input><select><option>",
  "<![CDATA[ x ]]>",
  "<p>&nbsp;&copy;</p>",
  "<style><!-- --></style>",
  "<font face=arial><center>",
];

describe("parser resilience", () => {
  it.each(gnarly)("does not throw on malformed input", (html) => {
    const result = analyze(html);
    expect(result).toHaveProperty("score");
    expect(Array.isArray(result.issues)).toBe(true);
  });
});
