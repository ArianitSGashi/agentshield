import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Repo root is two levels up from cli/dist or cli/src.
const REPO_ROOT = resolve(__dirname, "..", "..");

const PROXY_DIST = resolve(REPO_ROOT, "proxy", "dist", "index.js");
const PROXY_SRC = resolve(REPO_ROOT, "proxy", "src", "index.ts");
const CERT_PATH = resolve(REPO_ROOT, "proxy", ".cert", "ca.pem");

const PROXY_READY_LOG = "[agentshield] Proxy listening";
const PROXY_BOOT_TIMEOUT_MS = 15_000;

async function pickFreePort(): Promise<number> {
  return new Promise((res, rej) => {
    const srv = createServer();
    srv.unref();
    srv.on("error", rej);
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      if (addr === null || typeof addr === "string") {
        srv.close();
        rej(new Error("could not allocate a free port"));
        return;
      }
      const port = addr.port;
      srv.close((err) => (err ? rej(err) : res(port)));
    });
  });
}

interface ProxyHandle {
  child: ChildProcess;
  port: number;
}

async function startProxy(port: number): Promise<ProxyHandle> {
  // Prefer the built proxy if present (faster start, no tsx dep). Fall back
  // to running the TS source via tsx, which is what most thesis-time users
  // will hit because they haven't run `pnpm --filter proxy build` yet.
  const useDist = existsSync(PROXY_DIST);
  const cmd = useDist ? process.execPath : "tsx";
  const args = useDist ? [PROXY_DIST] : [PROXY_SRC];

  const child = spawn(cmd, args, {
    cwd: REPO_ROOT,
    env: {
      ...process.env,
      PROXY_PORT: String(port),
    },
    stdio: ["ignore", "pipe", "pipe"],
    // tsx is a .cmd shim on Windows; shell:true makes spawn find it on PATH.
    shell: !useDist && process.platform === "win32",
  });

  try {
    await new Promise<void>((res, rej) => {
      let buffer = "";
      const timer = setTimeout(() => {
        rej(new Error(`proxy did not become ready within ${PROXY_BOOT_TIMEOUT_MS}ms`));
      }, PROXY_BOOT_TIMEOUT_MS);

      const onData = (chunk: Buffer) => {
        const text = chunk.toString("utf8");
        process.stdout.write(`[proxy] ${text}`);
        buffer += text;
        if (buffer.includes(PROXY_READY_LOG)) {
          clearTimeout(timer);
          child.stdout?.off("data", onData);
          res();
        }
      };

      child.stdout?.on("data", onData);
      child.stderr?.on("data", (chunk: Buffer) => process.stderr.write(`[proxy] ${chunk}`));
      child.on("exit", (code) => {
        clearTimeout(timer);
        rej(new Error(`proxy exited before becoming ready (code ${code ?? "?"})`));
      });
      child.on("error", (err) => {
        clearTimeout(timer);
        rej(err);
      });
    });
  } catch (err) {
    // Critical: if readiness fails (timeout or error) we MUST kill the child,
    // otherwise it lingers as a port-holding zombie after the CLI exits and
    // every subsequent run hits a flaky port collision.
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 1_500).unref();
    }
    throw err;
  }

  return { child, port };
}

async function stopProxy(handle: ProxyHandle): Promise<void> {
  return new Promise((res) => {
    const child = handle.child;
    if (child.exitCode !== null || child.signalCode !== null) {
      res();
      return;
    }
    child.once("exit", () => res());
    // SIGTERM works cross-platform via Node's emulation on Windows.
    child.kill("SIGTERM");
    // Hard-kill after 3s so the CLI never hangs.
    setTimeout(() => child.kill("SIGKILL"), 3_000).unref();
  });
}

export async function runAgent(command: string, args: string[]): Promise<number> {
  if (!existsSync(CERT_PATH)) {
    // The proxy generates the CA on first run, so this is just a friendly
    // heads-up — proceed regardless.
    process.stderr.write(
      `[agentshield] note: CA cert at ${CERT_PATH} does not exist yet; ` +
        `the proxy will generate one on startup.\n`,
    );
  }

  const port = await pickFreePort();
  process.stdout.write(`[agentshield] Allocated proxy port: ${port}\n`);

  const handle = await startProxy(port);

  const proxyUrl = `http://localhost:${port}`;
  process.stdout.write(`[agentshield] Launching: ${command} ${args.join(" ")}\n`);

  const agent = spawn(command, args, {
    env: {
      ...process.env,
      HTTP_PROXY: proxyUrl,
      HTTPS_PROXY: proxyUrl,
      // Lowercase variants are honored by curl, requests, etc.
      http_proxy: proxyUrl,
      https_proxy: proxyUrl,
      NODE_EXTRA_CA_CERTS: CERT_PATH,
      AGENT_NAME: command,
    },
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  const forward = (sig: NodeJS.Signals) => {
    if (!agent.killed) agent.kill(sig);
  };
  process.on("SIGINT", () => forward("SIGINT"));
  process.on("SIGTERM", () => forward("SIGTERM"));

  const exitCode: number = await new Promise((res) => {
    agent.on("error", (err) => {
      process.stderr.write(
        `[agentshield] failed to launch "${command}": ${err.message}\n` +
          `[agentshield] is "${command}" on your PATH?\n`,
      );
      res(127);
    });
    agent.on("exit", (code, signal) => {
      if (signal) {
        process.stderr.write(`[agentshield] agent terminated by ${signal}\n`);
        // Conventional shell exit: 128 + signal number, but Node doesn't
        // expose the number; 130 (SIGINT) is the common case.
        res(signal === "SIGINT" ? 130 : 1);
      } else {
        res(code ?? 0);
      }
    });
  });

  await stopProxy(handle);
  return exitCode;
}
