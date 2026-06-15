import { Upload } from "lucide-react";
import { FileUploader } from "@/components/upload/FileUploader";

export function UploadPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.15)]">
          <Upload className="h-5 w-5 text-[hsl(var(--primary))]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">
            Upload Logs
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Upload a JSON, CSV, or plain-text log file to begin analysis
          </p>
        </div>
      </div>

      <FileUploader />

      {/* Format guide */}
      <div className="mt-8 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <p className="mb-3 text-sm font-semibold text-[hsl(var(--foreground))]">
          Supported formats
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              fmt: "JSON / NDJSON",
              desc: "Auto-detects level, message, timestamp fields",
            },
            { fmt: "CSV", desc: "Header row required. Columns auto-mapped." },
            {
              fmt: "Plain text",
              desc: "Log4j, Nginx/Apache, Syslog, or generic [LEVEL] patterns",
            },
          ].map(({ fmt, desc }) => (
            <div key={fmt} className="rounded-md bg-[hsl(var(--muted))] p-3">
              <p className="text-xs font-semibold text-[hsl(var(--foreground))]">
                {fmt}
              </p>
              <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
