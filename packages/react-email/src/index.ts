import { render } from "@react-email/render";
import { analyze } from "emaillint-core";
import type { AnalyzeOptions, AnalysisResult } from "emaillint-core";
import type { ReactElement } from "react";

export async function lint(element: ReactElement, options?: AnalyzeOptions): Promise<AnalysisResult> {
  return analyze(await render(element), options);
}
