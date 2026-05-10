# agentshield

LLM-powered proxy that protects AI coding agents from prompt-injection attacks.

## Quick start

```bash
# 1. install + build the CLI
pnpm install
pnpm --filter agentshield-cli build

# 2. start the backend (separate terminal)
pnpm --filter backend dev

# 3. (optional) start the dashboard (separate terminal)
pnpm --filter dashboard dev

# 4. run an AI agent through agentshield
pnpm exec --filter agentshield-cli agentshield run claude
# or, after `pnpm --filter agentshield-cli link --global`:
agentshield run claude
```

The CLI:
1. Allocates a free local port for the proxy.
2. Spawns the proxy (auto-generates a CA cert on first run).
3. Spawns the agent with `HTTP_PROXY`, `HTTPS_PROXY`, and
   `NODE_EXTRA_CA_CERTS` set so its outbound HTTPS traffic is intercepted.
4. Forwards stdin/stdout/stderr; the agent feels like it's running directly.
5. Shuts the proxy down when the agent exits.

## Architecture

See [CLAUDE.md](CLAUDE.md) for the full design.
