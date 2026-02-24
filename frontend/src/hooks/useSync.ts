import { useEffect } from "react";
import { queryClient } from "../lib/queryClient";
import { syncEngine } from "../lib/database/database";

/**
 * useSync Hook
 * * This hook acts as the "Heartbeat" of the QS Vault. It monitors the device's 
 * connection status and orchestrates the flow of data between the local 
 * Dexie wallet and the Supabase cloud vault.
 */
export const useSync = () => {
  useEffect(() => {
    // Flag to prevent overlapping sync processes
    let isSyncing = false;

    const performSync = async () => {
      if (isSyncing || !navigator.onLine) return;
      
      try {
        isSyncing = true;
        console.log("🔄 QS Vault: Synchronizing local measurements with cloud...");
        
        // Process the Dexie sync_queue
        await syncEngine.processQueue();
        
        // Resume any TanStack Query mutations that were paused while offline
        await queryClient.resumePausedMutations();
        
        // Invalidate relevant queries to refresh UI with "Official" cloud data
        queryClient.invalidateQueries();
        
        console.log("✅ QS Vault: Sync complete.");
      } catch (error) {
        console.error("❌ QS Vault: Sync failed.", error);
      } finally {
        isSyncing = false;
      }
    };

    const handleOnline = () => {
      performSync();
    };

    const handleOffline = () => {
      console.log("⚠️ QS Vault: Device is offline. All data will be saved to local Dexie vault.");
    };

    // Listen for network state changes
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Run initial sync on mount if online
    if (navigator.onLine) {
      performSync();
    }

    // Optional: Periodic sync every 30 seconds to catch edge cases
    const interval = setInterval(() => {
      if (navigator.onLine) performSync();
    }, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);
};