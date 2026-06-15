import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { ParsedLog, LogLevel } from "@/types/log.types";
import type { AnalysisResult } from "@/types/analysis.types";
import type { RuleMatch } from "@/types/rules.types";

export interface LogFilters {
  levels: LogLevel[];
  services: string[];
  timeRange: { start: number; end: number } | null;
  searchQuery: string;
  statusCodes: number[]; // HTTP status code filter e.g. [200, 404]
  httpMethods: string[]; // HTTP method filter e.g. ["GET", "POST"]
}

export interface ActiveSession {
  id: string;
  name: string;
  fileName: string;
  loadedAt: number;
}

/** Full in-memory session — one entry per uploaded file (max 10) */
export interface SessionEntry {
  id: string;
  fileName: string;
  loadedAt: number;
  parsedLogs: ParsedLog[];
  analysis: AnalysisResult;
  ruleMatches: RuleMatch[];
  parseErrors: string[];
}

const RESET_FILTERS: LogFilters = {
  levels: [],
  services: [],
  timeRange: null,
  searchQuery: "",
  statusCodes: [],
  httpMethods: [],
};

function toActiveSession(entry: SessionEntry): ActiveSession {
  return {
    id: entry.id,
    name: entry.fileName,
    fileName: entry.fileName,
    loadedAt: entry.loadedAt,
  };
}

interface LogStore {
  // All loaded sessions (in-memory, newest-first)
  sessions: SessionEntry[];
  activeSessionId: string | null;

  // Data for the currently active session
  parsedLogs: ParsedLog[];
  analysis: AnalysisResult | null;
  ruleMatches: RuleMatch[];
  parseErrors: string[];

  // Derived filtered list (updated by setFilters)
  filteredLogs: ParsedLog[];

  // Filters
  filters: LogFilters;

  // UI state
  loading: boolean;
  error: string | null;
  activeSession: ActiveSession | null; // mirrors activeSessionId entry — used by Header & export

  // Second log set for diffing
  compareSession: {
    parsedLogs: ParsedLog[];
    analysis: AnalysisResult;
    fileName: string;
  } | null;

  // Actions
  setLogsFromWorker: (
    parsedLogs: ParsedLog[],
    analysis: AnalysisResult,
    ruleMatches: RuleMatch[],
    parseErrors: string[],
    fileName: string,
  ) => void;
  switchToSession: (id: string) => void;
  removeSessionById: (id: string) => void;
  setCompareSession: (
    parsedLogs: ParsedLog[],
    analysis: AnalysisResult,
    fileName: string,
  ) => void;
  setFilters: (filters: Partial<LogFilters>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearLogs: () => void;
  applyFilters: () => void;
}

const DEFAULT_ANALYSIS: AnalysisResult = {
  totalCount: 0,
  errorCount: 0,
  warnCount: 0,
  infoCount: 0,
  debugCount: 0,
  criticalCount: 0,
  topServices: [],
  errorGroups: [],
  frequencyMap: {},
  trends: [],
  timeRange: null,
  httpStatuses: [],
  httpMethods: [],
};

function applyFiltersToLogs(
  logs: ParsedLog[],
  filters: LogFilters,
): ParsedLog[] {
  let result = logs;

  if (filters.levels.length > 0) {
    result = result.filter((l) => filters.levels.includes(l.level));
  }

  if (filters.services.length > 0) {
    result = result.filter((l) => filters.services.includes(l.service));
  }

  if (filters.timeRange) {
    const { start, end } = filters.timeRange;
    // end is inclusive — set to end-of-minute (add 59999ms) so a user
    // picking "13:25" still sees entries with ms within that minute
    result = result.filter(
      (l) => l.timestamp >= start && l.timestamp <= end + 59_999,
    );
  }

  if (filters.statusCodes.length > 0) {
    result = result.filter(
      (l) =>
        l.httpStatus !== undefined &&
        filters.statusCodes.includes(l.httpStatus),
    );
  }

  if (filters.httpMethods.length > 0) {
    result = result.filter(
      (l) =>
        l.httpMethod !== undefined &&
        filters.httpMethods.includes(l.httpMethod),
    );
  }

  // NOTE: searchQuery filtering is handled by useSearch hook (Fuse.js)

  return result;
}

export const useLogStore = create<LogStore>()(
  devtools(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      parsedLogs: [],
      analysis: null,
      ruleMatches: [],
      parseErrors: [],
      filteredLogs: [],
      filters: { ...RESET_FILTERS },
      loading: false,
      error: null,
      activeSession: null,
      compareSession: null,

      setLogsFromWorker: (
        parsedLogs,
        analysis,
        ruleMatches,
        parseErrors,
        fileName,
      ) => {
        const id = Math.random().toString(36).slice(2);
        const entry: SessionEntry = {
          id,
          fileName,
          loadedAt: Date.now(),
          parsedLogs,
          analysis,
          ruleMatches,
          parseErrors,
        };
        // Keep max 10 sessions, newest first
        const newSessions = [entry, ...get().sessions].slice(0, 10);
        set({
          sessions: newSessions,
          activeSessionId: id,
          parsedLogs,
          analysis,
          ruleMatches,
          parseErrors,
          filteredLogs: parsedLogs,
          filters: { ...RESET_FILTERS },
          activeSession: toActiveSession(entry),
          loading: false,
          error: null,
          compareSession: null,
        });
      },

      switchToSession: (id) => {
        const entry = get().sessions.find((s) => s.id === id);
        if (!entry) return;
        set({
          activeSessionId: id,
          parsedLogs: entry.parsedLogs,
          analysis: entry.analysis,
          ruleMatches: entry.ruleMatches,
          parseErrors: entry.parseErrors,
          filteredLogs: entry.parsedLogs,
          filters: { ...RESET_FILTERS },
          activeSession: toActiveSession(entry),
          compareSession: null,
        });
      },

      removeSessionById: (id) => {
        const { sessions, activeSessionId } = get();
        const remaining = sessions.filter((s) => s.id !== id);

        if (id !== activeSessionId) {
          // Not active — just remove from list
          set({ sessions: remaining });
          return;
        }

        // Removing the active session — switch to the next one or clear
        if (remaining.length > 0) {
          const next = remaining[0];
          set({
            sessions: remaining,
            activeSessionId: next.id,
            parsedLogs: next.parsedLogs,
            analysis: next.analysis,
            ruleMatches: next.ruleMatches,
            parseErrors: next.parseErrors,
            filteredLogs: next.parsedLogs,
            filters: { ...RESET_FILTERS },
            activeSession: toActiveSession(next),
            compareSession: null,
          });
        } else {
          set({
            sessions: [],
            activeSessionId: null,
            parsedLogs: [],
            analysis: DEFAULT_ANALYSIS,
            ruleMatches: [],
            parseErrors: [],
            filteredLogs: [],
            filters: { ...RESET_FILTERS },
            activeSession: null,
            compareSession: null,
          });
        }
      },

      setCompareSession: (parsedLogs, analysis, fileName) => {
        set({ compareSession: { parsedLogs, analysis, fileName } });
      },

      setFilters: (newFilters) => {
        const merged = { ...get().filters, ...newFilters };
        set({
          filters: merged,
          filteredLogs: applyFiltersToLogs(get().parsedLogs, merged),
        });
      },

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      clearLogs: () =>
        set({
          sessions: [],
          activeSessionId: null,
          parsedLogs: [],
          analysis: DEFAULT_ANALYSIS,
          ruleMatches: [],
          parseErrors: [],
          filteredLogs: [],
          activeSession: null,
          compareSession: null,
          filters: { ...RESET_FILTERS },
        }),

      applyFilters: () => {
        const { parsedLogs, filters } = get();
        set({ filteredLogs: applyFiltersToLogs(parsedLogs, filters) });
      },
    }),
    { name: "LogStore" },
  ),
);
