import { reconcilePending } from "./lib/orders";

// Tâches périodiques légères (en production : worker BullMQ dédié, cf. cahier des charges §4).
export function startJobs() {
  const g = globalThis as unknown as { __cviaTimer?: NodeJS.Timeout };
  if (g.__cviaTimer) return;
  g.__cviaTimer = setInterval(() => { reconcilePending().catch(() => undefined); }, 5 * 60_000);
}
