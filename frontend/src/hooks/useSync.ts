/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import { queryClient } from "../lib/queryClient";

/* ======================================================
   INFRASTRUCTURE RESOLUTION
   Dynamically resolving the database to prevent build crashes.
   ====================================================== */
let syncEngine: any = null;
let db: any = null;
let dbReady = false;

const resolveDatabase = async () => {
  if (dbReady) return;
  try {
    const dbMod = await import("../lib/database/database");
    syncEngine = dbMod.syncEngine;
    db = dbMod.db;
    dbReady = true;
  } catch (e) {
    console.warn("Sync Hook: Database node connection deferred.");
    // Retry after delay
    setTimeout(resolveDatabase, 5000);
  }
};

resolveDatabase();

/**
 * useSync Hook (The QS Vault Heartbeat) - OPTIMIZED
 * Smart syncing that only processes when needed, targets specific queries,
 * and prevents excessive network churn.
 */
export const useSync = () => {
  const isSyncingRef = useRef(false);
  const lastSyncTimeRef = useRef<number>(0);
  const MIN_SYNC_INTERVAL = 30000; // Minimum 30 seconds between syncs to prevent churn

  useEffect(() => {
    let stabilityTimer: any = null;
    let heartbeatInterval: any = null;

    /** * OPTIMIZED VAULT PUSH ENGINE */
    const performVaultPush = async () => {
      if (isSyncingRef.current || !navigator.onLine || !db || !syncEngine) return;
      
      // Rate limiting: don't sync more frequently than MIN_SYNC_INTERVAL
      const now = Date.now();
      if (now - lastSyncTimeRef.current < MIN_SYNC_INTERVAL) {
        return;
      }
      
      try {
        isSyncingRef.current = true;
        lastSyncTimeRef.current = now;

        // OPTIMIZATION 1: Check if there's actually work to do
        const queueLength = await db.sync_queue.count();
        if (queueLength === 0) {
          console.log("📊 QS Vault: No pending changes. Sync skipped.");
          isSyncingRef.current = false;
          return;
        }

        console.log(`🔄 QS Vault: Synchronizing ${queueLength} pending changes...`);

        // OPTIMIZATION 2: PURGE CORRUPTED NODES with better error handling
        try {
          const brokenNodes = await db.sync_queue
            .filter((item: any) => !item.payload && item.operation !== 'DELETE')
            .toArray();
            
          if (brokenNodes.length > 0) {
            await Promise.all(brokenNodes.map((node: any) => db.sync_queue.delete(node.id!)));
            console.log(`🧹 Cleaned ${brokenNodes.length} corrupted nodes`);
          }
        } catch (err) {
          console.warn("⚠️ Cleanup error:", err);
        }
        
        // OPTIMIZATION 3: PROCESS QUEUE with error recovery
        try {
          if (typeof syncEngine.processQueue === 'function') {
            await syncEngine.processQueue();
          }
        } catch (err) {
          console.warn("⚠️ Queue processing error:", err);
        }
        
        // OPTIMIZATION 4: Resume paused mutations
        try {
          if (queryClient && typeof queryClient.resumePausedMutations === 'function') {
            await queryClient.resumePausedMutations();
          }
        } catch (err) {
          console.warn("⚠️ Mutation resume error:", err);
        }
        
        // OPTIMIZATION 5: TARGETED INVALIDATION (instead of blanket refresh)
        // Only invalidate if there were actual changes
        const remainingQueue = await db.sync_queue.count();
        if (remainingQueue === 0 && queryClient) {
          // Only invalidate if sync actually processed items
          queryClient.invalidateQueries({ 
            queryKey: ['projects'],
            exact: true 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['measurements'],
            exact: true 
          });
          console.log("✅ QS Vault: Ledger aligned.");
        }
      } catch (error: unknown) {
        console.warn(`⚠️ QS Vault: Sync error - ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        isSyncingRef.current = false;
      }
    };

    // OPTIMIZATION 6: Only sync when coming online (debounced)
    const handleOnlineNode = () => {
      if (stabilityTimer) clearTimeout(stabilityTimer);
      // Debounce: wait 2 seconds to ensure connection is stable
      stabilityTimer = setTimeout(() => performVaultPush(), 2000);
    };

    const handleOfflineNode = () => {
      if (stabilityTimer) clearTimeout(stabilityTimer);
      console.log("🛡️ QS Vault: Offline Mode. Changes queued locally.");
    };

    // OPTIMIZATION 7: Listen to online/offline events for reactive syncing
    window.addEventListener("online", handleOnlineNode);
    window.addEventListener("offline", handleOfflineNode);

    // Initial sync if online
    if (navigator.onLine) {
      performVaultPush();
    }

    // OPTIMIZATION 8: Configurable heartbeat interval (60s) with queue check
    // Only processes if there's work to do
    heartbeatInterval = setInterval(() => {
      if (navigator.onLine && !isSyncingRef.current) {
        performVaultPush();
      }
    }, 60000);

    return () => {
      window.removeEventListener("online", handleOnlineNode);
      window.removeEventListener("offline", handleOfflineNode);
      if (stabilityTimer) clearTimeout(stabilityTimer);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, []);
};