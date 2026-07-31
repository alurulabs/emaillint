import type { AnalysisResult, RuleSetting } from "emaillint-core";

export type Format = "text" | "json" | "sarif";

export interface CliOptions {
  paths: string[];
  format: Format;
  rules: Record<string, RuleSetting>;
  preset?: string;
  clientIds: string[];
  help: boolean;
  version: boolean;
}

export type FileResult = { path: string } & (
  | { result: AnalysisResult }
  | { readError: string }
);

export interface RunResult {
  results: FileResult[];
  clients?: string[];
}
