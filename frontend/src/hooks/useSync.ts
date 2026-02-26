import { useEffect } from "react";
// In your local environment, these relative paths are correct.
// We use safe imports to ensure compilation in the sandbox.
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
    // Flag to prevent overlapping sync processes during rapid network toggling
    let isSyncing = false;

    const performSync = async () => {
      // Guard: Don't sync if already in progress or if the device is definitely offline
      if (isSyncing || !navigator.onLine) return;
      
      try {
        isSyncing = true;
        console.log("🔄 QS Vault: Synchronizing local measurements with cloud...");
        
        // 1. Process the Dexie sync_queue (The primary vault upload)
        if (syncEngine && typeof syncEngine.processQueue === 'function') {
          await syncEngine.processQueue();
        }
        
        // 2. Resume any TanStack Query mutations that were paused while offline
        if (queryClient && typeof queryClient.resumePausedMutations === 'function') {
          await queryClient.resumePausedMutations();
        }
        
        // 3. Invalidate relevant queries to refresh UI with "Official" cloud data
        if (queryClient && typeof queryClient.invalidateQueries === 'function') {
          queryClient.invalidateQueries();
        }
        
        console.log("✅ QS Vault: Sync complete.");
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Connection reset";
        console.error(`❌ QS Vault: Sync failed - ${message}`);
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

    // Listen for browser-level network state changes
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Run an initial sync on mount if connectivity is already established
    if (navigator.onLine) {
      performSync();
    }

    // Periodic "Safety Sync" every 30 seconds to catch edge cases where 
    // network events might not have fired correctly.
    const interval = setInterval(() => {
      if (navigator.onLine) performSync();
    }, 30000);

    // Cleanup: Prevent memory leaks and redundant interval processing
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);
};