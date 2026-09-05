import { render } from "@maizzle/framework";
import { analyze } from "emaillint-core";
import type { AnalyzeOptions, AnalysisResult } from "emaillint-core";

export async function lint(templatePath: string, options?: AnalyzeOptions): Promise<AnalysisResult> {
  const { html } = await render(templatePath);
  return analyze(html, options);
}
