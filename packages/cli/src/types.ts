import type { AnalysisResult, RuleSetting, EmailContext, NewError } from "emaillint-core";

export type Format = "text" | "json" | "sarif";

export interface CliOptions {
  paths: string[];
  format: Format;
  rules: Record<string, RuleSetting>;
  preset?: string;
  clientIds: string[];
  help: boolean;
  version: boolean;
  baselinePath?: string;       // --baseline [path]
  updateBaselinePath?: string; // --update-baseline [path]
}

export type FileResult = { path: string } & (
  | { result: AnalysisResult; ctx?: EmailContext }
  | { readError: string }
);

// Outcome of the baseline layer; defined here (where RunResult lives) so the
// baseline module imports it, avoiding a circular type reference.
export interface BaselineOutcome {
  mode: "check" | "update";
  newErrors: NewError[];
  suppressed: number;
  compatWarning?: string;
  writtenPath?: string;
}

export interface RunResult {
  results: FileResult[];
  clients?: string[];
  baseline?: BaselineOutcome;
}
