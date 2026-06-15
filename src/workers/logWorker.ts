import * as Comlink from "comlink";
import { parseFile, detectFormat } from "../core/parser/index";
import { analyze } from "../core/analyzer/index";
import { runRuleEngine } from "../core/rules/index";
import type { WorkerInput, WorkerOutput } from "@/types/worker.types";

class LogWorkerAPI {
  async processFile(input: WorkerInput): Promise<WorkerOutput> {
    const format =
      input.format ?? detectFormat(input.fileName, input.content.slice(0, 500));
    const { logs: parsedLogs, errors: parseErrors } = parseFile(
      input.content,
      format,
    );
    const analysis = analyze(parsedLogs);
    const ruleMatches = runRuleEngine(parsedLogs, analysis);

    return {
      parsedLogs,
      analysis,
      ruleMatches,
      parseErrors,
    };
  }
}

Comlink.expose(new LogWorkerAPI());
