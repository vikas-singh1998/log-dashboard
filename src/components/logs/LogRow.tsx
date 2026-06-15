import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { sanitize } from "@/utils/sanitize";
import { formatTimestamp, truncate } from "@/utils/format";
import type { ParsedLog, LogLevel } from "@/types/log.types";
import type { BadgeProps } from "@/components/ui/badge";

const LEVEL_VARIANT: Record<LogLevel, BadgeProps["variant"]> = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
  CRITICAL: "critical",
};

interface Props {
  log: ParsedLog;
  style: React.CSSProperties;
  onClick?: () => void;
}

export const LogRow = memo(function LogRow({ log, style, onClick }: Props) {
  return (
    <div
      style={style}
      className="flex items-start gap-3 border-b border-[hsl(var(--border))] px-4 py-2 hover:bg-[hsl(var(--accent))] cursor-pointer"
      onClick={onClick}
    >
      {/* Timestamp */}
      <span className="w-36 shrink-0 text-xs text-[hsl(var(--muted-foreground))] tabular-nums">
        {formatTimestamp(log.timestamp)}
      </span>

      {/* Level badge */}
      <div className="w-20 shrink-0">
        <Badge
          variant={LEVEL_VARIANT[log.level] ?? "outline"}
          className="text-xs"
        >
          {log.level}
        </Badge>
      </div>

      {/* Service */}
      <span className="w-28 shrink-0 truncate text-xs text-[hsl(var(--muted-foreground))]">
        {sanitize(log.service)}
      </span>

      {/* Message + structured meta fields */}
      <div className="flex-1 min-w-0">
        <span className="text-xs text-[hsl(var(--foreground))] break-all">
          {truncate(sanitize(log.message), 200)}
        </span>
        {log.meta && Object.keys(log.meta).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(log.meta)
              .slice(0, 6)
              .map(([k, v]) => (
                <span
                  key={k}
                  className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-mono bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                >
                  <span className="opacity-60">{k}=</span>
                  <span>{String(v)}</span>
                </span>
              ))}
          </div>
        )}
      </div>
    </div>
  );
});
