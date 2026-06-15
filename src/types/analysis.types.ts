import type { ParsedLog } from "./log.types";

// ─────────────────────────────────────────────
//  Grouped Error
// ─────────────────────────────────────────────
export interface ErrorGroup {
  key: string; // normalized message key used for grouping
  message: string; // representative message
  count: number;
  firstSeen: number; // unix ms
  lastSeen: number; // unix ms
  services: string[];
  samples: ParsedLog[];
}

// ─────────────────────────────────────────────
//  Time Trend Data Point
// ─────────────────────────────────────────────
export interface TrendPoint {
  bucket: string; // ISO string for the bucket start
  timestamp: number; // unix ms bucket start
  total: number;
  debug: number;
  info: number;
  warn: number;
  error: number;
  critical: number;
}

// ─────────────────────────────────────────────
//  Full Analysis Result
// ─────────────────────────────────────────────
export interface AnalysisResult {
  totalCount: number;
  errorCount: number;
  warnCount: number;
  infoCount: number;
  debugCount: number;
  criticalCount: number;
  topServices: { service: string; count: number }[];
  errorGroups: ErrorGroup[];
  frequencyMap: Record<string, number>; // normalized message → count
  trends: TrendPoint[];
  timeRange: { start: number; end: number } | null;
  // HTTP quick-filter metadata
  httpStatuses: { status: number; count: number }[]; // sorted by status code
  httpMethods: { method: string; count: number }[]; // sorted by frequency
}
