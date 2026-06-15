/**
 * Format a unix-ms timestamp as a readable date/time string.
 */
export function formatTimestamp(ts: number): string {
  if (!ts || isNaN(ts)) return "—";
  return new Date(ts).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Format relative time (e.g., "2h ago").
 */
export function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
}

/**
 * Format a file size in bytes to a human-friendly string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Abbreviate large numbers: 1234 → "1.2K", 1200000 → "1.2M"
 */
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/**
 * Truncate a string to maxLen characters, appending "…".
 */
export function truncate(str: string, maxLen = 120): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "…";
}
