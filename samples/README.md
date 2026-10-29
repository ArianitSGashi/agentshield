# Sample pages for AgentShield

These pages exist to exercise the proxy's analyzer end-to-end. Serve them
locally and point an agent at them through the proxy:

```bash
# in one terminal
npx serve samples -p 4173

# in another, with the proxy running
HTTP_PROXY=http://localhost:8080 \
HTTPS_PROXY=http://localhost:8080 \
NODE_EXTRA_CA_CERTS=proxy/.cert/ca.pem \
curl http://localhost:4173/injection-page.html
```

The dashboard should pick the scan up within a few seconds.

## Files

| File | What it tests | Expected verdict |
| ---- | ------------- | ---------------- |
| `safe-page.html` | Plain technical docs, no injection | `safe` |
| `injection-page.html` | HTML comment + invisible div + ALL CAPS instruction | `malicious` |
| `subtle-injection.html` | Polite, conversational injection in prose | `suspicious` or `malicious` |
| `error-handling-guide.html` | Normal-looking article with an instruction hidden off-screen; used in the demo video | `malicious` |

> Note: do not deploy these publicly. They are deliberately crafted to
> trigger AI agents and exist solely as test fixtures.
