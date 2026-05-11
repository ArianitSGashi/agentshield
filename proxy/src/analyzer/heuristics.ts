import type { NormalizationResult } from "./normalize.js";

// Severity ladder. The cascade uses these to decide what to do with the
// signal set:
//
//   - critical: at least one strong, unambiguous injection marker.
//   - warn: matches a pattern that is suspicious but routinely appears in
//           benign content too.
//   - info:  worth surfacing in the prompt as context, not on its own
//           evidence of an attack.
//
// The default cascade in `analyzer/index.ts` still calls the LLM in every
// case — the heuristics serve as *hints* appended to the user prompt, not
// as a replacement classifier. This keeps the false-positive risk on the
// LLM where the prompt was carefully tuned.
export type Severity = "info" | "warn" | "critical";

export type SignalCategory =
  | "instruction-override"
  | "fake-system-tag"
  | "persona-jailbreak"
  | "exfil-target"
  | "hidden-instruction"
  | "imperative-to-ai"
  | "encoded-payload"
  | "secrecy-clause"
  | "destructive-tool-call"
  | "zero-width-cluster";

export interface HeuristicSignal {
  category: SignalCategory;
  severity: Severity;
  pattern: string;
  excerpt: string;
}

export interface HeuristicResult {
  signals: HeuristicSignal[];
  worstSeverity: Severity | null;
}

interface PatternDef {
  category: SignalCategory;
  severity: Severity;
  description: string;
  regex: RegExp;
}

// Excerpt window around a regex match — short enough to keep the LLM prompt
// readable, long enough that the LLM can see the context.
const EXCERPT_RADIUS = 80;

function buildExcerpt(haystack: string, matchIndex: number, matchLength: number): string {
  const start = Math.max(0, matchIndex - EXCERPT_RADIUS);
  const end = Math.min(haystack.length, matchIndex + matchLength + EXCERPT_RADIUS);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < haystack.length ? "..." : "";
  return (prefix + haystack.slice(start, end) + suffix).replace(/\s+/g, " ").trim();
}

// All patterns are intentionally word-bounded or contextually specific to
// avoid hits on legitimate articles about prompt injection (e.g.
// "this is what an 'ignore previous instructions' attack looks like").
const PATTERNS: PatternDef[] = [
  // --- critical: classic injection markers ---
  {
    category: "instruction-override",
    severity: "critical",
    description: "Imperative 'ignore/disregard previous instructions' phrasing",
    regex:
      /\b(?:ignore|disregard|forget|override|bypass)\b[^.\n]{0,40}\b(?:previous|prior|earlier|above|your|all|the)\s+(?:instructions?|prompts?|rules?|guidelines?|system\s+(?:prompt|message))/gi,
  },
  {
    category: "fake-system-tag",
    severity: "critical",
    description: "Forged chat-template token (e.g. <|im_start|>system, <s>[INST])",
    regex: /<\|(?:im_start|im_end|system|user|assistant|endoftext)\|>|<s>\s*\[INST\]|\[\/INST\]/gi,
  },
  {
    category: "persona-jailbreak",
    severity: "critical",
    description: "Classic jailbreak persona handoff (DAN, AIM, developer mode)",
    regex:
      /\byou\s+are\s+(?:now\s+)?(?:dan|aim|stan|do\s*anything\s*now|in\s+developer\s+mode|jailbroken)|\bact\s+as\s+(?:dan|aim|stan|developer\s+mode)/gi,
  },
  {
    category: "secrecy-clause",
    severity: "critical",
    description: "'Do not mention this to the user' or equivalent",
    regex:
      /\b(?:do\s+not|don'?t|never)\s+(?:mention|tell|reveal|show|inform|notify|disclose)\b[^.\n]{0,40}\b(?:user|developer|operator|human|to\s+them)/gi,
  },

  // --- critical: known exfiltration targets ---
  {
    category: "exfil-target",
    severity: "critical",
    description: "Reference to high-value secret files (~/.ssh, ~/.aws, .env)",
    regex:
      /(?:~|\$HOME|\/root|\/home\/[^\s]+)\/?\.(?:ssh\/?[^\s]*|aws\/?[^\s]*|gnupg\/?[^\s]*|config\/[^\s]*)|\b(?:id_rsa|id_ed25519|authorized_keys|credentials\.json)\b|\bprocess\.env\b/g,
  },

  // --- warn: imperative addressed to an AI reader ---
  {
    category: "imperative-to-ai",
    severity: "warn",
    description: "Imperative directly addressed to an AI assistant",
    regex:
      /\b(?:hey|note|important|reminder|instructions?|attention)\b[^\n]{0,40}\b(?:ai|llm|assistant|claude|chatgpt|copilot|model|agent)\b[^.\n]{0,60}\b(?:please|must|should|will|need\s+to|do\s+the\s+following|follow|execute|run|call|invoke)/gi,
  },

  // --- warn: encoded-payload heuristic ---
  // Conservative: base64-looking blob of >=120 chars near a shell/curl/eval verb
  // within 200 chars. Bare base64 (e.g. an embedded image) is fine; the
  // problem is base64-of-shell-instruction sitting next to a "decode and run"
  // verb.
  {
    category: "encoded-payload",
    severity: "warn",
    description: "Long base64-like block near a 'decode/execute' verb",
    regex:
      /(?:decode|run|execute|eval|pipe|chmod\s*\+x|bash\s+-c|sh\s+-c)[^]{0,200}[A-Za-z0-9+/]{120,}={0,2}|[A-Za-z0-9+/]{120,}={0,2}[^]{0,200}(?:decode|eval|bash\s+-c|sh\s+-c|\|\s*bash)/gi,
  },

  // --- warn: destructive tool-call invocation ---
  {
    category: "destructive-tool-call",
    severity: "warn",
    description: "Asks the assistant to call its tools with a destructive command",
    regex:
      /\b(?:call|invoke|use)\s+your\s+(?:shell|bash|exec|terminal|tool)\b[^.\n]{0,80}\b(?:rm\s+-rf|sudo|chmod\s+777|wget|curl)/gi,
  },
];

// Hidden segments from the normalizer earn their own (per-kind) signal so
// that the LLM sees them flagged even if the regex above misses them.
function signalsFromHidden(norm: NormalizationResult): HeuristicSignal[] {
  const out: HeuristicSignal[] = [];
  for (const h of norm.hiddenSegments) {
    if (h.kind === "zero-width-cluster") {
      out.push({
        category: "zero-width-cluster",
        severity: "warn",
        pattern: "Run of zero-width / direction-override characters",
        excerpt: h.text,
      });
      continue;
    }
    // Hidden HTML earns "warn" by default. The LLM still adjudicates whether
    // the *content* of the hidden segment is malicious; we only flag that
    // hiding it is unusual.
    out.push({
      category: "hidden-instruction",
      severity: "warn",
      pattern: `Hidden HTML element (${h.kind})`,
      excerpt: h.text.slice(0, 200),
    });
  }
  return out;
}

const SEVERITY_RANK: Record<Severity, number> = { info: 1, warn: 2, critical: 3 };

function worstOf(signals: HeuristicSignal[]): Severity | null {
  let worst: Severity | null = null;
  for (const s of signals) {
    if (worst === null || SEVERITY_RANK[s.severity] > SEVERITY_RANK[worst]) {
      worst = s.severity;
    }
  }
  return worst;
}

// Cap how many signals we surface per category — a page might have 20
// instances of the same pattern; the LLM only needs a couple of examples.
const PER_CATEGORY_CAP = 3;

export function runHeuristics(content: string, normalized: NormalizationResult): HeuristicResult {
  const found: HeuristicSignal[] = [];
  const seenByCategory = new Map<SignalCategory, number>();

  for (const def of PATTERNS) {
    def.regex.lastIndex = 0;
    for (let m = def.regex.exec(content); m !== null; m = def.regex.exec(content)) {
      const count = seenByCategory.get(def.category) ?? 0;
      if (count >= PER_CATEGORY_CAP) break;
      seenByCategory.set(def.category, count + 1);
      found.push({
        category: def.category,
        severity: def.severity,
        pattern: def.description,
        excerpt: buildExcerpt(content, m.index, m[0].length),
      });
      // Avoid infinite loop on zero-width matches.
      if (m[0].length === 0) def.regex.lastIndex += 1;
    }
  }

  for (const s of signalsFromHidden(normalized)) found.push(s);

  return { signals: found, worstSeverity: worstOf(found) };
}

export function renderHeuristicHints(result: HeuristicResult): string {
  if (result.signals.length === 0) return "";
  const lines = result.signals.map(
    (s, i) => `  [${i + 1}] (${s.severity}) ${s.category} — ${s.pattern}\n      excerpt: ${s.excerpt}`,
  );
  return [
    "---PRE-DETECTED SIGNALS (from a fast heuristic scan; treat as hints, not as ground truth)---",
    ...lines,
    "---END PRE-DETECTED SIGNALS---",
  ].join("\n");
}
