import type { EmailContext } from "../types/index.js";
import { parseHtml } from "./parse.js";
import { extract } from "./extract.js";

export function buildEmailContext(html: string): EmailContext {
  const { document, sizeBytes } = parseHtml(html);
  const { elements, images, links, cssDeclarations, cssAtRules, conditionalComments, headings, doctype } =
    extract(document);
  return {
    html,
    sizeBytes,
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
