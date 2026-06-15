import { groupByMessage } from "./grouper";
import { buildFrequencyMap } from "./frequency";
import { buildTrends, chooseBucket } from "./trends";
import type { ParsedLog } from "@/types/log.types";
import type { AnalysisResult } from "@/types/analysis.types";

export function analyze(logs: ParsedLog[]): AnalysisResult {
  if (logs.length === 0) {
    return {
      totalCount: 0,
      errorCount: 0,
      warnCount: 0,
      infoCount: 0,
      debugCount: 0,
      criticalCount: 0,
      topServices: [],
      errorGroups: [],
      frequencyMap: {},
      trends: [],
      timeRange: null,
      httpStatuses: [],
      httpMethods: [],
    };
  }

  // Level counts
  let errorCount = 0,
    warnCount = 0,
    infoCount = 0,
    debugCount = 0,
    criticalCount = 0;
  for (const log of logs) {
    switch (log.level) {
      case "ERROR":
        errorCount++;
        break;
      case "WARN":
        warnCount++;
        break;
      case "INFO":
        infoCount++;
        break;
      case "DEBUG":
        debugCount++;
        break;
      case "CRITICAL":
        criticalCount++;
        break;
    }
  }

  // Service frequency
  const svcMap: Record<string, number> = {};
  for (const log of logs) {
    svcMap[log.service] = (svcMap[log.service] ?? 0) + 1;
  }
  const topServices = Object.entries(svcMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([service, count]) => ({ service, count }));

  // Timestamp range
  const timestamps = logs.map((l) => l.timestamp);
  const timeRange = {
    start: Math.min(...timestamps),
    end: Math.max(...timestamps),
  };

  // HTTP status codes & methods across ALL logs
  const statusMap: Record<number, number> = {};
  const methodMap: Record<string, number> = {};
  for (const log of logs) {
    if (log.httpStatus !== undefined) {
      statusMap[log.httpStatus] = (statusMap[log.httpStatus] ?? 0) + 1;
    }
    if (log.httpMethod) {
      methodMap[log.httpMethod] = (methodMap[log.httpMethod] ?? 0) + 1;
    }
  }
  const httpStatuses = Object.entries(statusMap)
    .map(([s, count]) => ({ status: parseInt(s, 10), count }))
    .sort((a, b) => a.status - b.status);

  const httpMethods = Object.entries(methodMap)
    .map(([method, count]) => ({ method, count }))
    .sort((a, b) => b.count - a.count);

  // Error groups (only ERROR + CRITICAL for grouping performance)
  const errorLogs = logs.filter(
    (l) => l.level === "ERROR" || l.level === "CRITICAL",
  );
  const errorGroups = groupByMessage(errorLogs);

  const frequencyMap = buildFrequencyMap(errorLogs);
  const bucket = chooseBucket(logs);
  const trends = buildTrends(logs, bucket);

  return {
    totalCount: logs.length,
    errorCount,
    warnCount,
    infoCount,
    debugCount,
    criticalCount,
    topServices,
    errorGroups,
    frequencyMap,
    trends,
    timeRange,
    httpStatuses,
    httpMethods,
  };
}
