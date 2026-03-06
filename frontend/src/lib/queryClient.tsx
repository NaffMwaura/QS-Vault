import { QueryClient } from "@tanstack/react-query";

/**
 * Global QueryClient instance for TanStack Query.
 * Specialized for the QS Vault to handle high-precision measurements
 * and unreliable on-site network conditions.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes. 
      // Higher staleTime prevents unnecessary background noise during on-site measurement.
      staleTime: 1000 * 60 * 5,
      
      // Only retry once. If the initial sync fails, we let the useSync heartbeat
      // handle the reconnection attempt to save device battery and bandwidth.
      retry: 1,
      
      // Cache management: Keep data available for 24 hours even if unused.
      gcTime: 1000 * 60 * 60 * 24,

      // UI Stability: Disable refetching when the user switches tabs.
      // Crucial for QS: Prevents the BoQ from refreshing while a user is mid-takeoff.
      refetchOnWindowFocus: false,

      // Offline Integrity: Always try to use the cache if the network is down.
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Retries for Writes: 2 attempts before pausing.
      retry: 2,

      // CRITICAL for the Vault: If a user clicks 'Initialize Project' while offline,
      // 'offlineFirst' ensures the mutation is queued/paused rather than throwing an error.
      networkMode: 'offlineFirst',
    },
  },
});