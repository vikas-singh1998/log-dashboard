import { DEFAULT_RULES } from "./defaultRules";
import type { ParsedLog } from "@/types/log.types";
import type { AnalysisResult } from "@/types/analysis.types";
import type { RuleMatch } from "@/types/rules.types";

export function runRuleEngine(
  logs: ParsedLog[],
  analysis: AnalysisResult,
): RuleMatch[] {
  const matches: RuleMatch[] = [];

  for (const rule of DEFAULT_RULES) {
    let count = 0;
    let firstMatch: ParsedLog | undefined;

    for (const log of logs) {
      try {
        if (rule.condition(log, analysis, analysis.errorGroups)) {
          count++;
          if (!firstMatch) firstMatch = log;
        }
      } catch {
        // Never let a bad rule crash the engine
      }
    }

    if (count > 0) {
      const suggestion =
        typeof rule.suggestion === "function"
          ? rule.suggestion(firstMatch!, analysis)
          : rule.suggestion;

      matches.push({
        rule: {
          id: rule.id,
          name: rule.name,
          description: rule.description,
          severity: rule.severity,
          suggestion: rule.suggestion as string,
        },
        matchedLog: firstMatch,
        matchedGroup: analysis.errorGroups.find((g) =>
          firstMatch ? g.samples.some((s) => s.id === firstMatch!.id) : false,
        ),
        suggestion,
        count,
      });
    }
  }

  // Sort by severity
  const ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
  return matches.sort(
    (a, b) => ORDER[a.rule.severity] - ORDER[b.rule.severity],
  );
}
