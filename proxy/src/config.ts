// Domains that only serve infrastructure/package data — no user-generated content.
// GitHub, GitLab, Bitbucket are NOT here — they host user content (issues, PRs, READMEs)
// which are prime prompt injection vectors.
export const ALLOWED_DOMAINS = new Set([
  // Package registries
  "registry.npmjs.org",
  "registry.yarnpkg.com",
  "pypi.org",
  "files.pythonhosted.org",
  "crates.io",
  "proxy.golang.org",
  "pkg.go.dev",
  "repo.maven.apache.org",
  "plugins.gradle.org",
  "nuget.org",
  "api.nuget.org",
  "rubygems.org",
  "packagist.org",

  // CDNs
  "cdn.jsdelivr.net",
  "unpkg.com",
  "cdnjs.cloudflare.com",

  // Avoid analyzing our own LLM calls
  "api.anthropic.com",

  // Local services
  "localhost",
  "127.0.0.1",
]);

// Git protocol paths — binary data, no injection risk
export const SKIPPED_PATH_PATTERNS = [
  /\/info\/refs/,
  /\/git-upload-pack/,
  /\/git-receive-pack/,
  /\.git\/objects\//,
];

// Only analyze text-based responses
export const  ANALYZABLE_CONTENT_TYPES = [
  "text/html",
  "text/plain",
  "text/markdown",
  "text/xml",
  "application/json",
  "application/xml",
  "application/xhtml+xml",
  "application/rss+xml",
  "application/atom+xml",
];

// Don't send huge payloads to the LLM
export const MAX_CONTENT_LENGTH = 524_288; // 512 KB

// Too short to contain meaningful prompt injection
export const MIN_CONTENT_LENGTH = 50;

// Truncate before sending to LLM
export const MAX_LLM_INPUT_CHARS = 100_000;

// LLM analysis timeout
export const LLM_TIMEOUT_MS = 15_000;

// Dedup cache settings
export const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
export const CACHE_MAX_ENTRIES = 1000;

// Backend reporting timeout
export const REPORT_TIMEOUT_MS = 5_000;
