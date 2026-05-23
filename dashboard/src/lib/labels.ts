import type { AttackType, Verdict } from "./types"

// Verdict palette tuned to work in both light and dark themes. Each triple
// pairs a darker shade (light mode) with a paler shade (dark mode). The
// surface alpha is low enough that a verdict-tinted card still reads as a
// card, not a billboard.
export const VERDICT_STYLES: Record<
  Verdict,
  { text: string; surface: string; border: string; dot: string }
> = {
  safe: {
    text: "text-emerald-700 dark:text-emerald-300",
    surface: "bg-emerald-500/10 dark:bg-emerald-500/8",
    border: "border-emerald-600/30 dark:border-emerald-500/25",
    dot: "bg-emerald-600 dark:bg-emerald-400",
  },
  suspicious: {
    text: "text-amber-700 dark:text-amber-300",
    surface: "bg-amber-500/12 dark:bg-amber-500/8",
    border: "border-amber-600/35 dark:border-amber-500/25",
    dot: "bg-amber-600 dark:bg-amber-400",
  },
  malicious: {
    text: "text-rose-700 dark:text-rose-300",
    surface: "bg-rose-500/10 dark:bg-rose-500/8",
    border: "border-rose-600/35 dark:border-rose-500/30",
    dot: "bg-rose-600 dark:bg-rose-400",
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

// Stable per-attack-type color used in the breakdown chart. Hues distinct
// enough to tell apart at a glance, lightness picked so they read clearly
// on both light and dark surfaces.
export const ATTACK_TYPE_COLOR: Record<AttackType, string> = {
  override: "#DC2C5A",
  exfil: "#D97706",
  code_injection: "#B45309",
  jailbreak: "#7C3AED",
  social_eng: "#0369A1",
  indirect_tool: "#BE185D",
  obfuscation: "#047857",
  other: "#475569",
}
