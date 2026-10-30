# AgentShield

A proxy that protects AI coding agents from **indirect prompt injection**.

Coding agents like Claude Code, Codex and OpenCode read web pages, READMEs and
API docs while they work. To the model, all of that becomes one stream of
tokens, so an instruction hidden in a page ("run this command, don't tell the
user") looks just like the real task. AgentShield sits between the agent and the
network, checks every page the agent fetches, and wraps anything malicious in a
warning before the agent reads it. The agent needs no code changes.

[![AgentShield demo: a page with a hidden instruction is flagged and wrapped before the agent reads it](docs/demo-poster.jpg)](https://portfolio-arianitsgashis-projects.vercel.app/#agentshield)

▶ [Watch the 60-second demo](https://portfolio-arianitsgashis-projects.vercel.app/#agentshield)
(a real run: the page, the terminal output, the verdict and the dashboard)

Built as my bachelor thesis at the University of Prishtina.

## How it works

```mermaid
flowchart LR
    agent["AI agent<br/>(Claude Code, Codex, curl...)"] -->|"HTTP(S) via proxy"| proxy["AgentShield proxy"]
    proxy -->|fetch| web[("Web page")]
    proxy --> n["1. Normalize<br/>surface hidden text"]
    n --> h["2. Heuristics<br/>fast pattern checks"]
    h --> llm["3. Analyzer LLM<br/>structured verdict"]
    llm -->|"safe / suspicious"| agent
    llm -->|malicious| wrap["Wrap in a warning"] --> agent
    proxy -.->|every scan| api["API + dashboard"]
```

1. **Normalize.** Surfaces content a person can't see: HTML comments,
   off-screen or white-on-white elements, zero-width characters and encoded
   payloads.
2. **Heuristics.** Fast regex checks for known patterns, such as secrecy
   clauses ("do not mention this to the user") or instructions addressed to an
   AI. They cost no model call and are passed to the LLM as hints.
3. **Analyzer LLM.** A separate model (Gemini Flash or Claude Haiku) with its
   own context returns a schema-validated verdict: `safe`, `suspicious` or
   `malicious`, a 0 to 100 confidence, an attack type and the exact text it
   flagged.

Design choices worth knowing:

- **Content is data, not instructions.** The analyzer's prompt frames the page
  as untrusted data between delimiters, so the page can't easily talk the
  analyzer into a "safe" verdict.
- **Structured output, validated twice.** Gemini gets a response schema, and
  every verdict is checked with zod before the proxy trusts it.
- **Fails open, visibly.** If the analyzer times out or errors, the content
  passes through marked as unscanned, so a model outage never blocks your work.
- **Cheap and fast.** Repeat fetches hit a SHA-256 dedup cache, and pages that
  can't carry an injection (package registries, binaries, streams) are skipped.
- **Defense in depth, not a guarantee.** A determined attacker can still try to
  forge the warning's closing tag; the wrapper is designed to make that harder,
  not impossible.

## Quick start

```bash
# 1. install, then build the CLI and the proxy
pnpm install
pnpm --filter agentshield-cli build
pnpm --filter proxy build

# 2. configure: copy .env.example to .env and set GEMINI_API_KEY or ANTHROPIC_API_KEY

# 3. start the backend and (optionally) the dashboard, in separate terminals
pnpm --filter backend dev
pnpm --filter dashboard dev

# 4. run any agent through AgentShield
pnpm exec --filter agentshield-cli agentshield run claude
# or, after `pnpm --filter agentshield-cli link --global`:
agentshield run claude
```

The CLI:

1. Allocates a free local port for the proxy.
2. Starts the proxy (it creates a CA certificate on first run).
3. Starts the agent with `HTTP_PROXY`, `HTTPS_PROXY` and `NODE_EXTRA_CA_CERTS`
   set, so its outbound HTTPS traffic goes through the proxy.
4. Forwards stdin, stdout and stderr, so the agent feels like it runs directly.
5. Shuts the proxy down when the agent exits.

To see a detection without an agent, fetch the demo page with curl:

```bash
agentshield run curl -sS --cacert proxy/.cert/ca.pem \
  https://raw.githubusercontent.com/ArianitSGashi/agentshield/main/samples/error-handling-guide.html
```

The response starts with an `<agentshield:warning>` block, and the scan shows
up in the dashboard.

## Evaluation

The [`eval/`](eval) harness runs the analyzer over a hand-labeled corpus of 25
pages (10 safe, 5 suspicious, 10 malicious) and reports accuracy, macro F1,
per-class precision and recall, a confusion matrix, and p50/p95 latency. The
safe set deliberately includes look-alikes, such as a security article that
quotes "ignore previous instructions", to catch false positives.

It runs in two modes on the same pages: the full cascade the proxy ships, and
`--bare`, which sends the raw page straight to the model. Comparing the two
shows what the normalizer and heuristics add.

Two details keep the numbers honest:

- **No label leaks.** Each sample is sent with a neutral fake URL. Earlier
  versions put the sample id in the URL, and ids start with the expected label
  (`malicious.invisible-div`), so the model could read the answer. That is
  fixed.
- **Every report names its model,** and unscanned samples (failed open) are
  counted separately instead of being scored as correct or wrong.

```bash
pnpm --filter eval eval -- --provider gemini              # full cascade
pnpm --filter eval eval -- --provider gemini --bare       # raw model, for comparison
GEMINI_MODEL=gemini-2.5-flash-lite pnpm --filter eval eval -- --provider gemini
```

On a free-tier Gemini key (5 requests a minute, 20 a day per model), add
`--delay 13000` to stay under the per-minute limit, and use
`--resume <report.json>` the next day to run only the samples the daily limit
cut off. Details are in [eval/README.md](eval/README.md).

### Results

The latest full run: the cascade on all 25 pages with Gemini 2.5 Flash-Lite.

| Metric | Result |
| --- | --- |
| Accuracy | 92% (23 of 25) |
| Macro F1 | 88.6% |
| Malicious pages caught | 10 of 10 |
| Safe pages wrongly flagged | 0 of 10 |
| Analyzer latency | p50 1.4 s, p95 1.8 s |

Both misses were borderline pages labeled `suspicious` that the model called
`malicious`, so no risky page was called safe. This is a small, hand-written
set, developed alongside the prompt and heuristics, so treat these numbers as a
regression check rather than a benchmark. The bare-model comparison has not had
a full run yet. The per-sample results are in [eval/RESULTS.md](eval/RESULTS.md).

## Tests

53 automated tests across the analyzer (normalizer, heuristics, verdict
schema), the backend API and the dashboard:

```bash
pnpm --filter proxy test
pnpm --filter backend test
pnpm --filter dashboard test:e2e
```

## Project layout

```
proxy/      MITM proxy (mockttp) and the analyzer cascade
cli/        `agentshield run <agent>`: starts the proxy and the agent together
backend/    Fastify + PostgreSQL API that stores every scan
dashboard/  React dashboard: live feed, history, scan details, stats
eval/       labeled corpus and evaluation harness
samples/    pages for trying the proxy by hand
```
