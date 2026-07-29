import postcss from "postcss";
import type { CSSAtRule, CSSDeclaration } from "../types/index.js";

function normalizeProperty(p: string): string {
  return p.trim().toLowerCase();
}

// Token-aware scanner: splits declarations on top-level `;` only,
// respecting parens, quoted strings, and /* comments */.
export function parseInlineStyle(
  style: string,
  line: number | undefined,
  column: number | undefined,
): CSSDeclaration[] {
  const decls: CSSDeclaration[] = [];
  let buf = "";
  let depthParen = 0;
  let quote: '"' | "'" | null = null;
  let inComment = false;

  const flush = () => {
    const raw = buf;
    buf = "";
    if (!raw.trim()) return;
    const idx = raw.indexOf(":");
    if (idx === -1) return;
    const property = normalizeProperty(raw.slice(0, idx));
    if (!property) return;
    let value = raw.slice(idx + 1).trim();
    value = value.replace(/!important$/i, "").trim();
    if (!value) return;
    decls.push({ property, value, source: "inline", selector: undefined, line, column });
  };

  for (let i = 0; i < style.length; i++) {
    const ch = style[i];
    const next = style[i + 1];

    if (inComment) {
      if (ch === "*" && next === "/") { inComment = false; i++; }
      continue;
    }
    if (quote) {
      buf += ch;
      if (ch === quote && style[i - 1] !== "\\") quote = null;
      continue;
    }
    if (ch === "/" && next === "*") { inComment = true; i++; continue; }
    if (ch === '"' || ch === "'") { quote = ch; buf += ch; continue; }
    if (ch === "(") { depthParen++; buf += ch; continue; }
    if (ch === ")") { depthParen = Math.max(0, depthParen - 1); buf += ch; continue; }
    if (ch === ";" && depthParen === 0) { flush(); continue; }
    buf += ch;
  }
  flush();
  return decls;
}

export function parseStyleBlock(
  css: string,
  blockStartLine: number | undefined,
): { decls: CSSDeclaration[]; atRules: CSSAtRule[] } {
  const decls: CSSDeclaration[] = [];
  const atRules: CSSAtRule[] = [];

  let root;
  try {
    root = postcss.parse(css);
  } catch {
    return { decls, atRules };
  }

  root.walkDecls((d) => {
    const parent = d.parent as { type?: string; selector?: string } | undefined;
    const selector = parent && parent.type === "rule" ? parent.selector : undefined;
    const relLine = d.source?.start?.line ?? 1;
    const relCol = d.source?.start?.column;
    decls.push({
      property: normalizeProperty(d.prop),
      value: d.value,
      source: "style",
      selector,
      line: blockStartLine === undefined ? undefined : blockStartLine + relLine - 1,
      column: relCol,
    });
  });

  root.walkAtRules((at) => {
    const relLine = at.source?.start?.line ?? 1;
    const relCol = at.source?.start?.column;
    atRules.push({
      name: at.name,
      params: at.params,
      source: "style",
      line: blockStartLine === undefined ? undefined : blockStartLine + relLine - 1,
      column: relCol,
    });
  });

  return { decls, atRules };
}
