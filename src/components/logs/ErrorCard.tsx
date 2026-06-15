import { AlertTriangle, AlertCircle, Info, ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { sanitize } from "@/utils/sanitize";
import { formatTimestamp, formatCount } from "@/utils/format";
import type { ErrorGroup } from "@/types/analysis.types";
import type { RuleMatch } from "@/types/rules.types";

interface Props {
  group: ErrorGroup;
  ruleMatches?: RuleMatch[];
}

const SEVERITY_ICON = {
  critical: <AlertCircle className="h-4 w-4 text-fuchsia-400" />,
  high: <AlertTriangle className="h-4 w-4 text-red-400" />,
  medium: <AlertTriangle className="h-4 w-4 text-amber-400" />,
  low: <Info className="h-4 w-4 text-cyan-400" />,
};

export function ErrorCard({ group, ruleMatches = [] }: Props) {
  // Find rules that matched a sample log in this group
  const matchingRules = ruleMatches.filter((m) =>
    group.samples.some((s) => s.id === m.matchedLog?.id),
  );

  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[hsl(var(--foreground))] break-all leading-snug">
            {sanitize(group.message)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="error" className="text-xs">
              {formatCount(group.count)}{" "}
              {group.count === 1 ? "occurrence" : "occurrences"}
            </Badge>
            {group.services.map((s) => (
              <Badge key={s} variant="secondary" className="text-xs">
                {s}
              </Badge>
            ))}
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              {formatTimestamp(group.firstSeen)} →{" "}
              {formatTimestamp(group.lastSeen)}
            </span>
          </div>
        </div>
      </div>

      {/* Rule suggestions */}
      {matchingRules.length > 0 && (
        <div className="mx-4 mb-3 rounded-md border border-amber-800/40 bg-amber-950/30 px-3 py-2">
          {matchingRules.map((m) => (
            <div key={m.rule.id} className="flex items-start gap-2">
              {SEVERITY_ICON[m.rule.severity]}
              <div>
                <p className="text-xs font-semibold text-amber-300">
                  {m.rule.name}
                </p>
                <p className="text-xs text-amber-200/80">{m.suggestion}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sample logs accordion */}
      <Accordion type="single" collapsible>
        <AccordionItem value="samples" className="border-none">
          <AccordionTrigger className="px-4 py-2 text-xs text-[hsl(var(--muted-foreground))] hover:no-underline">
            <span className="flex items-center gap-1">
              <ChevronDown className="h-3 w-3" />
              Show sample logs ({group.samples.length})
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3">
            <div className="space-y-2">
              {group.samples.map((log) => (
                <div
                  key={log.id}
                  className="rounded-md bg-[hsl(var(--muted))] p-2 font-mono text-xs text-[hsl(var(--muted-foreground))] break-all"
                >
                  <span className="text-[hsl(var(--primary))]">
                    {formatTimestamp(log.timestamp)}
                  </span>{" "}
                  [{sanitize(log.service)}] {sanitize(log.message)}
                  {log.stackTrace && (
                    <pre className="mt-1 text-red-400 whitespace-pre-wrap text-xs">
                      {sanitize(log.stackTrace)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
