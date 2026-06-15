import type { AnalysisResult } from "@/types/analysis.types";
import type { DiffResult, DiffEntry } from "@/types/worker.types";

export function compareLogs(
  analysisA: AnalysisResult,
  analysisB: AnalysisResult,
): DiffResult {
  const mapA = analysisA.frequencyMap;
  const mapB = analysisB.frequencyMap;

  const keysA = new Set(Object.keys(mapA));
  const keysB = new Set(Object.keys(mapB));

  const newErrors: string[] = [];
  const resolvedErrors: string[] = [];
  const increased: DiffEntry[] = [];
  const decreased: DiffEntry[] = [];
  const unchanged: string[] = [];

  for (const key of keysB) {
    if (!keysA.has(key)) {
      newErrors.push(key);
    } else {
      const from = mapA[key] ?? 0;
      const to = mapB[key] ?? 0;
      const changePct =
        from === 0 ? 100 : Math.round(((to - from) / from) * 100);
      if (to > from) increased.push({ key, from, to, changePct });
      else if (to < from) decreased.push({ key, from, to, changePct });
      else unchanged.push(key);
    }
  }

  for (const key of keysA) {
    if (!keysB.has(key)) resolvedErrors.push(key);
  }

  // Sort by magnitude of change
  increased.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
  decreased.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));

  const totalA = analysisA.totalCount || 1;
  const totalB = analysisB.totalCount || 1;
  const errorsA = analysisA.errorCount + analysisA.criticalCount;
  const errorsB = analysisB.errorCount + analysisB.criticalCount;

  return {
    summary: {
      totalLogsA: analysisA.totalCount,
      totalLogsB: analysisB.totalCount,
      errorsA,
      errorsB,
      errorRateA: Math.round((errorsA / totalA) * 100),
      errorRateB: Math.round((errorsB / totalB) * 100),
      warningsA: analysisA.warnCount,
      warningsB: analysisB.warnCount,
    },
    newErrors,
    resolvedErrors,
    increased,
    decreased,
    unchanged,
  };
}
