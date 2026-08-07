import type { ClientId } from "../generated/compat-data.js";

export type Category =
  | "compatibility"
  | "invalid"
  | "accessibility"
  | "performance"
  | "quality";

export type Severity = "error" | "warning" | "info";

export type RuleSetting = "off" | "info" | "warning" | "error";

export type ProfileName = "recommended" | "strict" | "relaxed";

export interface AnalyzeOptions {
  rules?: Record<string, RuleSetting>;
  clients?: ClientId[];
  profile?: ProfileName;
}

export interface Issue {
  ruleId: string;
  severity: Severity;
  category: Category;
  message: string;
  explanation?: string;
  selector?: string;
  line?: number;
  column?: number;
  suggestion?: string;
  /** Present only on compatibility issues kept under a client filter (`analyze` `clients` option). */
  // Object (not a flat string) so future fields (affectedClients, counts) can be added
  // without a breaking change to this public Issue shape.
  compatScope?: { status: "unsupported" | "partial" | "unknown" };
}

export interface EmailContext {
  html: string;
  sizeBytes: number;
  elements: ElementInfo[];
  images: ImageInfo[];
  links: LinkInfo[];
  cssDeclarations: CSSDeclaration[];
  cssAtRules: CSSAtRule[];
  conditionalComments: ConditionalComment[];
  headings: HeadingInfo[];
  doctype?: { name: string; publicId: string; systemId: string } | null;
}

export interface ElementInfo {
  tagName: string;
  attributes: Record<string, string>;
  line?: number;
  column?: number;
}

export interface ImageInfo {
  src: string;
  alt?: string;
  line?: number;
  column?: number;
}

export interface LinkInfo {
  href?: string;
  text?: string;
  line?: number;
  column?: number;
}

export interface CSSDeclaration {
  property: string; // normalized: trimmed + lowercased
  value: string; // trimmed; RAW case preserved
  selector?: string;
  line?: number;
  column?: number;
  source: "inline" | "style";
}

export interface CSSAtRule {
  name: string;
  params: string;
  line?: number;
  column?: number;
  source: "style";
}

export interface ConditionalComment {
  condition: string;
  content: string;
  line?: number;
  column?: number;
}

export interface HeadingInfo {
  level: number;
  text: string;
  line?: number;
  column?: number;
}

export type ClientSupport = "supported" | "partial" | "unsupported" | "unknown";

export interface Reference {
  title: string;
  url: string;
  kind?: "official" | "spec" | "article";
}

export interface ClientStatus {
  client: ClientId;
  status: ClientSupport;
  note?: string;
}

export interface ClientEntry {
  id: string;
  label: string;
}

export interface FeatureData {
  slug: string;
  lastTested?: string;
  stats: Record<string, Record<string, Record<string, string>>>;
  notesByNum: Record<string, string>;
}

export interface DerivedCompat {
  support: ClientStatus[];
  references: Reference[];
  lastTested?: string;
}

export interface CompatibilityMeta {
  support: ClientStatus[];
  references: Reference[];
  alternatives?: string[];
  lastTested?: string;
  dataVersion?: string;
}

export interface EmailRule {
  id: string;
  name: string;
  category: Category;
  severity: Severity;
  features?: string[];
  alternatives?: string[];
  description: string;
  why: string;
  howToFix: string;
  references?: Reference[];
  since?: string;
  compatibility?: CompatibilityMeta;
  check(context: EmailContext): Issue[];
}

export interface AnalysisResult {
  score: number;
  issues: Issue[];
}
