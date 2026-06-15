import { Download, FileJson, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogStore } from "@/store/useLogStore";
import { exportJSON, exportCSV } from "@/utils/export";

export function Header() {
  const { analysis, ruleMatches, activeSession } = useLogStore();

  const handleExportJSON = () => {
    if (!analysis) return;
    exportJSON(
      analysis,
      ruleMatches,
      activeSession?.fileName ?? "log-analysis",
    );
  };

  const handleExportCSV = () => {
    if (!analysis) return;
    exportCSV(analysis, activeSession?.fileName ?? "top-errors");
  };

  return (
    <header className="flex h-12 items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
          Log Intelligence Dashboard
        </span>
        {activeSession && (
          <span className="rounded-full bg-[hsl(var(--primary)/0.15)] px-2 py-0.5 text-xs text-[hsl(var(--primary))]">
            {activeSession.fileName}
          </span>
        )}
      </div>

      {analysis && analysis.totalCount > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Export Format</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExportJSON} className="gap-2">
              <FileJson className="h-4 w-4" />
              Analysis JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportCSV} className="gap-2">
              <FileText className="h-4 w-4" />
              Top Errors CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
