import { nanoid } from "@/utils/nanoid";
import { normalizeLevel, normalizeTimestamp } from "./jsonParser";
import type { ParsedLog, LogLevel } from "@/types/log.types";

// Log4j / Log4net style: 2024-01-15 14:23:45.123 ERROR [service] message
// Also handles bracketed levels: 2026-03-19 19:45:29 [INFO] [order-service] key=val - message
const LOG4J =
  /^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\s+\[?(DEBUG|INFO|WARN(?:ING)?|ERROR|FATAL|CRITICAL|TRACE|VERBOSE)\]?\s+(?:\[([^\]]+)\]\s*)?(.*)/i;

// Nginx/Apache combined log: 127.0.0.1 - - [07/Apr/2026:13:24:53 +0530] "GET /path HTTP/1.1" 404 179 "-" "agent"
// Also matches without referrer/agent columns
const NGINX = /^(\S+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+"([^"]+)"\s+(\d{3})\s+(\d+)/;

// Syslog: Jan 15 14:23:45 hostname app[pid]: message
const SYSLOG =
  /^(\w{3}\s+\d+\s+\d{2}:\d{2}:\d{2})\s+\S+\s+(\S+?)(?:\[\d+\])?:\s+(.*)/;

// Django/Python JSON-ish log with unquoted message value:
// {"time":"2026-04-07 13:24:53,077","level": "WARNING", "message": Not Found: /}
// The message value is NOT quoted — this is intentionally not valid JSON.
const DJANGO_JSON =
  /^\{"time":"([^"]+)","level":\s*"([^"]+)",\s*"message":\s*(.*?)(?:\}\s*)?$/i;

// Generic: [LEVEL] message  or  LEVEL: message
const GENERIC_LEVEL =
  /^(?:\[?(DEBUG|INFO|WARN(?:ING)?|ERROR|FATAL|CRITICAL|TRACE)\]?[:]\s*)(.*)/i;

/**
 * Extract key=value pairs from a message string into meta.
 * Splits on " - " separator: everything before is KV metadata,
 * everything after is the human-readable message.
 * e.g. "userId=8267 traceId=abc123 - Cache hit"
 *   → { meta: { userId: "8267", traceId: "abc123" }, message: "Cache hit" }
 */
function extractKVAndMessage(rest: string): {
  meta: Record<string, string>;
  message: string;
} {
  const meta: Record<string, string> = {};
  const dashIdx = rest.indexOf(" - ");
  const kvPart = dashIdx !== -1 ? rest.slice(0, dashIdx) : rest;
  const msgPart = dashIdx !== -1 ? rest.slice(dashIdx + 3).trim() : "";

  const kvRegex = /\b([a-zA-Z_]\w*)=([^\s]+)/g;
  let m: RegExpExecArray | null;
  while ((m = kvRegex.exec(kvPart)) !== null) {
    meta[m[1]] = m[2];
  }

  const remaining = kvPart.replace(/\b[a-zA-Z_]\w*=[^\s]+\s*/g, "").trim();
  const message = msgPart
    ? remaining
      ? `${remaining} ${msgPart}`
      : msgPart
    : remaining || rest;

  return { meta, message };
}

function statusToLevel(status: number): LogLevel {
  if (status >= 500) return "ERROR";
  if (status >= 400) return "WARN";
  return "INFO";
}

/** Parse HTTP method and path from a request string */
function parseRequest(req: string): { method: string; path: string } | null {
  const m = /^([A-Z]+)\s+([^\s]+)/.exec(req);
  if (!m) return null;
  return { method: m[1], path: m[2] };
}

/**
 * Try to extract HTTP status and method from a message string.
 * Handles messages like "GET /path → 404" or "Not Found: /path" etc.
 */
function extractHttpFromMessage(msg: string): {
  httpStatus?: number;
  httpMethod?: string;
  httpPath?: string;
} {
  // Pattern: "METHOD /path → STATUS" (our own generated format)
  const arrow = /^([A-Z]+)\s+([^\s]+)\s*→\s*(\d{3})/.exec(msg);
  if (arrow) {
    return {
      httpMethod: arrow[1],
      httpPath: arrow[2],
      httpStatus: parseInt(arrow[3], 10),
    };
  }
  // Pattern: "METHOD /path" anywhere in message
  const methodPath =
    /\b(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+([^\s"']+)/.exec(msg);
  const statusInMsg = /\b([1-5]\d{2})\b/.exec(msg);
  return {
    httpMethod: methodPath?.[1],
    httpPath: methodPath?.[2],
    httpStatus: statusInMsg ? parseInt(statusInMsg[1], 10) : undefined,
  };
}

export function parseTextLogs(content: string): {
  logs: ParsedLog[];
  errors: string[];
} {
  const lines = content.split("\n");
  const logs: ParsedLog[] = [];
  const errors: string[] = [];
  let prevLog: ParsedLog | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Try to attach stack trace continuation lines to the previous log
    if (
      prevLog &&
      (trimmed.startsWith("at ") ||
        trimmed.startsWith("Caused by:") ||
        trimmed.startsWith("\t"))
    ) {
      prevLog.stackTrace = (prevLog.stackTrace ?? "") + "\n" + trimmed;
      continue;
    }

    let matched = false;

    // ── Django/Python JSON-ish format (MUST check before Log4J — line starts with `{`)
    // {"time":"2026-04-07 13:24:53,077","level": "WARNING", "message": Not Found: /}
    if (!matched && trimmed.startsWith("{")) {
      const md = DJANGO_JSON.exec(trimmed);
      if (md) {
        const [, ts, lvl, rawMsg] = md;
        // Strip trailing `}` that may have been captured as part of message
        const msg = rawMsg.replace(/\}\s*$/, "").trim();
        const httpInfo = extractHttpFromMessage(msg);
        const entry: ParsedLog = {
          id: nanoid(),
          timestamp: normalizeTimestamp(ts),
          level: normalizeLevel(lvl),
          message: msg,
          service: "app",
          raw: trimmed,
          ...httpInfo,
        };
        logs.push(entry);
        prevLog = entry;
        matched = true;
      }
    }

    // ── Log4J (also handles [LEVEL] [service] key=val - message format)
    if (!matched) {
      const m4 = LOG4J.exec(trimmed);
      if (m4) {
        const [, ts, lvl, svc, rawMsg] = m4;
        const { meta, message } = extractKVAndMessage(rawMsg ?? "");
        const entry: ParsedLog = {
          id: nanoid(),
          timestamp: normalizeTimestamp(ts),
          level: normalizeLevel(lvl),
          message,
          service: svc ?? "unknown",
          raw: trimmed,
          meta: Object.keys(meta).length > 0 ? meta : undefined,
        };
        logs.push(entry);
        prevLog = entry;
        matched = true;
      }
    }

    if (!matched) {
      const mn = NGINX.exec(trimmed);
      if (mn) {
        const [, ip, ts, request, statusStr] = mn;
        const status = parseInt(statusStr, 10);
        const reqParsed = parseRequest(request);
        const msg = `${reqParsed ? `${reqParsed.method} ${reqParsed.path}` : request} → ${status}`;
        const entry: ParsedLog = {
          id: nanoid(),
          timestamp: normalizeTimestamp(ts),
          level: statusToLevel(status),
          message: msg,
          service: "nginx",
          raw: trimmed,
          httpStatus: status,
          httpMethod: reqParsed?.method,
          httpPath: reqParsed?.path,
          meta: { status, ip, request },
        };
        logs.push(entry);
        prevLog = entry;
        matched = true;
      }
    }

    if (!matched) {
      const ms = SYSLOG.exec(trimmed);
      if (ms) {
        const [, ts, app, msg] = ms;
        const entry: ParsedLog = {
          id: nanoid(),
          timestamp: normalizeTimestamp(ts),
          level: "INFO",
          message: msg ?? "",
          service: app ?? "unknown",
          raw: trimmed,
        };
        logs.push(entry);
        prevLog = entry;
        matched = true;
      }
    }

    if (!matched) {
      const mg = GENERIC_LEVEL.exec(trimmed);
      if (mg) {
        const [, lvl, msg] = mg;
        const entry: ParsedLog = {
          id: nanoid(),
          timestamp: Date.now(),
          level: normalizeLevel(lvl),
          message: msg ?? trimmed,
          service: "unknown",
          raw: trimmed,
        };
        logs.push(entry);
        prevLog = entry;
        matched = true;
      }
    }

    if (!matched) {
      // Fallback: treat entire line as INFO message
      const entry: ParsedLog = {
        id: nanoid(),
        timestamp: Date.now(),
        level: "INFO",
        message: trimmed,
        service: "unknown",
        raw: trimmed,
      };
      logs.push(entry);
      prevLog = entry;
    }
  }

  return { logs, errors };
}
