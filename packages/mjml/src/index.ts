import mjml2html from "mjml";
import { analyze } from "emaillint-core";
import type { AnalyzeOptions, AnalysisResult } from "emaillint-core";

// validationLevel "skip": emaillint analyzes rendered HTML only; MJML source
// validation is outside this adapter's scope. Inputs that render produce
// identical HTML under "skip" and the default "soft" level; "skip" avoids
// spurious validation errors reaching emaillint.
const RENDER_OPTIONS = { validationLevel: "skip" as const };

async function renderInternal(source: string): Promise<string> {
  const result = await mjml2html(source, RENDER_OPTIONS);
  if (!result.html) throw new Error("@emaillint/mjml: MJML render produced no HTML; nothing to analyze");
  return result.html;
}

export async function lint(source: string, options?: AnalyzeOptions): Promise<AnalysisResult> {
  return analyze(await renderInternal(source), options);
}
