# AgentShield evaluation harness

Runs the proxy's analyzer against a labeled corpus of safe / suspicious /
malicious samples and reports precision, recall, F1, and latency per
provider. Used to compare the two LLM backends and to validate that changes
to the prompt or pre-filter do not regress detection quality.

## What's in `corpus/`

Hand-crafted samples organized by ground-truth label:

- `safe/` — realistic developer content (MDN, Stack Overflow, READMEs,
  blog posts, JSON, plaintext). Includes deliberately tricky cases such as
  an article *about* prompt injection that quotes "ignore previous
  instructions" — those should still be classified `safe`.
- `suspicious/` — borderline injections that hide a leak/exfil instruction
  inside otherwise legitimate prose.
- `malicious/` — unambiguous injections: hidden HTML, fake system
  prompts, base64-encoded shell commands, tool-call hijacks, jailbreaks.

Labels live in `corpus/manifest.json`. To add a sample, drop the file under
the right subdirectory and append an entry to the manifest.

## Running

```bash
# Run all configured providers (auto-detected from env keys)
pnpm --filter eval eval

# Run a single provider
pnpm --filter eval eval -- --provider gemini
pnpm --filter eval eval -- --provider anthropic

# Run only samples whose id matches a substring
pnpm --filter eval eval -- --filter malicious.

# Stop after N samples
pnpm --filter eval eval -- --limit 5

# Skip the cascade — measure the raw LLM directly. Use this to compare
# against the default run, which mirrors what the proxy ships in
# production (normalize + heuristics + LLM).
pnpm --filter eval eval -- --bare
```

The runner is sequential by design — parallel calls would make latency
numbers meaningless and trip free-tier rate limits.

## Cascade vs bare mode

By default the runner mirrors the proxy's production pipeline from
`proxy/src/analyzer/index.ts`: it normalizes the page (surfacing HTML
comments and hidden elements), runs the heuristic regex layer, and
appends the heuristic findings to the LLM prompt as advisory hints.
Pass `--bare` to bypass both steps and measure the LLM on the raw
content.

Running once with each mode produces the headline before/after numbers:
which samples the cascade catches that the bare LLM misses, and at what
latency cost.

## Output

Each run writes two files under `results/`:

- `report-<timestamp>.md` and `latest.md` — human-readable report with
  per-provider accuracy, macro F1, per-class precision/recall, confusion
  matrix, latency p50/p95, and a per-sample table that flags
  disagreements.
- `report-<timestamp>.json` and `latest.json` — the same data structured
  for downstream tooling.

## What "accuracy" and "macro F1" mean here

- **Accuracy**: fraction of *scanned* samples whose predicted label matches
  the ground-truth label. Unscanned (failed-open) samples are excluded
  from the denominator.
- **Macro F1**: unweighted mean of the per-class F1 scores. Treats safe /
  suspicious / malicious as equally important, so a model that nails
  `safe` (the majority class in real traffic) but misses every
  `malicious` will still score poorly.

## Adding samples

Keep the corpus small but high-signal. Every new sample should test
something the existing ones don't — a new obfuscation technique, a new
delivery vector, a new false-positive trap. Note the rationale in the
`description` field so future contributors understand why it earns a slot.
