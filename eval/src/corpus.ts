import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { CorpusSample } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CORPUS_DIR = resolve(__dirname, "..", "corpus");
const MANIFEST_PATH = resolve(CORPUS_DIR, "manifest.json");

interface RawManifest {
  samples: CorpusSample[];
}

export async function loadCorpus(): Promise<CorpusSample[]> {
  const raw = await readFile(MANIFEST_PATH, "utf8");
  const parsed = JSON.parse(raw) as RawManifest;
  if (!parsed.samples || !Array.isArray(parsed.samples)) {
    throw new Error(`Corpus manifest at ${MANIFEST_PATH} is missing "samples" array`);
  }
  return parsed.samples;
}

export async function readSampleContent(sample: CorpusSample): Promise<string> {
  const path = resolve(CORPUS_DIR, sample.file);
  return readFile(path, "utf8");
}

export function fakeSourceUrl(sample: CorpusSample): string {
  // Stable, non-network URL so the analyzer prompt is shaped identically to
  // production but never points anywhere real.
  return `https://corpus.agentshield.local/${encodeURIComponent(sample.id)}`;
}
