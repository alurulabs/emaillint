import type {
  CSSAtRule,
  CSSDeclaration,
  ConditionalComment,
  ElementInfo,
  HeadingInfo,
  ImageInfo,
  LinkInfo,
} from "../types/index.js";
import type { Document } from "./parse.js";
import { parseInlineStyle, parseStyleBlock } from "./css.js";

interface NodeLike {
  nodeName?: string;
  childNodes?: NodeLike[];
  attrs?: { name: string; value: string }[];
  value?: string;
  data?: string;
  name?: string;
  publicId?: string;
  systemId?: string;
  sourceCodeLocation?: { startLine?: number; startCol?: number };
}

export interface ExtractionResult {
  elements: ElementInfo[];
  images: ImageInfo[];
  links: LinkInfo[];
  cssDeclarations: CSSDeclaration[];
  cssAtRules: CSSAtRule[];
  conditionalComments: ConditionalComment[];
  headings: HeadingInfo[];
  doctype: { name: string; publicId: string; systemId: string } | null;
}

function walk(node: NodeLike, visit: (n: NodeLike) => void): void {
  visit(node);
  if (node.childNodes) for (const child of node.childNodes) walk(child, visit);
}

function lineOf(node: NodeLike): number | undefined {
  return node.sourceCodeLocation?.startLine;
}
function colOf(node: NodeLike): number | undefined {
  return node.sourceCodeLocation?.startCol;
}

function attrsToRecord(attrs: NodeLike["attrs"]): Record<string, string> {
  const out: Record<string, string> = {};
  if (attrs) for (const a of attrs) out[a.name] = a.value;
  return out;
}

function parseConditionalComment(
  data: string,
  line: number | undefined,
  column: number | undefined,
): ConditionalComment | null {
  const match = data.match(/^\s*\[if\s+([^\]]+)\]>([\s\S]*?)<!\[\s*endif\s*\]/i);
  if (!match) return null;
  return { condition: match[1].trim(), content: match[2].trim(), line, column };
}

function elementText(el: NodeLike): string {
  let text = "";
  walk(el, (n) => {
    if (n.nodeName === "#text") text += n.value ?? "";
  });
  return text;
}

// Accessible text for link content: text nodes plus non-empty <img alt>
// (empty alt = decorative, contributes no accessible name). Used so a link
// whose only content is a descriptive image is not reported as empty.
function accessibleText(el: NodeLike): string {
  let text = "";
  walk(el, (n) => {
    if (n.nodeName === "#text") {
      text += n.value ?? "";
    } else if (n.nodeName === "img") {
      const alt = n.attrs?.find((a) => a.name === "alt");
      if (alt && alt.value) text += alt.value;
    }
  });
  return text;
}

function findDoctype(document: NodeLike): ExtractionResult["doctype"] {
  const top = document.childNodes ?? [];
  for (const n of top) {
    if (
      n.nodeName === "#documentType" ||
      typeof n.name === "string" ||
      "publicId" in n ||
      "systemId" in n
    ) {
      return {
        name: (n.name ?? "").toLowerCase(),
        publicId: n.publicId ?? "",
        systemId: n.systemId ?? "",
      };
    }
  }
  return null;
}

const HEADING_RE = /^h([1-6])$/;

export function extract(document: Document): ExtractionResult {
  const elements: ElementInfo[] = [];
  const images: ImageInfo[] = [];
  const links: LinkInfo[] = [];
  const cssDeclarations: CSSDeclaration[] = [];
  const cssAtRules: CSSAtRule[] = [];
  const conditionalComments: ConditionalComment[] = [];
  const headings: HeadingInfo[] = [];

  const doctype = findDoctype(document as unknown as NodeLike);

  walk(document as unknown as NodeLike, (node) => {
    const nodeName = node.nodeName ?? "";
    if (nodeName.startsWith("#")) {
      if (nodeName === "#comment") {
        const cc = parseConditionalComment(node.data ?? "", lineOf(node), colOf(node));
        if (cc) conditionalComments.push(cc);
      }
      return;
    }

    const attrs = attrsToRecord(node.attrs);
    const line = lineOf(node);
    const column = colOf(node);
    elements.push({ tagName: nodeName, attributes: attrs, line, column });

    if (nodeName === "img") {
      images.push({
        src: attrs.src ?? "",
        alt: Object.prototype.hasOwnProperty.call(attrs, "alt") ? attrs.alt : undefined,
        line,
        column,
      });
    } else if (nodeName === "a") {
      links.push({
        href: Object.prototype.hasOwnProperty.call(attrs, "href") ? attrs.href : undefined,
        text: accessibleText(node).trim(),
        line,
        column,
      });
    } else if (nodeName === "style") {
      const text = elementText(node);
      const { decls, atRules } = parseStyleBlock(text, line);
      cssDeclarations.push(...decls);
      cssAtRules.push(...atRules);
    } else {
      const h = nodeName.match(HEADING_RE);
      if (h) headings.push({ level: Number(h[1]), text: elementText(node).trim(), line, column });
    }

    if (attrs.style) cssDeclarations.push(...parseInlineStyle(attrs.style, line, column));
  });

  return {
    elements,
    images,
    links,
    cssDeclarations,
    cssAtRules,
    conditionalComments,
    headings,
    doctype,
  };
}
