import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  FileCheck,
  ArrowRight,
  RotateCcw,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { compareLogs } from "@/core/diff/diffEngine";
import { parseFile, detectFormat } from "@/core/parser/index";
import { analyze } from "@/core/analyzer/index";
import { useLogStore } from "@/store/useLogStore";
import type { AnalysisResult } from "@/types/analysis.types";
import type { DiffResult } from "@/types/worker.types";
import { truncate, formatCount } from "@/utils/format";
import { cn } from "@/lib/utils";

const VALID_EXTENSIONS = new Set([".log", ".txt", ".json", ".csv", ".ndjson"]);

interface FileSlot {
  name: string;
  analysis: AnalysisResult;
}

// ── Defined OUTSIDE DiffViewer so React never remounts it on state change
interface DropZoneProps {
  label: string;
  loaded: boolean;
  name?: string;
  onFile: (file: File) => void;
  slot: "A" | "B";
}

function DropZone({ label, loaded, name, onFile, slot }: DropZoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (accepted) => {
      const file = accepted[0];
      if (!file) return;
      const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
      if (VALID_EXTENSIONS.has(ext)) onFile(file);
    },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors",
        isDragActive
          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)_/_0.12)]"
          : loaded
            ? slot === "A"
              ? "border-blue-600 bg-blue-950/20"
              : "border-green-600 bg-green-950/20"
            : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary)_/_0.5)] hover:bg-[hsl(var(--accent))]",
      )}
    >
      <input {...getInputProps()} />
      {loaded ? (
        <FileCheck
          className={cn(
            "h-6 w-6",
            slot === "A" ? "text-blue-400" : "text-green-400",
          )}
        />
      ) : (
        <Upload className="h-6 w-6 text-[hsl(var(--muted-foreground))]" />
      )}
      <p className="mt-2 text-sm font-medium text-[hsl(var(--foreground))]">
        {label}
      </p>
      {name ? (
        <Badge variant="secondary" className="mt-1 max-w-full truncate text-xs">
          {name}
        </Badge>
      ) : (
        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
          Drop or click to browse · .log .txt .json .csv
        </p>
      )}
    </div>
  );
}

// ── Stat delta card used in summary row
function StatDelta({
  label,
  a,
  b,
  higherIsBad,
  suffix = "",
}: {
  label: string;
  a: number;
  b: number;
  higherIsBad?: boolean;
  suffix?: string;
}) {
  const delta = b - a;
  const pct = a === 0 ? (b === 0 ? 0 : 100) : Math.round((delta / a) * 100);
  const improved = higherIsBad ? delta < 0 : delta > 0;
  const neutral = delta === 0;
  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
        {label}
      </p>
      <div className="mt-1 flex items-center justify-center gap-2">
        <span className="text-xs text-blue-400">
          {a.toLocaleString()}
          {suffix}
        </span>
        <ArrowRight className="h-3 w-3 text-[hsl(var(--muted-foreground))]" />
        <span className="text-xs text-green-400">
          {b.toLocaleString()}
          {suffix}
        </span>
      </div>
      {!neutral && (
        <p
          className={cn(
            "mt-0.5 text-[11px] font-semibold",
            neutral
              ? "text-[hsl(var(--muted-foreground))]"
              : improved
                ? "text-green-400"
                : "text-red-400",
          )}
        >
          {delta > 0 ? "+" : ""}
          {pct}%
        </p>
      )}
    </div>
  );
}

// ── Change entry row with a visual change bar
function ChangeRow({
  entry,
  color,
}: {
  entry: { key: string; from: number; to: number; changePct: number };
  color: "amber" | "cyan";
}) {
  const max = Math.max(entry.from, entry.to);
  const barA = max > 0 ? (entry.from / max) * 100 : 0;
  const barB = max > 0 ? (entry.to / max) * 100 : 0;
  return (
    <div className="rounded border border-[hsl(var(--border))] px-3 py-2">
      <p
        className={cn(
          "break-all text-xs font-medium",
          color === "amber" ? "text-amber-200" : "text-cyan-200",
        )}
      >
        {truncate(entry.key, 90)}
      </p>
      <div className="mt-1.5 space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-5 text-right text-[10px] text-blue-400">A</span>
          <div
            className="flex-1 rounded-full bg-[hsl(var(--muted))]"
            style={{ height: 4 }}
          >
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${barA}%` }}
            />
          </div>
          <span className="w-8 text-right text-[10px] text-blue-400">
            {entry.from}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 text-right text-[10px] text-green-400">B</span>
          <div
            className="flex-1 rounded-full bg-[hsl(var(--muted))]"
            style={{ height: 4 }}
          >
            <div
              className={cn(
                "h-full rounded-full",
                color === "amber" ? "bg-amber-500" : "bg-cyan-600",
              )}
              style={{ width: `${barB}%` }}
            />
          </div>
          <span
            className={cn(
              "w-8 text-right text-[10px]",
              color === "amber" ? "text-amber-400" : "text-cyan-400",
            )}
          >
            {entry.to}
          </span>
        </div>
      </div>
      <p
        className={cn(
          "mt-1 text-right text-[10px] font-semibold",
          color === "amber" ? "text-amber-400" : "text-cyan-400",
        )}
      >
        {entry.changePct > 0 ? "+" : ""}
        {entry.changePct}%
      </p>
    </div>
  );
}

export function DiffViewer() {
  const activeSession = useLogStore((s) => s.activeSession);
  const sessions = useLogStore((s) => s.sessions);

  const [slotA, setSlotA] = useState<FileSlot | null>(null);
  const [slotB, setSlotB] = useState<FileSlot | null>(null);
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFile = useCallback(async (file: File, slot: "A" | "B") => {
    if (slot === "A") setLoadingA(true);
    else setLoadingB(true);
    try {
      const content = await file.text();
      const format = detectFormat(file.name, content.slice(0, 500));
      const { logs } = parseFile(content, format);
      const analysis = analyze(logs);
      if (slot === "A") setSlotA({ name: file.name, analysis });
      else setSlotB({ name: file.name, analysis });
    } finally {
      if (slot === "A") setLoadingA(false);
      else setLoadingB(false);
    }
  }, []);

  const useSessionAsSlot = (sessionId: string, slot: "A" | "B") => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    const entry = { name: session.fileName, analysis: session.analysis };
    if (slot === "A") setSlotA(entry);
    else setSlotB(entry);
    setDiff(null);
  };

  const runDiff = () => {
    if (!slotA || !slotB) {
      setError("Load both files first");
      return;
    }
    if (slotA.name === slotB.name && slotA.analysis === slotB.analysis) {
      setError(
        "Both slots point to the same session — please use different files",
      );
      return;
    }
    setError(null);
    setDiff(compareLogs(slotA.analysis, slotB.analysis));
  };

  const reset = () => {
    setSlotA(null);
    setSlotB(null);
    setDiff(null);
    setError(null);
  };

  return (
    <div className="space-y-5">
      {/* ── Instructions */}
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">
        <strong className="text-[hsl(var(--foreground))]">
          How it works:{" "}
        </strong>
        Upload or pick two log files —{" "}
        <span className="text-blue-400 font-medium">A (before)</span> and{" "}
        <span className="text-green-400 font-medium">B (after)</span> — then
        click Compare. You'll see which errors are new, which were fixed, and
        which got worse or better. Useful after deploys, infra changes, or
        incident reviews.
      </div>

      {/* ── Use active session shortcut */}
      {(activeSession || sessions.length > 0) && (
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            <Layers className="mr-1 inline h-3 w-3" />
            Load from sessions
          </p>
          <div className="flex flex-wrap gap-2">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center gap-1">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  {truncate(s.fileName, 30)}
                </span>
                <button
                  onClick={() => useSessionAsSlot(s.id, "A")}
                  className="rounded border border-blue-800 px-1.5 py-0.5 text-[10px] text-blue-400 hover:bg-blue-950 transition-colors"
                >
                  → A
                </button>
                <button
                  onClick={() => useSessionAsSlot(s.id, "B")}
                  className="rounded border border-green-800 px-1.5 py-0.5 text-[10px] text-green-400 hover:bg-green-950 transition-colors"
                >
                  → B
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── File slots */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="rounded bg-blue-900 px-2 py-0.5 text-xs font-bold text-blue-300">
              A · Before
            </span>
            {slotA && (
              <button
                onClick={() => {
                  setSlotA(null);
                  setDiff(null);
                }}
                className="text-xs text-[hsl(var(--muted-foreground))] hover:text-red-400 transition-colors"
              >
                clear
              </button>
            )}
          </div>
          <DropZone
            slot="A"
            label={loadingA ? "Processing..." : "Drop or click to browse"}
            loaded={!!slotA}
            name={slotA?.name}
            onFile={(f) => loadFile(f, "A")}
          />
          {slotA && (
            <div className="rounded border border-[hsl(var(--border))] px-3 py-2 text-xs text-[hsl(var(--muted-foreground))]">
              <span className="text-blue-400 font-semibold">
                {formatCount(slotA.analysis.totalCount)}
              </span>{" "}
              logs ·{" "}
              <span className="text-red-400">
                {formatCount(
                  slotA.analysis.errorCount + slotA.analysis.criticalCount,
                )}
              </span>{" "}
              errors ·{" "}
              <span className="text-amber-400">
                {formatCount(slotA.analysis.warnCount)}
              </span>{" "}
              warnings
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="rounded bg-green-900 px-2 py-0.5 text-xs font-bold text-green-300">
              B · After
            </span>
            {slotB && (
              <button
                onClick={() => {
                  setSlotB(null);
                  setDiff(null);
                }}
                className="text-xs text-[hsl(var(--muted-foreground))] hover:text-red-400 transition-colors"
              >
                clear
              </button>
            )}
          </div>
          <DropZone
            slot="B"
            label={loadingB ? "Processing..." : "Drop or click to browse"}
            loaded={!!slotB}
            name={slotB?.name}
            onFile={(f) => loadFile(f, "B")}
          />
          {slotB && (
            <div className="rounded border border-[hsl(var(--border))] px-3 py-2 text-xs text-[hsl(var(--muted-foreground))]">
              <span className="text-green-400 font-semibold">
                {formatCount(slotB.analysis.totalCount)}
              </span>{" "}
              logs ·{" "}
              <span className="text-red-400">
                {formatCount(
                  slotB.analysis.errorCount + slotB.analysis.criticalCount,
                )}
              </span>{" "}
              errors ·{" "}
              <span className="text-amber-400">
                {formatCount(slotB.analysis.warnCount)}
              </span>{" "}
              warnings
            </div>
          )}
        </div>
      </div>

      {/* ── Actions */}
      <div className="flex gap-3">
        <Button
          onClick={runDiff}
          disabled={!slotA || !slotB || loadingA || loadingB}
          className="flex-1"
        >
          Compare A → B
        </Button>
        {(slotA || slotB || diff) && (
          <Button variant="outline" onClick={reset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        )}
      </div>

      {error && (
        <p className="rounded border border-red-900 bg-red-950/30 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {/* ── Results */}
      {diff && (
        <div className="space-y-5">
          {/* Summary row */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Summary
            </p>
            <div className="grid grid-cols-4 gap-3">
              <StatDelta
                label="Total Logs"
                a={diff.summary.totalLogsA}
                b={diff.summary.totalLogsB}
              />
              <StatDelta
                label="Errors"
                a={diff.summary.errorsA}
                b={diff.summary.errorsB}
                higherIsBad
              />
              <StatDelta
                label="Error Rate"
                a={diff.summary.errorRateA}
                b={diff.summary.errorRateB}
                higherIsBad
                suffix="%"
              />
              <StatDelta
                label="Warnings"
                a={diff.summary.warningsA}
                b={diff.summary.warningsB}
                higherIsBad
              />
            </div>
          </div>

          {/* Change counts badges */}
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-red-800 bg-red-950/30 px-3 py-1 text-xs font-semibold text-red-300">
              <Plus className="mr-1 inline h-3 w-3" />
              {diff.newErrors.length} new errors
            </span>
            <span className="rounded-full border border-green-800 bg-green-950/30 px-3 py-1 text-xs font-semibold text-green-300">
              <Minus className="mr-1 inline h-3 w-3" />
              {diff.resolvedErrors.length} resolved
            </span>
            <span className="rounded-full border border-amber-800 bg-amber-950/30 px-3 py-1 text-xs font-semibold text-amber-300">
              <TrendingUp className="mr-1 inline h-3 w-3" />
              {diff.increased.length} increased
            </span>
            <span className="rounded-full border border-cyan-800 bg-cyan-950/30 px-3 py-1 text-xs font-semibold text-cyan-300">
              <TrendingDown className="mr-1 inline h-3 w-3" />
              {diff.decreased.length} decreased
            </span>
            <span className="rounded-full border border-[hsl(var(--border))] px-3 py-1 text-xs text-[hsl(var(--muted-foreground))]">
              {diff.unchanged.length} unchanged
            </span>
          </div>

          {/* 4 detail cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* New errors */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm text-red-400">
                  <Plus className="h-4 w-4" />
                  New Errors in B ({diff.newErrors.length})
                </CardTitle>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                  These errors did not exist in A — introduced after this change
                </p>
              </CardHeader>
              <CardContent className="max-h-64 space-y-1 overflow-y-auto">
                {diff.newErrors.length === 0 ? (
                  <p className="text-xs text-green-400">
                    No new errors introduced
                  </p>
                ) : (
                  diff.newErrors.map((key) => (
                    <div
                      key={key}
                      className="break-all rounded bg-red-950/30 px-2 py-1.5 text-xs text-red-300"
                    >
                      {truncate(key, 120)}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Resolved errors */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm text-green-400">
                  <Minus className="h-4 w-4" />
                  Resolved in B ({diff.resolvedErrors.length})
                </CardTitle>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                  These errors existed in A but are gone in B — fixed
                </p>
              </CardHeader>
              <CardContent className="max-h-64 space-y-1 overflow-y-auto">
                {diff.resolvedErrors.length === 0 ? (
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    No errors resolved
                  </p>
                ) : (
                  diff.resolvedErrors.map((key) => (
                    <div
                      key={key}
                      className="break-all rounded bg-green-950/30 px-2 py-1.5 text-xs text-green-300"
                    >
                      {truncate(key, 120)}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Increased */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm text-amber-400">
                  <TrendingUp className="h-4 w-4" />
                  Worsened ({diff.increased.length})
                </CardTitle>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                  Errors that appear more frequently in B than in A
                </p>
              </CardHeader>
              <CardContent className="max-h-64 space-y-2 overflow-y-auto">
                {diff.increased.length === 0 ? (
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    None
                  </p>
                ) : (
                  diff.increased.map((item) => (
                    <ChangeRow key={item.key} entry={item} color="amber" />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Decreased */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm text-cyan-400">
                  <TrendingDown className="h-4 w-4" />
                  Improved ({diff.decreased.length})
                </CardTitle>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                  Errors that appear less frequently in B — getting better
                </p>
              </CardHeader>
              <CardContent className="max-h-64 space-y-2 overflow-y-auto">
                {diff.decreased.length === 0 ? (
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    None
                  </p>
                ) : (
                  diff.decreased.map((item) => (
                    <ChangeRow key={item.key} entry={item} color="cyan" />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
