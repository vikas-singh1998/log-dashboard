import type { ParsedLog, RawLogFile } from "./log.types";
import type { AnalysisResult } from "./analysis.types";
import type { RuleMatch } from "./rules.types";

// ─────────────────────────────────────────────
//  Worker Input / Output
// ─────────────────────────────────────────────
export interface WorkerInput {
  content: string;
  format: RawLogFile["format"];
  fileName: string;
}

export interface WorkerOutput {
  parsedLogs: ParsedLog[];
  analysis: AnalysisResult;
  ruleMatches: RuleMatch[];
  parseErrors: string[];
}

// ─────────────────────────────────────────────
//  Diff Types
// ─────────────────────────────────────────────
export interface DiffEntry {
  key: string;
  from: number;
  to: number;
  changePct: number; // percentage change (positive = increase)
}

export interface DiffSummary {
  totalLogsA: number;
  totalLogsB: number;
  errorsA: number;
  errorsB: number;
  errorRateA: number; // 0-100
  errorRateB: number;
  warningsA: number;
  warningsB: number;
}

export interface DiffResult {
  summary: DiffSummary;
  newErrors: string[]; // message keys only in B
  resolvedErrors: string[]; // message keys only in A
  increased: DiffEntry[]; // in both, count went up in B
  decreased: DiffEntry[]; // in both, count went down in B
  unchanged: string[];
}
