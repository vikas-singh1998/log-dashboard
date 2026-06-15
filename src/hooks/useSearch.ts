import { useMemo, useState, useCallback } from "react";
import Fuse, { type IFuseOptions } from "fuse.js";
import { debounce } from "lodash-es";
import type { ParsedLog } from "@/types/log.types";

const FUSE_OPTIONS: IFuseOptions<ParsedLog> = {
  keys: ["message", "service", "stackTrace"],
  threshold: 0.35,
  includeScore: true,
  minMatchCharLength: 2,
};

export function useSearch(logs: ParsedLog[]) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSet = useCallback(
    debounce((q: string) => setDebouncedQuery(q), 300),
    [],
  );

  const handleQuery = useCallback(
    (q: string) => {
      setQuery(q);
      debouncedSet(q);
    },
    [debouncedSet],
  );

  const fuse = useMemo(() => new Fuse(logs, FUSE_OPTIONS), [logs]);

  const results = useMemo<ParsedLog[]>(() => {
    if (!debouncedQuery.trim()) return logs;
    return fuse.search(debouncedQuery).map((r) => r.item);
  }, [fuse, debouncedQuery, logs]);

  return { query, setQuery: handleQuery, results };
}
