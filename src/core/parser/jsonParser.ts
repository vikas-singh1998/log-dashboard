import { nanoid } from "@/utils/nanoid";
import type { ParsedLog, LogLevel } from "@/types/log.types";

const LEVEL_MAP: Record<string, LogLevel> = {
  debug: "DEBUG",
  trace: "DEBUG",
  verbose: "DEBUG",
  info: "INFO",
  information: "INFO",
  warn: "WARN",
  warning: "WARN",
  error: "ERROR",
  err: "ERROR",
  fatal: "CRITICAL",
  critical: "CRITICAL",
  crit: "CRITICAL",
  severe: "CRITICAL",
};

export function normalizeLevel(raw: unknown): LogLevel {
  if (typeof raw === "number") {
    if (raw >= 50) return "CRITICAL";
    if (raw >= 40) return "ERROR";
    if (raw >= 30) return "WARN";
    if (raw >= 20) return "INFO";
    return "DEBUG";
  }
  if (typeof raw === "string") {
    return LEVEL_MAP[raw.toLowerCase()] ?? "INFO";
  }
  return "INFO";
}

export function normalizeTimestamp(raw: unknown): number {
  if (typeof raw === "number") {
    // Handle unix seconds vs ms
    return raw < 1e12 ? raw * 1000 : raw;
  }
  if (typeof raw === "string") {
    let s = raw.trim();

    // Apache/Nginx combined log date: 07/Apr/2026:13:24:53 +0530
    // Convert to: 07 Apr 2026 13:24:53 +0530 which Date.parse handles
    const apacheDate =
      /^(\d{1,2})\/([A-Za-z]{3})\/(\d{4}):(\d{2}:\d{2}:\d{2})\s*([+-]\d{2}:?\d{2})?$/.exec(
        s,
      );
    if (apacheDate) {
      const [, day, mon, year, time, tz = ""] = apacheDate;
      s = `${day} ${mon} ${year} ${time} ${tz}`.trim();
    }

    // Replace comma-separated milliseconds (Python logging): 13:24:53,077 → 13:24:53.077
    s = s.replace(/,(\d{1,3})(\s|$|Z|[+-])/, ".$1$2");

    const parsed = Date.parse(s);
    return isNaN(parsed) ? Date.now() : parsed;
  }
  return Date.now();
}

export function parseJsonLogs(content: string): {
  logs: ParsedLog[];
  errors: string[];
} {
  const logs: ParsedLog[] = [];
  const errors: string[] = [];
  const trimmed = content.trim();

  let entries: unknown[];

  // Try array first
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (!Array.isArray(parsed)) {
        errors.push("JSON file is not an array at root level");
        return { logs, errors };
      }
      entries = parsed;
    } catch (e) {
      errors.push(`JSON parse error: ${String(e)}`);
      return { logs, errors };
    }
  } else {
    // NDJSON — one JSON object per line
    entries = [];
    const lines = trimmed.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      try {
        entries.push(JSON.parse(line));
      } catch {
        errors.push(`Line ${i + 1}: invalid JSON`);
      }
    }
  }

  for (const entry of entries) {
    if (typeof entry !== "object" || entry === null) continue;
    const e = entry as Record<string, unknown>;

    const message = String(
      e.message ?? e.msg ?? e.Message ?? e.text ?? e.error ?? e.err ?? "",
    );
    const level = normalizeLevel(
      e.level ?? e.severity ?? e.Level ?? e.Severity ?? e.lvl,
    );
    const timestamp = normalizeTimestamp(
      e.timestamp ?? e.time ?? e["@timestamp"] ?? e.ts ?? e.date ?? e.Date,
    );
    const service = String(
      e.service ?? e.app ?? e.name ?? e.logger ?? e.module ?? "unknown",
    );
    const stackTrace =
      typeof e.stack === "string"
        ? e.stack
        : typeof e.stackTrace === "string"
          ? e.stackTrace
          : undefined;

    const knownKeys = new Set([
      "message",
      "msg",
      "Message",
      "text",
      "error",
      "err",
      "level",
      "severity",
      "Level",
      "Severity",
      "lvl",
      "timestamp",
      "time",
      "@timestamp",
      "ts",
      "date",
      "Date",
      "service",
      "app",
      "name",
      "logger",
      "module",
      "stack",
      "stackTrace",
      "status",
      "status_code",
      "statusCode",
      "http_status",
      "method",
      "http_method",
      "httpMethod",
      "verb",
      "path",
      "url",
      "uri",
      "endpoint",
      "request_path",
    ]);
    const meta: Record<string, unknown> = {};
    for (const key of Object.keys(e)) {
      if (!knownKeys.has(key)) meta[key] = e[key];
    }

    // Extract HTTP fields from structured JSON
    const rawStatus =
      e.status ?? e.status_code ?? e.statusCode ?? e.http_status;
    const httpStatus =
      typeof rawStatus === "number"
        ? rawStatus
        : typeof rawStatus === "string" && /^\d{3}$/.test(rawStatus)
          ? parseInt(rawStatus, 10)
          : undefined;

    const rawMethod = e.method ?? e.http_method ?? e.httpMethod ?? e.verb;
    const httpMethod =
      typeof rawMethod === "string" ? rawMethod.toUpperCase() : undefined;

    const rawPath = e.path ?? e.url ?? e.uri ?? e.endpoint ?? e.request_path;
    const httpPath = typeof rawPath === "string" ? rawPath : undefined;

    logs.push({
      id: nanoid(),
      timestamp,
      level,
      message,
      service,
      raw: typeof entry === "string" ? entry : JSON.stringify(entry),
      stackTrace,
      httpStatus,
      httpMethod,
      httpPath,
      meta: Object.keys(meta).length > 0 ? meta : undefined,
    });
  }

  return { logs, errors };
}
