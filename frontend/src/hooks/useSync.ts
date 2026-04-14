/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { queryClient } from "../lib/queryClient";
import { syncEngine, db } from "../lib/database/database";

/**
 * useSync Hook (The QS Vault Heartbeat)
 * ------------------------------------
 * Monitors device connectivity and autonomously orchestrates the flow 
 * between the local Dexie wallet and the Supabase cloud registry.
 * * * Performance Node: Implements a "Stabilization Buffer" to prevent 
 * rapid-fire sync loops and flickering on unstable site signals.
 */

export const useSync = () => {
  useEffect(() => {
    // Operational Flag to prevent overlapping sync nodes
    let isSyncing = false;
    let stabilityTimer: any = null;

    /** * VAULT PUSH ENGINE
     * Orchestrates the movement of data from local to cloud.
     */
    const performVaultPush = async () => {
      // Guard: Ensure we are online and not already mid-handshake
      if (isSyncing || !navigator.onLine) return;
      
      try {
        isSyncing = true;
        console.log("🔄 QS Vault: Initiating autonomous vault push...");

        // 1. DATA INTEGRITY CHECK (Unblocks the 38-record stall)
        // Scans for and removes any 'ghost' records with null payloads
        if (db?.sync_queue) {
          const brokenNodes = await db.sync_queue.filter(item => !item.payload && item.operation !== 'DELETE').toArray();
          if (brokenNodes.length > 0) {
            console.warn(`🛡️ QS Vault: Detected ${brokenNodes.length} corrupted data nodes. Purging to unblock queue.`);
            await Promise.all(brokenNodes.map(node => db.sync_queue.delete(node.id!)));
          }
        }
        
        // 2. Process the Dexie sync_queue (Primary Site Data)
        if (syncEngine && typeof syncEngine.processQueue === 'function') {
          await syncEngine.processQueue();
        }
        
        // 3. Resume any TanStack Query mutations (UI state sync)
        if (queryClient && typeof queryClient.resumePausedMutations === 'function') {
          await queryClient.resumePausedMutations();
        }
        
        // 4. Refresh local cache with official cloud nodes
        if (queryClient && typeof queryClient.invalidateQueries === 'function') {
          queryClient.invalidateQueries();
        }
        
        console.log("✅ QS Vault: Infrastructure synchronized.");
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Handshake Reset";
        console.warn(`⚠️ QS Vault: Sync Node Deferred - ${message}`);
      } finally {
        isSyncing = false;
      }
    };

    const handleOnlineNode = () => {
      console.log("🌐 QS Vault: Signal detected. Waiting for connection stability...");
      
      // STABILITY HANDSHAKE:
      // Wait 1.5s to ensure the signal isn't "flickering" before pushing data.
      if (stabilityTimer) clearTimeout(stabilityTimer);
      stabilityTimer = setTimeout(() => {
        performVaultPush();
      }, 1500);
    };

    const handleOfflineNode = () => {
      if (stabilityTimer) clearTimeout(stabilityTimer);
      console.log("🛡️ QS Vault: Offline Mode. All site data being saved to local encrypted ledger.");
    };

    // Browser-Level Infrastructure Listeners
    window.addEventListener("online", handleOnlineNode);
    window.addEventListener("offline", handleOfflineNode);

    // Initial Handshake on mount
    if (navigator.onLine) {
      performVaultPush();
    }

    // "Safety Heartbeat": Periodic check every 60 seconds
    const heartbeatInterval = setInterval(() => {
      if (navigator.onLine && !isSyncing) performVaultPush();
    }, 60000);

    // CLEANUP PROTOCOL
    return () => {
      window.removeEventListener("online", handleOnlineNode);
      window.removeEventListener("offline", handleOfflineNode);
      if (stabilityTimer) clearTimeout(stabilityTimer);
      clearInterval(heartbeatInterval);
    };
  }, []);
};