import { normalizeMessage } from "./grouper";
import type { ParsedLog } from "@/types/log.types";

export function buildFrequencyMap(logs: ParsedLog[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const log of logs) {
    const key = normalizeMessage(log.message);
    map[key] = (map[key] ?? 0) + 1;
  }
  return map;
}
