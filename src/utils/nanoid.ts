// Tiny nanoid replacement — no external dep needed in worker context
export function nanoid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
