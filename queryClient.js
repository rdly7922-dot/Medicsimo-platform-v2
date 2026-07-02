/**
 * queryClient.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Configured React Query (TanStack Query v5) client.
 *
 * Strategy: offline-first with optimistic UI
 * ─────────────────────────────────────────────────────────────────────────────
 * • staleTime 3 min  — data considered fresh for 3 min; no network trip during
 *   normal in-clinic use (secretary clicking between views).
 * • gcTime 10 min    — keep unused cache 10 min so navigating back is instant.
 * • retry 2          — on network error retry twice before showing error state.
 * • networkMode: "offlineFirst"
 *                    — queries run against cache even when offline; they queue
 *                      and replay when the connection returns.
 * • onError          — global toast-ready error handler (wired in Phase 4).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:    1000 * 60 * 3,   // 3 minutes
      gcTime:       1000 * 60 * 10,  // 10 minutes
      retry:        2,
      retryDelay:   (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      networkMode:  "offlineFirst",
      refetchOnWindowFocus: false,   // clinic PCs don't need constant refetch
    },
    mutations: {
      networkMode: "offlineFirst",
      retry:       1,
    },
  },
});
