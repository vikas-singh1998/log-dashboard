import {
  FixedSizeList as List,
  type ListChildComponentProps,
} from "react-window";
import { LogRow } from "./LogRow";
import type { ParsedLog } from "@/types/log.types";

const ROW_HEIGHT = 40;

interface Props {
  logs: ParsedLog[];
  height?: number;
}

export function LogTable({ logs, height = 500 }: Props) {
  if (logs.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
        No logs match the current filters
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[hsl(var(--border))]">
      {/* Header row */}
      <div className="flex gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
        <span className="w-36 shrink-0">Timestamp</span>
        <span className="w-20 shrink-0">Level</span>
        <span className="w-28 shrink-0">Service</span>
        <span className="flex-1">Message</span>
      </div>

      {/* Virtualized rows */}
      <List
        height={height}
        itemCount={logs.length}
        itemSize={ROW_HEIGHT}
        width="100%"
        overscanCount={10}
      >
        {({ index, style }: ListChildComponentProps) => (
          <LogRow key={logs[index].id} log={logs[index]} style={style} />
        )}
      </List>
    </div>
  );
}
