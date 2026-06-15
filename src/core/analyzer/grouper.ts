import type { ParsedLog } from "@/types/log.types";
import type { ErrorGroup } from "@/types/analysis.types";

// Strip dynamic segments: UUIDs, hex IDs, numbers, IPs
const DYNAMIC =
  /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\b[0-9a-f]{16,}\b|\b\d+\b|\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b)/gi;

export function normalizeMessage(msg: string): string {
  return msg.replace(DYNAMIC, "<*>").replace(/\s+/g, " ").trim().toLowerCase();
}

export function groupByMessage(logs: ParsedLog[]): ErrorGroup[] {
  const map = new Map<string, ErrorGroup>();

  for (const log of logs) {
    const key = normalizeMessage(log.message);
    const existing = map.get(key);
    if (existing) {
      existing.count++;
      if (log.timestamp < existing.firstSeen)
        existing.firstSeen = log.timestamp;
      if (log.timestamp > existing.lastSeen) existing.lastSeen = log.timestamp;
      if (!existing.services.includes(log.service))
        existing.services.push(log.service);
      if (existing.samples.length < 5) existing.samples.push(log);
    } else {
      map.set(key, {
        key,
        message: log.message,
        count: 1,
        firstSeen: log.timestamp,
        lastSeen: log.timestamp,
        services: [log.service],
        samples: [log],
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}
