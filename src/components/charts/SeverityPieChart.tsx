import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { AnalysisResult } from "@/types/analysis.types";

interface Props {
  analysis: AnalysisResult;
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "#d946ef",
  ERROR: "#ef4444",
  WARN: "#f59e0b",
  INFO: "#22d3ee",
  DEBUG: "#64748b",
};

export function SeverityPieChart({ analysis }: Props) {
  const data = [
    { name: "CRITICAL", value: analysis.criticalCount },
    { name: "ERROR", value: analysis.errorCount },
    { name: "WARN", value: analysis.warnCount },
    { name: "INFO", value: analysis.infoCount },
    { name: "DEBUG", value: analysis.debugCount },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
        No data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={SEVERITY_COLORS[entry.name] ?? "#888"}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 6,
            color: "hsl(var(--popover-foreground))",
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
