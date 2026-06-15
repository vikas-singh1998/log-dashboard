import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { AnalysisResult } from "@/types/analysis.types";
import { truncate } from "@/utils/format";

interface Props {
  analysis: AnalysisResult;
}

export function ErrorFrequencyChart({ analysis }: Props) {
  const data = analysis.errorGroups.slice(0, 10).map((g) => ({
    name: truncate(g.message, 40),
    count: g.count,
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
        No error data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
        <XAxis
          type="number"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={180}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 6,
            color: "hsl(var(--popover-foreground))",
            fontSize: 12,
          }}
        />
        <Bar dataKey="count" radius={[0, 3, 3, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={`hsl(${0 + i * 8}, 70%, 55%)`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
