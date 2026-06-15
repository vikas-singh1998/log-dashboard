import { GitCompare } from "lucide-react";
import { DiffViewer } from "@/components/diff/DiffViewer";

export function DiffPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.15)]">
          <GitCompare className="h-5 w-5 text-[hsl(var(--primary))]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">
            Log Diff
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Compare two log files — before vs after deploy, or across time
            windows
          </p>
        </div>
      </div>

      <DiffViewer />
    </div>
  );
}
