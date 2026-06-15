import { parseJsonLogs } from "./jsonParser";
import { parseCsvLogs } from "./csvParser";
import { parseTextLogs } from "./textParser";
import type { ParsedLog, LogFormat } from "@/types/log.types";

export interface ParseResult {
  logs: ParsedLog[];
  errors: string[];
}

/** Try JSON.parse on the first non-empty line. Returns true only for valid JSON. */
function isValidJsonContent(sample: string): boolean {
  const firstLine = sample.trimStart().split("\n")[0].trim();
  if (!firstLine.startsWith("{") && !firstLine.startsWith("[")) return false;
  try {
    JSON.parse(firstLine);
    return true;
  } catch {
    // Malformed JSON (e.g. unquoted message values) — treat as text
    return false;
  }
}

export function detectFormat(
  fileName: string,
  contentSample: string,
): LogFormat {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "json") {
    // Even .json files: validate the first line is parseable
    return isValidJsonContent(contentSample) ? "json" : "text";
  }
  if (ext === "csv") return "csv";
  if (ext === "ndjson") return "json";
  if (ext === "log" || ext === "txt") {
    // Only classify as JSON if the first line is actually valid JSON
    if (isValidJsonContent(contentSample)) return "json";
    return "text";
  }
  // Fallback heuristic
  if (isValidJsonContent(contentSample)) return "json";
  if (
    contentSample.includes(",") &&
    contentSample.split("\n")[0].split(",").length > 2
  )
    return "csv";
  return "text";
}

export function parseFile(content: string, format: LogFormat): ParseResult {
  switch (format) {
    case "json":
      return parseJsonLogs(content);
    case "csv":
      return parseCsvLogs(content);
    case "text":
    default:
      return parseTextLogs(content);
  }
}
