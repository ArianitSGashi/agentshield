import type { AttackType, Verdict } from "./types"

// Soft, low-saturation verdict palette tuned for the light theme. Each
// triple is (text color, surface color, border color). Used by every
// verdict-aware component so the palette stays consistent.
export const VERDICT_STYLES: Record<
  Verdict,
  { text: string; surface: string; border: string; dot: string }
> = {
  safe: {
    text: "text-emerald-700",
    surface: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  suspicious: {
    text: "text-amber-700",
    surface: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  malicious: {
    text: "text-rose-700",
    surface: "bg-rose-50",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
}

// Display strings + a short tooltip explanation for each attack type. Kept
// in one place so badges, the breakdown chart, and the detail page stay in
// sync.
export const ATTACK_TYPE_META: Record<
  AttackType,
  { label: string; description: string }
> = {
  override: {
    label: "Instruction override",
    description: '"Ignore previous instructions" and similar attempts to overwrite the agent\'s system prompt.',
  },
  exfil: {
    label: "Data exfiltration",
    description: "Asks the agent to read secrets, env vars, or local files and leak them.",
  },
  code_injection: {
    label: "Code injection",
    description: "Asks the agent to write or execute attacker-chosen code.",
  },
  jailbreak: {
    label: "Persona jailbreak",
    description: "Switches the agent to an unsafe persona such as DAN or developer mode.",
  },
  social_eng: {
    label: "Social engineering",
    description: "Polite or authoritative framing aimed at persuading the agent to comply.",
  },
  indirect_tool: {
    label: "Indirect tool call",
    description: "Asks the agent to invoke its tools (shell, fs, network) destructively.",
  },
  obfuscation: {
    label: "Obfuscation",
    description: "Delivered primarily via hidden HTML, zero-width characters, or encoded payloads.",
  },
  other: {
    label: "Other",
    description: "Confirmed malicious but does not cleanly fit the other categories.",
  },
}

// Stable, soft per-attack-type color used in the breakdown chart. Hues
// distinct enough to tell apart at a glance, lightness/chroma low enough
// to feel calm on a white surface.
export const ATTACK_TYPE_COLOR: Record<AttackType, string> = {
  override: "oklch(0.65 0.14 25)",
  exfil: "oklch(0.7 0.12 55)",
  code_injection: "oklch(0.72 0.12 90)",
  jailbreak: "oklch(0.62 0.13 295)",
  social_eng: "oklch(0.65 0.1 210)",
  indirect_tool: "oklch(0.62 0.13 325)",
  obfuscation: "oklch(0.66 0.1 155)",
  other: "oklch(0.62 0.02 255)",
}
