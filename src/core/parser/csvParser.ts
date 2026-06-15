import Papa from "papaparse";
import { nanoid } from "@/utils/nanoid";
import { normalizeLevel, normalizeTimestamp } from "./jsonParser";
import type { ParsedLog } from "@/types/log.types";

const TIMESTAMP_CANDIDATES = [
  "timestamp",
  "time",
  "date",
  "datetime",
  "@timestamp",
  "ts",
];
const LEVEL_CANDIDATES = ["level", "severity", "lvl", "log_level", "loglevel"];
const MESSAGE_CANDIDATES = [
  "message",
  "msg",
  "text",
  "error",
  "description",
  "log",
];
const SERVICE_CANDIDATES = [
  "service",
  "app",
  "application",
  "name",
  "logger",
  "module",
  "source",
];

function findCol(headers: string[], candidates: string[]): string | null {
  const lower = headers.map((h) => h.toLowerCase());
  for (const c of candidates) {
    const idx = lower.indexOf(c);
    if (idx !== -1) return headers[idx];
  }
  return null;
}

export function parseCsvLogs(content: string): {
  logs: ParsedLog[];
  errors: string[];
} {
  const errors: string[] = [];
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (result.errors.length > 0) {
    result.errors.forEach((e) =>
      errors.push(`CSV error row ${e.row}: ${e.message}`),
    );
  }

  const headers = result.meta.fields ?? [];
  const tsCol = findCol(headers, TIMESTAMP_CANDIDATES);
  const lvlCol = findCol(headers, LEVEL_CANDIDATES);
  const msgCol = findCol(headers, MESSAGE_CANDIDATES);
  const svcCol = findCol(headers, SERVICE_CANDIDATES);

  const logs: ParsedLog[] = result.data.map((row) => {
    const message = msgCol ? (row[msgCol] ?? "") : Object.values(row).join(" ");
    const level = normalizeLevel(lvlCol ? row[lvlCol] : "info");
    const timestamp = normalizeTimestamp(tsCol ? row[tsCol] : undefined);
    const service = svcCol ? (row[svcCol] ?? "unknown") : "unknown";

    const meta: Record<string, unknown> = {};
    for (const key of headers) {
      if (key !== tsCol && key !== lvlCol && key !== msgCol && key !== svcCol) {
        meta[key] = row[key];
      }
    }

    return {
      id: nanoid(),
      timestamp,
      level,
      message,
      service,
      raw: Object.values(row).join(","),
      meta: Object.keys(meta).length > 0 ? meta : undefined,
    };
  });

  return { logs, errors };
}
