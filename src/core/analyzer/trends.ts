import type { ParsedLog } from "@/types/log.types";
import type { TrendPoint } from "@/types/analysis.types";

export type TimeBucket = "minute" | "hour" | "day";

function bucketTimestamp(ts: number, bucket: TimeBucket): number {
  const d = new Date(ts);
  switch (bucket) {
    case "minute":
      d.setSeconds(0, 0);
      return d.getTime();
    case "hour":
      d.setMinutes(0, 0, 0);
      return d.getTime();
    case "day":
      d.setHours(0, 0, 0, 0);
      return d.getTime();
  }
}

export function buildTrends(
  logs: ParsedLog[],
  bucket: TimeBucket = "hour",
): TrendPoint[] {
  const map = new Map<number, TrendPoint>();

  for (const log of logs) {
    const ts = bucketTimestamp(log.timestamp, bucket);
    const existing = map.get(ts);
    if (existing) {
      existing.total++;
      existing[
        log.level.toLowerCase() as keyof Omit<
          TrendPoint,
          "bucket" | "timestamp"
        >
      ]++;
    } else {
      map.set(ts, {
        bucket: new Date(ts).toISOString(),
        timestamp: ts,
        total: 1,
        debug: log.level === "DEBUG" ? 1 : 0,
        info: log.level === "INFO" ? 1 : 0,
        warn: log.level === "WARN" ? 1 : 0,
        error: log.level === "ERROR" ? 1 : 0,
        critical: log.level === "CRITICAL" ? 1 : 0,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
}

export function chooseBucket(logs: ParsedLog[]): TimeBucket {
  if (logs.length === 0) return "hour";
  const times = logs.map((l) => l.timestamp);
  const range = Math.max(...times) - Math.min(...times);
  const ONE_HOUR = 3600_000;
  const ONE_DAY = 86400_000;
  if (range <= ONE_HOUR * 2) return "minute";
  if (range <= ONE_DAY * 3) return "hour";
  return "day";
}
