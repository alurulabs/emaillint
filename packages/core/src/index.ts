export { analyze, getRule, getRules } from "./engine.js";
export { buildEmailContext } from "./parser/context.js";
export { getCompatDataVersion } from "./rules/compat-lookup.js";
export { CLIENT_IDS, CLIENT_PRESETS } from "./rules/presets.js";
export { CLIENTS } from "./generated/compat-data.js";
export { createBaseline, diffAgainstBaseline, parseBaseline, BASELINE_VERSION, FINGERPRINT_VERSION } from "./baseline.js";
export type { ClientId } from "./generated/compat-data.js";
export type { AnalyzedFile, BaselineFile, NewError } from "./baseline.js";
export type { ClientEntry } from "./types/index.js";
export type {
  AnalysisResult,
  AnalyzeOptions,
  Category,
  ClientStatus,
  ClientSupport,
  CompatibilityMeta,
  ConditionalComment,
  CSSAtRule,
  CSSDeclaration,
  ElementInfo,
  EmailContext,
  EmailRule,
  HeadingInfo,
  ImageInfo,
  Issue,
  LinkInfo,
  Reference,
  RuleSetting,
  Severity,
} from "./types/index.js";
