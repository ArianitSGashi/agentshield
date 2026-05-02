import {
  ALLOWED_DOMAINS,
  SKIPPED_PATH_PATTERNS,
  ANALYZABLE_CONTENT_TYPES,
  STREAMING_CONTENT_TYPES,
  MAX_CONTENT_LENGTH,
  MIN_CONTENT_LENGTH,
} from "./config.js";

function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function getPathname(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return "";
  }
}

function hasAnalyzableContentType(contentType: string | undefined): boolean {
  if (!contentType) return false;
  return ANALYZABLE_CONTENT_TYPES.some((type) => contentType.startsWith(type));
}

function isStreamingContentType(contentType: string | undefined): boolean {
  if (!contentType) return false;
  return STREAMING_CONTENT_TYPES.some((type) => contentType.startsWith(type));
}

export function shouldAnalyze(
  url: string,
  statusCode: number,
  contentType: string | undefined,
  contentLength: number | undefined,
): boolean {
  const hostname = getHostname(url);

  if (ALLOWED_DOMAINS.has(hostname)) return false;

  const pathname = getPathname(url);
  if (SKIPPED_PATH_PATTERNS.some((pattern) => pattern.test(pathname))) return false;

  if (statusCode < 200 || statusCode >= 300) return false;

  // SSE / gRPC / chunked binary streams: the agent reads them progressively;
  // intercepting the buffered body would either stall the stream or arrive
  // after the agent already acted on the data. Bypass the analyzer entirely.
  if (isStreamingContentType(contentType)) return false;

  if (!hasAnalyzableContentType(contentType)) return false;

  if (contentLength !== undefined && contentLength > MAX_CONTENT_LENGTH) return false;

  if (contentLength !== undefined && contentLength < MIN_CONTENT_LENGTH) return false;

  return true;
}
