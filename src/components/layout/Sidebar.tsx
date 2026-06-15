import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Upload,
  AlertCircle,
  GitCompare,
  Database,
  X,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLogStore } from "@/store/useLogStore";
import { Separator } from "@/components/ui/separator";
import { formatTimestamp } from "@/utils/format";

const NAV_ITEMS = [
  { to: "/upload", icon: Upload, label: "Upload Logs" },
  { to: "/dashboard", icon: BarChart3, label: "Dashboard" },
  { to: "/errors", icon: AlertCircle, label: "Error Explorer" },
  { to: "/diff", icon: GitCompare, label: "Log Diff" },
];

export function Sidebar() {
  const sessions = useLogStore((s) => s.sessions);
  const activeSessionId = useLogStore((s) => s.activeSessionId);
  const switchToSession = useLogStore((s) => s.switchToSession);
  const removeSessionById = useLogStore((s) => s.removeSessionById);
  const navigate = useNavigate();

  const handleSwitch = (id: string) => {
    if (id === activeSessionId) return;
    switchToSession(id);
    navigate("/dashboard");
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const wasActive = id === activeSessionId;
    const remaining = sessions.filter((s) => s.id !== id);
    removeSessionById(id);
    if (wasActive) {
      if (remaining.length > 0) {
        navigate("/dashboard");
      } else {
        navigate("/upload");
      }
    }
  };

  return (
    <aside
      style={{ width: "240px", minWidth: "240px" }}
      className="flex h-full flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--muted))]"
    >
      {/* Logo */}
      <div className="flex shrink-0 items-center gap-2 px-4 py-4">
        <Database className="h-5 w-5 text-[hsl(var(--primary))]" />
        <span className="text-sm font-bold tracking-wide text-[hsl(var(--foreground))]">
          LogIQ
        </span>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex shrink-0 flex-col gap-1 px-2 py-3">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                  : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]",
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <Separator />

      {/* Sessions list */}
      <div className="flex min-h-0 flex-1 flex-col px-3 py-3">
        <div className="mb-2 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Sessions
            {sessions.length > 0 && (
              <span className="ml-1.5 rounded-full bg-[hsl(var(--accent))] px-1.5 py-0.5 text-[10px] font-bold text-[hsl(var(--foreground))]">
                {sessions.length}
              </span>
            )}
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
            <FileText className="h-7 w-7 text-[hsl(var(--border))]" />
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              No sessions yet.
              <br />
              Upload a log file to begin.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-1">
              {sessions.map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <div
                    key={session.id}
                    onClick={() => handleSwitch(session.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSwitch(session.id)
                    }
                    aria-label={`Switch to session ${session.fileName}`}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-md px-2 py-2 transition-all",
                      isActive
                        ? "cursor-default rounded-md border border-[hsl(var(--primary))] bg-[hsl(var(--primary))] bg-opacity-10"
                        : "cursor-pointer rounded-md border border-transparent opacity-60 hover:border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] hover:opacity-100",
                    )}
                  >
                    <div className="mt-1.5 shrink-0">
                      <div
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          isActive
                            ? "bg-[hsl(var(--primary))]"
                            : "bg-[hsl(var(--border))]",
                        )}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "truncate text-xs font-medium",
                          isActive
                            ? "text-[hsl(var(--foreground))]"
                            : "text-[hsl(var(--muted-foreground))]",
                        )}
                        title={session.fileName}
                      >
                        {session.fileName}
                      </p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                        {session.analysis.totalCount.toLocaleString()} logs
                      </p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                        {formatTimestamp(session.loadedAt)}
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleRemove(e, session.id)}
                      className="mt-0.5 shrink-0 rounded p-1 text-slate-400 transition-colors hover:bg-red-900 hover:text-red-300"
                      aria-label={`Remove session ${session.fileName}`}
                      title="Remove session"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
