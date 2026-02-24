import { QueryClient } from "@tanstack/react-query";
/**
 * Global QueryClient instance for TanStack Query.
 * Configured with default stale times and retries suitable for a QS application
 * that handles both real-time sync and offline-first data.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered stale after 5 minutes
      staleTime: 1000 * 60 * 5,
      // Only retry once to avoid infinite loops during offline transitions
      retry: 1,
      // Ensure data stays in cache even when offline
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
    mutations: {
      // Configuration for offline mutation support can be added here
      retry: 2,
    },
  },
});