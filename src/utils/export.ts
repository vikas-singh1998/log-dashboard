import type { AnalysisResult } from "@/types/analysis.types";
import type { RuleMatch } from "@/types/rules.types";

/**
 * Export analysis result as a formatted JSON file download.
 */
export function exportJSON(
  analysis: AnalysisResult,
  ruleMatches: RuleMatch[],
  fileName = "log-analysis",
): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    summary: {
      totalLogs: analysis.totalCount,
      errors: analysis.errorCount,
      warnings: analysis.warnCount,
      timeRange: analysis.timeRange,
    },
    topErrors: analysis.errorGroups.slice(0, 20).map((g) => ({
      message: g.message,
      count: g.count,
      services: g.services,
      firstSeen: new Date(g.firstSeen).toISOString(),
      lastSeen: new Date(g.lastSeen).toISOString(),
    })),
    insights: ruleMatches.map((m) => ({
      rule: m.rule.name,
      severity: m.rule.severity,
      count: m.count,
      suggestion: m.suggestion,
    })),
    trends: analysis.trends,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Export as CSV: top errors table.
 */
export function exportCSV(
  analysis: AnalysisResult,
  fileName = "top-errors",
): void {
  const rows = [
    ["Message", "Count", "Services", "First Seen", "Last Seen"],
    ...analysis.errorGroups
      .slice(0, 100)
      .map((g) => [
        `"${g.message.replace(/"/g, '""')}"`,
        String(g.count),
        `"${g.services.join(", ")}"`,
        new Date(g.firstSeen).toISOString(),
        new Date(g.lastSeen).toISOString(),
      ]),
  ];

  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
