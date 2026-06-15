import { useState, useCallback, useRef } from "react";
import {
  Calendar,
  Clock,
  ChevronDown,
  X,
  Zap,
  Globe,
  Hash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLogStore } from "@/store/useLogStore";
import type { LogLevel } from "@/types/log.types";
import { cn } from "@/lib/utils";
import { formatTimestamp } from "@/utils/format";

const ALL_LEVELS: LogLevel[] = ["DEBUG", "INFO", "WARN", "ERROR", "CRITICAL"];

// Status code groups for quick access chips
const STATUS_GROUPS = [
  { label: "1xx", range: [100, 199] },
  { label: "2xx", range: [200, 299] },
  { label: "3xx", range: [300, 399] },
  { label: "4xx", range: [400, 499] },
  { label: "5xx", range: [500, 599] },
];

type StatusGroupLabel = "1xx" | "2xx" | "3xx" | "4xx" | "5xx";

function statusGroupColor(label: StatusGroupLabel | string) {
  switch (label) {
    case "1xx":
      return "text-slate-300 border-slate-600 hover:border-slate-400";
    case "2xx":
      return "text-green-300 border-green-800 hover:border-green-500";
    case "3xx":
      return "text-cyan-300 border-cyan-800 hover:border-cyan-500";
    case "4xx":
      return "text-amber-300 border-amber-800 hover:border-amber-500";
    case "5xx":
      return "text-red-300 border-red-800 hover:border-red-500";
    default:
      return "text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]";
  }
}
function statusGroupActiveColor(label: string) {
  switch (label) {
    case "1xx":
      return "bg-slate-800 text-slate-200 border-slate-500";
    case "2xx":
      return "bg-green-950 text-green-200 border-green-600";
    case "3xx":
      return "bg-cyan-950 text-cyan-200 border-cyan-600";
    case "4xx":
      return "bg-amber-950 text-amber-200 border-amber-600";
    case "5xx":
      return "bg-red-950 text-red-200 border-red-600";
    default:
      return "bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] border-[hsl(var(--primary))]";
  }
}

/** Convert "YYYY-MM-DDThh:mm" local datetime-input value to unix ms */
function localInputToMs(value: string): number | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.getTime();
}

/** Convert unix ms to "YYYY-MM-DDThh:mm" for datetime-local input */
function msToLocalInput(ms: number): string {
  if (!ms) return "";
  const d = new Date(ms);
  // toISOString gives UTC; we need local
  const offset = d.getTimezoneOffset();
  const local = new Date(ms - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

/** Quick preset date ranges */
const QUICK_PRESETS = [
  { label: "Last 15 min", ms: 15 * 60_000 },
  { label: "Last 1h", ms: 60 * 60_000 },
  { label: "Last 6h", ms: 6 * 60 * 60_000 },
  { label: "Last 24h", ms: 24 * 60 * 60_000 },
  { label: "Last 7d", ms: 7 * 24 * 60 * 60_000 },
];

export function FilterPanel() {
  const { filters, setFilters, analysis } = useLogStore();
  const [dateOpen, setDateOpen] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);

  // ── derived
  const allServices = analysis?.topServices.map((s) => s.service) ?? [];
  const allStatuses = analysis?.httpStatuses ?? [];
  const allMethods = analysis?.httpMethods ?? [];
  const logTimeRange = analysis?.timeRange ?? null;

  // ── toggle helpers
  const toggleLevel = (level: LogLevel) => {
    const next = filters.levels.includes(level)
      ? filters.levels.filter((l) => l !== level)
      : [...filters.levels, level];
    setFilters({ levels: next });
  };

  const toggleService = (svc: string) => {
    const next = filters.services.includes(svc)
      ? filters.services.filter((s) => s !== svc)
      : [...filters.services, svc];
    setFilters({ services: next });
  };

  const toggleStatus = (code: number) => {
    const next = filters.statusCodes.includes(code)
      ? filters.statusCodes.filter((s) => s !== code)
      : [...filters.statusCodes, code];
    setFilters({ statusCodes: next });
  };

  const toggleStatusGroup = (range: [number, number]) => {
    const inGroup = allStatuses
      .filter((s) => s.status >= range[0] && s.status <= range[1])
      .map((s) => s.status);
    if (inGroup.length === 0) return;
    // If all in group are active, deselect all; otherwise select all
    const allActive = inGroup.every((c) => filters.statusCodes.includes(c));
    const withoutGroup = filters.statusCodes.filter(
      (c) => c < range[0] || c > range[1],
    );
    setFilters({
      statusCodes: allActive ? withoutGroup : [...withoutGroup, ...inGroup],
    });
  };

  const toggleMethod = (method: string) => {
    const next = filters.httpMethods.includes(method)
      ? filters.httpMethods.filter((m) => m !== method)
      : [...filters.httpMethods, method];
    setFilters({ httpMethods: next });
  };

  // ── date range
  const setQuickPreset = useCallback(
    (ms: number) => {
      // Use the latest log timestamp (not wall clock) so presets make sense
      // for historical log files
      const end = logTimeRange?.end ?? Date.now();
      setFilters({ timeRange: { start: end - ms, end } });
      setDateOpen(false);
    },
    [logTimeRange, setFilters],
  );

  const handleStartChange = (value: string) => {
    const ms = localInputToMs(value);
    if (ms === null) return;
    const currentEnd =
      filters.timeRange?.end ?? logTimeRange?.end ?? Date.now();
    if (ms > currentEnd) return; // start must be ≤ end
    setFilters({ timeRange: { start: ms, end: currentEnd } });
  };

  const handleEndChange = (value: string) => {
    const ms = localInputToMs(value);
    if (ms === null) return;
    const currentStart = filters.timeRange?.start ?? logTimeRange?.start ?? 0;
    if (ms < currentStart) return; // end must be ≥ start
    setFilters({ timeRange: { start: currentStart, end: ms } });
  };

  const clearDateRange = () => setFilters({ timeRange: null });

  // ── active filter count
  const activeCount =
    filters.levels.length +
    filters.services.length +
    filters.statusCodes.length +
    filters.httpMethods.length +
    (filters.timeRange ? 1 : 0);

  const clearAll = () =>
    setFilters({
      levels: [],
      services: [],
      statusCodes: [],
      httpMethods: [],
      timeRange: null,
    });

  return (
    <div className="space-y-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
      {/* ── Header row with active count + clear all */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
          Filters
          {activeCount > 0 && (
            <span className="ml-2 rounded-full bg-[hsl(var(--primary))] px-1.5 py-0.5 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </span>
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      {/* ── Row 1: Log Levels */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
          <Zap className="h-3 w-3" />
          Level
        </span>
        {ALL_LEVELS.map((level) => {
          const active = filters.levels.includes(level);
          return (
            <button
              key={level}
              onClick={() => toggleLevel(level)}
              title={`Filter by ${level}`}
            >
              <Badge
                variant={
                  level.toLowerCase() as
                    | "debug"
                    | "info"
                    | "warn"
                    | "error"
                    | "critical"
                }
                className={cn(
                  "cursor-pointer transition-opacity text-xs",
                  active ? "opacity-100" : "opacity-35 hover:opacity-60",
                )}
              >
                {level}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* ── Row 2: Services — only shown if data has them */}
      {allServices.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
            <Globe className="h-3 w-3" />
            Service
          </span>
          {allServices.map((svc) => {
            const active = filters.services.includes(svc);
            return (
              <button
                key={svc}
                onClick={() => toggleService(svc)}
                title={`Filter by service: ${svc}`}
                className={cn(
                  "rounded-md border px-2 py-0.5 text-xs font-medium transition-all",
                  active
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]"
                    : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary)/0.5)] hover:text-[hsl(var(--foreground))]",
                )}
              >
                {svc}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Row 3: HTTP Status Codes — only if HTTP logs present */}
      {allStatuses.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
            <Hash className="h-3 w-3" />
            Status
          </span>
          {/* Group chips: 2xx, 4xx, 5xx etc. */}
          {STATUS_GROUPS.map(({ label, range }) => {
            const codesInGroup = allStatuses
              .filter((s) => s.status >= range[0] && s.status <= range[1])
              .map((s) => s.status);
            if (codesInGroup.length === 0) return null;
            const active = codesInGroup.every((c) =>
              filters.statusCodes.includes(c),
            );
            const partial =
              !active &&
              codesInGroup.some((c) => filters.statusCodes.includes(c));
            return (
              <button
                key={label}
                onClick={() => toggleStatusGroup(range as [number, number])}
                title={`Filter all ${label} status codes`}
                className={cn(
                  "rounded-md border px-2 py-0.5 text-xs font-semibold transition-all",
                  active
                    ? statusGroupActiveColor(label)
                    : partial
                      ? cn(statusGroupActiveColor(label), "opacity-70")
                      : cn("bg-transparent", statusGroupColor(label)),
                )}
              >
                {label}
              </button>
            );
          })}

          {/* Individual code chips — only show individual codes if more than 1 code in that group */}
          {allStatuses.map(({ status, count }) => {
            // Show individual chips only when only 1-2 codes exist in the group
            const groupKey = `${Math.floor(status / 100)}xx`;
            const codesInGroup = allStatuses.filter(
              (s) => Math.floor(s.status / 100) === Math.floor(status / 100),
            );
            if (codesInGroup.length <= 3) {
              const active = filters.statusCodes.includes(status);
              return (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  title={`Status ${status} (${count} logs)`}
                  className={cn(
                    "rounded border px-1.5 py-0.5 font-mono text-xs transition-all",
                    active
                      ? statusGroupActiveColor(groupKey)
                      : cn(
                          "bg-transparent",
                          statusGroupColor(groupKey),
                          "opacity-60 hover:opacity-100",
                        ),
                  )}
                >
                  {status}
                  <span className="ml-1 opacity-60">×{count}</span>
                </button>
              );
            }
            return null;
          })}
        </div>
      )}

      {/* ── Row 4: HTTP Methods — only if HTTP logs present */}
      {allMethods.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-[hsl(var(--muted-foreground))]">
            Method
          </span>
          {allMethods.map(({ method, count }) => {
            const active = filters.httpMethods.includes(method);
            const color =
              {
                GET: active
                  ? "bg-blue-950 text-blue-200 border-blue-600"
                  : "border-blue-900 text-blue-400 hover:border-blue-600",
                POST: active
                  ? "bg-green-950 text-green-200 border-green-600"
                  : "border-green-900 text-green-400 hover:border-green-600",
                PUT: active
                  ? "bg-amber-950 text-amber-200 border-amber-600"
                  : "border-amber-900 text-amber-400 hover:border-amber-600",
                PATCH: active
                  ? "bg-orange-950 text-orange-200 border-orange-600"
                  : "border-orange-900 text-orange-400 hover:border-orange-600",
                DELETE: active
                  ? "bg-red-950 text-red-200 border-red-600"
                  : "border-red-900 text-red-400 hover:border-red-600",
                HEAD: active
                  ? "bg-slate-800 text-slate-200 border-slate-500"
                  : "border-slate-700 text-slate-400 hover:border-slate-500",
                OPTIONS: active
                  ? "bg-purple-950 text-purple-200 border-purple-600"
                  : "border-purple-900 text-purple-400 hover:border-purple-600",
              }[method] ??
              (active
                ? "bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] border-[hsl(var(--primary))]"
                : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary)/0.5)]");
            return (
              <button
                key={method}
                onClick={() => toggleMethod(method)}
                title={`Filter ${method} requests (${count})`}
                className={cn(
                  "rounded border px-2 py-0.5 text-xs font-semibold font-mono transition-all",
                  color,
                )}
              >
                {method}
                <span className="ml-1 font-normal opacity-60">×{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Row 5: Date / Time Range */}
      <div className="relative" ref={dateRef}>
        <button
          onClick={() => setDateOpen((v) => !v)}
          className={cn(
            "flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition-all",
            filters.timeRange
              ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]"
              : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary)/0.5)] hover:text-[hsl(var(--foreground))]",
          )}
        >
          <Calendar className="h-3.5 w-3.5" />
          {filters.timeRange ? (
            <span>
              {formatTimestamp(filters.timeRange.start)} →{" "}
              {formatTimestamp(filters.timeRange.end)}
            </span>
          ) : (
            <span>Date / Time Range</span>
          )}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              dateOpen && "rotate-180",
            )}
          />
          {filters.timeRange && (
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                clearDateRange();
              }}
              className="ml-1 rounded hover:text-red-400"
              title="Clear date range"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </button>

        {dateOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 w-[420px] rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--popover))] p-4 shadow-xl">
            {/* Quick presets */}
            <div className="mb-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                Quick Presets
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PRESETS.map(({ label, ms }) => (
                  <button
                    key={label}
                    onClick={() => setQuickPreset(ms)}
                    className="rounded border border-[hsl(var(--border))] px-2.5 py-1 text-xs text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary)/0.6)] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-all"
                  >
                    {label}
                  </button>
                ))}
                {/* "All data" resets to full range */}
                {logTimeRange && (
                  <button
                    onClick={() => {
                      setFilters({ timeRange: logTimeRange });
                      setDateOpen(false);
                    }}
                    className="rounded border border-[hsl(var(--border))] px-2.5 py-1 text-xs text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary)/0.6)] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-all"
                  >
                    All data
                  </button>
                )}
              </div>
            </div>

            {/* Custom range */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                Custom Range
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                    <Clock className="h-3 w-3" /> Start
                  </label>
                  <input
                    type="datetime-local"
                    value={
                      filters.timeRange
                        ? msToLocalInput(filters.timeRange.start)
                        : logTimeRange
                          ? msToLocalInput(logTimeRange.start)
                          : ""
                    }
                    min={
                      logTimeRange
                        ? msToLocalInput(logTimeRange.start)
                        : undefined
                    }
                    max={
                      logTimeRange
                        ? msToLocalInput(logTimeRange.end)
                        : undefined
                    }
                    onChange={(e) => handleStartChange(e.target.value)}
                    className="w-full rounded border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-2 py-1.5 text-xs text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))] transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                    <Clock className="h-3 w-3" /> End
                  </label>
                  <input
                    type="datetime-local"
                    value={
                      filters.timeRange
                        ? msToLocalInput(filters.timeRange.end)
                        : logTimeRange
                          ? msToLocalInput(logTimeRange.end)
                          : ""
                    }
                    min={
                      logTimeRange
                        ? msToLocalInput(logTimeRange.start)
                        : undefined
                    }
                    max={
                      logTimeRange
                        ? msToLocalInput(logTimeRange.end)
                        : undefined
                    }
                    onChange={(e) => handleEndChange(e.target.value)}
                    className="w-full rounded border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-2 py-1.5 text-xs text-[hsl(var(--foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))] transition-colors"
                  />
                </div>
              </div>

              {/* Show selected range summary */}
              {filters.timeRange && (
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Showing logs between{" "}
                  <span className="text-[hsl(var(--foreground))]">
                    {formatTimestamp(filters.timeRange.start)}
                  </span>{" "}
                  and{" "}
                  <span className="text-[hsl(var(--foreground))]">
                    {formatTimestamp(filters.timeRange.end)}
                  </span>
                </p>
              )}
            </div>

            <div className="mt-3 flex justify-end gap-2">
              {filters.timeRange && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearDateRange}
                  className="text-xs"
                >
                  Clear
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => setDateOpen(false)}
                className="text-xs"
              >
                Apply
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Active filter summary chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-1 border-t border-[hsl(var(--border))] pt-2">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            Active:
          </span>
          {filters.levels.map((l) => (
            <ActiveChip
              key={`lvl-${l}`}
              label={l}
              onRemove={() => toggleLevel(l)}
            />
          ))}
          {filters.services.map((s) => (
            <ActiveChip
              key={`svc-${s}`}
              label={s}
              onRemove={() => toggleService(s)}
            />
          ))}
          {filters.statusCodes.map((c) => (
            <ActiveChip
              key={`sc-${c}`}
              label={String(c)}
              onRemove={() => toggleStatus(c)}
            />
          ))}
          {filters.httpMethods.map((m) => (
            <ActiveChip
              key={`m-${m}`}
              label={m}
              onRemove={() => toggleMethod(m)}
            />
          ))}
          {filters.timeRange && (
            <ActiveChip
              label={`${formatTimestamp(filters.timeRange.start)} → ${formatTimestamp(filters.timeRange.end)}`}
              onRemove={clearDateRange}
            />
          )}
        </div>
      )}
    </div>
  );
}

function ActiveChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-[hsl(var(--accent))] border border-[hsl(var(--border))] pl-2 pr-1 py-0.5 text-xs text-[hsl(var(--foreground))]">
      {label}
      <button
        onClick={onRemove}
        className="rounded-full hover:text-red-400 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
