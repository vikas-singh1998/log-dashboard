import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, AlertCircle, Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLogStore } from "@/store/useLogStore";
import { parseFile, detectFormat } from "@/core/parser/index";
import { analyze } from "@/core/analyzer/index";
import { runRuleEngine } from "@/core/rules/index";
import { generateDemoLogs } from "@/utils/demoLogs";
import { formatFileSize } from "@/utils/format";

const MAX_SIZE_WARN = 50 * 1024 * 1024; // 50 MB
const MAX_SIZE_BLOCK = 200 * 1024 * 1024; // 200 MB

const VALID_EXTENSIONS = new Set([".log", ".txt", ".json", ".csv", ".ndjson"]);

export function FileUploader() {
  const { setLogsFromWorker } = useLogStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const process = useCallback(
    async (content: string, name: string, size: number) => {
      setLoading(true);
      setUploadError(null);
      setFileName(name);
      setFileSize(size);

      if (size > MAX_SIZE_BLOCK) {
        setUploadError(`File too large (${formatFileSize(size)}). Max 200 MB.`);
        setLoading(false);
        return;
      }

      try {
        // Parse + analyze on the main thread (same approach as DiffViewer)
        const format = detectFormat(name, content.slice(0, 500));
        const { logs: parsedLogs, errors: parseErrors } = parseFile(
          content,
          format,
        );

        if (parsedLogs.length === 0) {
          setUploadError(
            "No log entries could be parsed. Check the file format — supported: JSON/NDJSON, CSV with headers, plain text (Log4j, Nginx, Apache, Syslog).",
          );
          setLoading(false);
          return;
        }

        const analysis = analyze(parsedLogs);
        const ruleMatches = runRuleEngine(parsedLogs, analysis);

        setLogsFromWorker(parsedLogs, analysis, ruleMatches, parseErrors, name);
        navigate("/dashboard");
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : "Failed to process file.",
        );
      } finally {
        setLoading(false);
      }
    },
    [setLogsFromWorker, navigate],
  );

  const onDrop = useCallback(
    (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;

      const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
      if (!VALID_EXTENSIONS.has(ext)) {
        setUploadError(
          `Unsupported file type "${ext}". Accepted: .log .txt .json .csv .ndjson`,
        );
        return;
      }

      if (file.size > MAX_SIZE_BLOCK) {
        setUploadError(
          `File too large (${formatFileSize(file.size)}). Max 200 MB.`,
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        process(content, file.name, file.size);
      };
      reader.onerror = () => setUploadError("Could not read file.");
      reader.readAsText(file);
    },
    [process],
  );

  const loadDemo = useCallback(() => {
    const content = generateDemoLogs(500);
    process(content, "demo-logs.ndjson", content.length);
  }, [process]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled: loading,
  });

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors",
          isDragActive
            ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)_/_0.08)]"
            : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary)_/_0.5)] hover:bg-[hsl(var(--accent))]",
          loading && "pointer-events-none opacity-60",
        )}
      >
        <input {...getInputProps()} />
        {loading ? (
          <Loader2 className="h-10 w-10 animate-spin text-[hsl(var(--primary))]" />
        ) : (
          <Upload className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />
        )}
        <p className="mt-3 text-base font-medium text-[hsl(var(--foreground))]">
          {loading
            ? "Processing logs…"
            : isDragActive
              ? "Drop it!"
              : "Drop your log file here"}
        </p>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Supports .json, .ndjson, .csv, .log, .txt — up to 200 MB
        </p>
        {!loading && (
          <Button variant="outline" size="sm" className="mt-4">
            Browse files
          </Button>
        )}
      </div>

      {/* File info */}
      {fileName && !loading && !uploadError && (
        <div className="flex items-center gap-2 rounded-md border border-[hsl(var(--border))] px-3 py-2">
          <FileText className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <span className="text-sm text-[hsl(var(--foreground))]">
            {fileName}
          </span>
          {fileSize > MAX_SIZE_WARN && (
            <span className="ml-auto text-xs text-amber-400">
              Large file ({formatFileSize(fileSize)}) — may be slow
            </span>
          )}
        </div>
      )}

      {/* Error */}
      {uploadError && (
        <div className="flex items-start gap-2 rounded-md bg-red-950 px-3 py-2 text-sm text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Demo */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[hsl(var(--border))]" />
        <span className="text-xs text-[hsl(var(--muted-foreground))]">or</span>
        <div className="h-px flex-1 bg-[hsl(var(--border))]" />
      </div>
      <Button
        variant="secondary"
        className="w-full gap-2"
        onClick={loadDemo}
        disabled={loading}
      >
        <Zap className="h-4 w-4" />
        Load demo logs (500 synthetic entries)
      </Button>
    </div>
  );
}
