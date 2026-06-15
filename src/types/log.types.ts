// ─────────────────────────────────────────────
//  Log Level Enum
// ─────────────────────────────────────────────
export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "CRITICAL";

export const LOG_LEVELS: LogLevel[] = [
  "DEBUG",
  "INFO",
  "WARN",
  "ERROR",
  "CRITICAL",
];

export const LOG_LEVEL_WEIGHT: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4,
};

// ─────────────────────────────────────────────
//  Parsed Log Entry
// ─────────────────────────────────────────────
export interface ParsedLog {
  id: string;
  timestamp: number; // unix ms
  level: LogLevel;
  message: string;
  service: string;
  raw: string;
  stackTrace?: string;
  // HTTP-specific fields extracted from access logs
  httpStatus?: number; // e.g. 200, 404, 500
  httpMethod?: string; // e.g. GET, POST, PUT, DELETE
  httpPath?: string; // e.g. /api/v1/customers
  meta?: Record<string, unknown>;
}

// ─────────────────────────────────────────────
//  Raw File Input
// ─────────────────────────────────────────────
export type LogFormat = "json" | "csv" | "text";

export interface RawLogFile {
  name: string;
  content: string;
  format: LogFormat;
  size: number;
}
