import { generateCACertificate } from "mockttp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CERT_DIR = resolve(__dirname, "../.cert");
const KEY_PATH = resolve(CERT_DIR, "ca.key");
const CERT_PATH = resolve(CERT_DIR, "ca.pem");

export { CERT_PATH };

export async function getOrCreateCACert(): Promise<{ key: string; cert: string }> {
  if (existsSync(KEY_PATH) && existsSync(CERT_PATH)) {
    const [key, cert] = await Promise.all([
      readFile(KEY_PATH, "utf-8"),
      readFile(CERT_PATH, "utf-8"),
    ]);
    return { key, cert };
  }

  const ca = await generateCACertificate({
    subject: { commonName: "AgentShield Proxy CA" },
  });

  await mkdir(CERT_DIR, { recursive: true });
  await Promise.all([
    writeFile(KEY_PATH, ca.key),
    writeFile(CERT_PATH, ca.cert),
  ]);

  return ca;
}
