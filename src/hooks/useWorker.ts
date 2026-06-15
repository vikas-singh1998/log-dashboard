import { useRef, useState, useCallback } from "react";
import * as Comlink from "comlink";
import type { WorkerInput, WorkerOutput } from "@/types/worker.types";

type LogWorkerAPI = {
  processFile: (input: WorkerInput) => Promise<WorkerOutput>;
};

export function useWorker() {
  const workerRef = useRef<Worker | null>(null);
  const apiRef = useRef<Comlink.Remote<LogWorkerAPI> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAPI = useCallback((): Comlink.Remote<LogWorkerAPI> => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL("../workers/logWorker.ts", import.meta.url),
        { type: "module" },
      );
      apiRef.current = Comlink.wrap<LogWorkerAPI>(workerRef.current);
    }
    return apiRef.current!;
  }, []);

  const processFile = useCallback(
    async (input: WorkerInput): Promise<WorkerOutput | null> => {
      setLoading(true);
      setError(null);
      try {
        const api = getAPI();
        const result = await api.processFile(input);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getAPI],
  );

  const terminate = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    apiRef.current = null;
  }, []);

  return { processFile, loading, error, terminate };
}
