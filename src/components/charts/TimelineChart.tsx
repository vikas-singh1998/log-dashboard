import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { AnalysisResult } from "@/types/analysis.types";

interface Props {
  analysis: AnalysisResult;
}

const COLORS = {
  error: "#ef4444",
  critical: "#d946ef",
  warn: "#f59e0b",
  info: "#22d3ee",
  debug: "#64748b",
};

export function TimelineChart({ analysis }: Props) {
  if (analysis.trends.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
        Not enough data for timeline
      </div>
    );
  }

  const data = analysis.trends.map((t) => ({
    ...t,
    label: new Date(t.timestamp).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ left: 0, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="label"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
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
        {(Object.keys(COLORS) as (keyof typeof COLORS)[]).map((key) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={COLORS[key]}
            dot={false}
            strokeWidth={1.5}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
