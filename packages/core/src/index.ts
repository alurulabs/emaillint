export { analyze, getRule, getRules } from "./engine.js";
export { getCompatDataVersion } from "./rules/compat-lookup.js";
export { KNOWN_CLIENTS } from "./rules/clients.js";
export type { ClientEntry } from "./rules/clients.js";
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
