import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface SavedSession {
  id: string;
  name: string;
  fileName: string;
  savedAt: number;
  logCount: number;
  errorCount: number;
}

interface SessionStore {
  sessions: SavedSession[];
  addSession: (session: SavedSession) => void;
  removeSession: (id: string) => void;
  clearSessions: () => void;
}

export const useSessionStore = create<SessionStore>()(
  devtools(
    persist(
      (set) => ({
        sessions: [],
        addSession: (session) =>
          set((state) => ({
            sessions: [session, ...state.sessions].slice(0, 20), // max 20
          })),
        removeSession: (id) =>
          set((state) => ({
            sessions: state.sessions.filter((s) => s.id !== id),
          })),
        clearSessions: () => set({ sessions: [] }),
      }),
      { name: "log-dashboard-sessions" },
    ),
    { name: "SessionStore" },
  ),
);
