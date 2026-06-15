import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import {
  AlertCircle,
  TrendingUp,
  Database,
  Clock,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ErrorFrequencyChart } from "@/components/charts/ErrorFrequencyChart";
import { TimelineChart } from "@/components/charts/TimelineChart";
import { SeverityPieChart } from "@/components/charts/SeverityPieChart";
import { useLogStore } from "@/store/useLogStore";
import { formatTimestamp, formatCount } from "@/utils/format";

const SEVERITY_COLOR: Record<string, string> = {
  critical: "text-fuchsia-400",
  high: "text-red-400",
  medium: "text-amber-400",
  low: "text-cyan-400",
};

export function DashboardPage() {
  const { analysis, ruleMatches } = useLogStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!analysis || analysis.totalCount === 0) navigate("/upload");
  }, [analysis, navigate]);

  if (!analysis) return null;

  const stats = [
    {
      label: "Total Logs",
      value: formatCount(analysis.totalCount),
      icon: Database,
      color: "text-cyan-400",
    },
    {
      label: "Errors",
      value: formatCount(analysis.errorCount + analysis.criticalCount),
      icon: AlertCircle,
      color: "text-red-400",
    },
    {
      label: "Warnings",
      value: formatCount(analysis.warnCount),
      icon: TrendingUp,
      color: "text-amber-400",
    },
    {
      label: "Time Range",
      value: analysis.timeRange
        ? formatTimestamp(analysis.timeRange.start) +
          " → " +
          formatTimestamp(analysis.timeRange.end)
        : "—",
      icon: Clock,
      color: "text-[hsl(var(--muted-foreground))]",
      small: true,
    },
  ];

  return (
    <div className="space-y-6" id="dashboard-content">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, small }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {label}
                </p>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <p
                className={`mt-1 font-bold ${small ? "text-sm" : "text-2xl"} text-[hsl(var(--foreground))]`}
              >
                {value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rule Insights */}
      {ruleMatches.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              Insights ({ruleMatches.length} rule
              {ruleMatches.length !== 1 ? "s" : ""} triggered)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ruleMatches.slice(0, 6).map((m) => (
              <div
                key={m.rule.id}
                className="flex items-start gap-3 rounded-md border border-[hsl(var(--border))] p-3"
              >
                <Badge
                  variant={
                    m.rule.severity === "critical"
                      ? "critical"
                      : m.rule.severity === "high"
                        ? "error"
                        : "warn"
                  }
                  className="shrink-0 text-xs"
                >
                  {m.rule.severity}
                </Badge>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                      {m.rule.name}
                    </p>
                    <span
                      className={`text-xs font-semibold ${SEVERITY_COLOR[m.rule.severity]}`}
                    >
                      ×{formatCount(m.count)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                    {m.suggestion}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Charts grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top Errors by Frequency</CardTitle>
          </CardHeader>
          <CardContent>
            <ErrorFrequencyChart analysis={analysis} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Log Level Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <SeverityPieChart analysis={analysis} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            Timeline — Errors &amp; Warnings Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimelineChart analysis={analysis} />
        </CardContent>
      </Card>

      {/* Top services */}
      {analysis.topServices.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Top Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.topServices.slice(0, 5).map(({ service, count }) => {
                const pct = Math.round((count / analysis.totalCount) * 100);
                return (
                  <div key={service} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-xs text-[hsl(var(--foreground))]">
                      {service}
                    </span>
                    <div className="flex-1 rounded-full bg-[hsl(var(--muted))] h-2">
                      <div
                        className="h-2 rounded-full bg-[hsl(var(--primary))]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-xs text-[hsl(var(--muted-foreground))]">
                      {formatCount(count)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
