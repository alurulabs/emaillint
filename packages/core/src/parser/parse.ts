import { parse, type DefaultTreeAdapterMap } from "parse5";

export type Document = DefaultTreeAdapterMap["document"];

export function parseHtml(html: string): { document: Document; sizeBytes: number } {
  if (typeof html !== "string") {
    throw new TypeError("parseHtml(): html must be a string");
  }
  const document = parse(html, { sourceCodeLocationInfo: true });
  const sizeBytes = Buffer.byteLength(html, "utf8");
  return { document, sizeBytes };
}
