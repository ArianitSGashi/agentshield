import type { AttackType, Verdict } from "./types"

// Verdict palette tuned for the dark "private bank" theme. Each triple is
// (text color, surface tint, border tint). Tints are intentionally low
// alpha so a verdict-tinted card still reads as a card, not a billboard.
export const VERDICT_STYLES: Record<
  Verdict,
  { text: string; surface: string; border: string; dot: string }
> = {
  safe: {
    text: "text-emerald-300",
    surface: "bg-emerald-500/8",
    border: "border-emerald-500/25",
    dot: "bg-emerald-400",
  },
  suspicious: {
    text: "text-amber-300",
    surface: "bg-amber-500/8",
    border: "border-amber-500/25",
    dot: "bg-amber-400",
  },
  malicious: {
    text: "text-rose-300",
    surface: "bg-rose-500/8",
    border: "border-rose-500/30",
    dot: "bg-rose-400",
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
// enough to tell apart at a glance, lightness raised so they read clearly
// on the dark surface without being neon. Champagne gold is reserved for
// the primary accent and intentionally absent here.
export const ATTACK_TYPE_COLOR: Record<AttackType, string> = {
  override: "#E27484",
  exfil: "#E8A86B",
  code_injection: "#E0BC7A",
  jailbreak: "#B79CE4",
  social_eng: "#8FB6D9",
  indirect_tool: "#D391C2",
  obfuscation: "#87C8A4",
  other: "#9AA3B5",
}
