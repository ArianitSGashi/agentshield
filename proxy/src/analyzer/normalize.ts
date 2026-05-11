// Surface content that is meant to be invisible to humans but visible to an
// LLM reading the raw page. Attackers rely on that asymmetry — HTML comments,
// off-screen divs, white-on-white text, zero-width characters. The analyzer
// LLM sees the same bytes the agent's LLM will see, so technically it has the
// information; but explicitly flagging hidden sections both improves the
// signal-to-noise ratio of the prompt and gives the heuristic layer a clean
// surface to inspect.

export type HiddenKind =
  | "html-comment"
  | "display-none"
  | "visibility-hidden"
  | "off-screen"
  | "zero-width-cluster"
  | "color-camo"
  | "aria-hidden";

export interface HiddenSegment {
  kind: HiddenKind;
  text: string;
}

export interface NormalizationResult {
  /**
   * Original content with annotations. Used as the LLM input.
   * Hidden segments are unchanged in place (so the LLM sees the page as the
   * agent would) but the appended summary makes them impossible to miss.
   */
  annotated: string;
  /** Hidden bits we surfaced — used by heuristics and reported upstream. */
  hiddenSegments: HiddenSegment[];
  /** Length of the original content in characters, pre-annotation. */
  originalLength: number;
}

// Zero-width / format / direction-override characters. Used in real-world
// attacks to slip an instruction past a human eyeballing the source.
const INVISIBLE_CHAR_RE = /[​-‏‪-‮⁠-⁯﻿]/;
const INVISIBLE_RUN_RE = /[​-‏‪-‮⁠-⁯﻿]{2,}/g;

const HTML_COMMENT_RE = /<!--([\s\S]*?)-->/g;

// Permissive — we only care that the attribute is present and contains a
// hiding directive; exact CSS parsing is overkill and brittle.
const DISPLAY_NONE_RE = /style\s*=\s*["'][^"']*display\s*:\s*none/gi;
const VISIBILITY_HIDDEN_RE = /style\s*=\s*["'][^"']*visibility\s*:\s*hidden/gi;
const OFFSCREEN_RE =
  /style\s*=\s*["'][^"']*(?:position\s*:\s*absolute[^"']*(?:left|top)\s*:\s*-?\d{3,}|(?:left|top)\s*:\s*-?\d{4,})/gi;
const COLOR_CAMO_RE =
  /style\s*=\s*["'][^"']*color\s*:\s*(white|#fff|#ffffff|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))[^"']*background(?:-color)?\s*:\s*(white|#fff|#ffffff|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))/gi;
const ARIA_HIDDEN_RE = /aria-hidden\s*=\s*["']true["']/gi;

function extractElementText(html: string, startIdx: number): string | null {
  // Walk forward from the matched opening-tag position until we find the
  // closing tag, then return the inner text. Best-effort — nested tags of
  // the same name will trip this. That's acceptable for the heuristic layer.
  const tagMatch = html.slice(startIdx).match(/^<(\w+)\b/i);
  if (!tagMatch) return null;
  const tagName = tagMatch[1];
  const closeRe = new RegExp(`</${tagName}\\s*>`, "i");
  const closeMatch = html.slice(startIdx).match(closeRe);
  if (!closeMatch || closeMatch.index === undefined) return null;
  const inner = html.slice(startIdx + tagMatch[0].length, startIdx + closeMatch.index);
  // Strip nested HTML so we get readable text.
  return inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function findHidden(html: string, re: RegExp, kind: HiddenKind, out: HiddenSegment[]): void {
  // Re-anchor each match to the start of its element so we can extract the
  // inner text. The regex itself only locates the style attribute.
  re.lastIndex = 0;
  for (let m = re.exec(html); m !== null; m = re.exec(html)) {
    // Walk back to the nearest "<" to find the element opening.
    const lt = html.lastIndexOf("<", m.index);
    if (lt < 0) continue;
    const text = extractElementText(html, lt);
    if (text && text.length > 0) {
      out.push({ kind, text: text.slice(0, 500) });
    }
  }
}

export function normalize(content: string): NormalizationResult {
  const hidden: HiddenSegment[] = [];

  // HTML comments — extracted regardless of surrounding context, since their
  // semantics are always "invisible to humans, visible to parsers".
  HTML_COMMENT_RE.lastIndex = 0;
  for (let m = HTML_COMMENT_RE.exec(content); m !== null; m = HTML_COMMENT_RE.exec(content)) {
    const text = m[1].trim();
    if (text.length > 0) hidden.push({ kind: "html-comment", text: text.slice(0, 500) });
  }

  findHidden(content, DISPLAY_NONE_RE, "display-none", hidden);
  findHidden(content, VISIBILITY_HIDDEN_RE, "visibility-hidden", hidden);
  findHidden(content, OFFSCREEN_RE, "off-screen", hidden);
  findHidden(content, COLOR_CAMO_RE, "color-camo", hidden);
  findHidden(content, ARIA_HIDDEN_RE, "aria-hidden", hidden);

  // Zero-width clusters anywhere in the document. We don't list every
  // occurrence — just record one segment so the heuristic layer knows.
  if (INVISIBLE_RUN_RE.test(content)) {
    const sample = content.match(INVISIBLE_RUN_RE)?.[0] ?? "";
    hidden.push({ kind: "zero-width-cluster", text: `${sample.length} invisible chars` });
  }

  let annotated = content;
  if (hidden.length > 0) {
    const summary = hidden
      .map((h, i) => `  [${i + 1}] ${h.kind}: ${h.text.replace(/\s+/g, " ").slice(0, 200)}`)
      .join("\n");
    annotated =
      content +
      "\n\n---NORMALIZER NOTES (these elements were hidden in the source)---\n" +
      summary;
  }

  return { annotated, hiddenSegments: hidden, originalLength: content.length };
}

export function containsInvisibleChars(s: string): boolean {
  return INVISIBLE_CHAR_RE.test(s);
}
