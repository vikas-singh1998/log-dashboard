import type { ParsedLog } from "./log.types";
import type { AnalysisResult, ErrorGroup } from "./analysis.types";

// ─────────────────────────────────────────────
//  Rule Definition
// ─────────────────────────────────────────────
export interface Rule {
  id: string;
  name: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  condition: (
    log: ParsedLog,
    analysis: AnalysisResult,
    groups: ErrorGroup[],
  ) => boolean;
  suggestion: string | ((log: ParsedLog, analysis: AnalysisResult) => string);
}

// ─────────────────────────────────────────────
//  Rule Match (result of running rules)
// ─────────────────────────────────────────────
export interface RuleMatch {
  rule: Omit<Rule, "condition">;
  matchedLog?: ParsedLog;
  matchedGroup?: ErrorGroup;
  suggestion: string;
  count: number; // how many logs triggered this rule
}
