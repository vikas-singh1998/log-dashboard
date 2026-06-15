import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { LogTable } from "@/components/logs/LogTable";
import { ErrorCard } from "@/components/logs/ErrorCard";
import { SearchBar } from "@/components/logs/SearchBar";
import { FilterPanel } from "@/components/logs/FilterPanel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLogStore } from "@/store/useLogStore";
import { useSearch } from "@/hooks/useSearch";
import { formatCount } from "@/utils/format";

export function ErrorExplorerPage() {
  const { filteredLogs, analysis, ruleMatches } = useLogStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!analysis || analysis.totalCount === 0) navigate("/upload");
  }, [analysis, navigate]);

  const { query, setQuery, results } = useSearch(filteredLogs);

  const errorGroups = analysis?.errorGroups ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-950/40">
          <AlertCircle className="h-5 w-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">
            Error Explorer
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {formatCount(filteredLogs.length)} logs ·{" "}
            {formatCount(errorGroups.length)} unique error groups
          </p>
        </div>
      </div>

      {/* Search + filters */}
      <div className="space-y-2">
        <SearchBar query={query} onChange={setQuery} />
        <FilterPanel />
      </div>

      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">
            All Logs ({formatCount(results.length)})
          </TabsTrigger>
          <TabsTrigger value="groups">
            Error Groups ({formatCount(errorGroups.length)})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-3">
          <LogTable logs={results} height={560} />
        </TabsContent>

        <TabsContent value="groups" className="mt-3 space-y-3">
          {errorGroups.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
              No error groups found
            </div>
          ) : (
            errorGroups
              .slice(0, 50)
              .map((group) => (
                <ErrorCard
                  key={group.key}
                  group={group}
                  ruleMatches={ruleMatches}
                />
              ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
