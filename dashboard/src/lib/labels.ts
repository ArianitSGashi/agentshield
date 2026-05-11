import type { AttackType } from "./types"

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

// Stable color per attack type, used in the breakdown chart.
export const ATTACK_TYPE_COLOR: Record<AttackType, string> = {
  override: "oklch(0.7 0.2 25)",
  exfil: "oklch(0.7 0.18 50)",
  code_injection: "oklch(0.72 0.18 80)",
  jailbreak: "oklch(0.7 0.18 290)",
  social_eng: "oklch(0.7 0.16 200)",
  indirect_tool: "oklch(0.7 0.18 320)",
  obfuscation: "oklch(0.7 0.14 150)",
  other: "oklch(0.65 0.04 240)",
}
