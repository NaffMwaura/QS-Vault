/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { queryClient } from "../lib/queryClient";

/* ======================================================
   INFRASTRUCTURE RESOLUTION
   Dynamically resolving the database to prevent build crashes.
   ====================================================== */
let syncEngine: any = null;
let db: any = null;

const resolveDatabase = async () => {
  try {
    const dbMod = await import("../lib/database/database");
    syncEngine = dbMod.syncEngine;
    db = dbMod.db;
  } catch (e) {
    console.warn("Sync Hook: Database node connection deferred.");
  }
};

resolveDatabase();

/**
 * useSync Hook (The QS Vault Heartbeat)
 * Optimized for performance to prevent UI "heaviness."
 */
export const useSync = () => {
  useEffect(() => {
    let isSyncing = false;
    let stabilityTimer: any = null;

    /** * VAULT PUSH ENGINE */
    const performVaultPush = async () => {
      if (isSyncing || !navigator.onLine || !db || !syncEngine) return;
      
      try {
        isSyncing = true;
        console.log("🔄 QS Vault: Synchronizing local ledger with cloud...");

        // 1. PURGE CORRUPTED NODES
        const brokenNodes = await db.sync_queue
          .filter((item: any) => !item.payload && item.operation !== 'DELETE')
          .toArray();
          
        if (brokenNodes.length > 0) {
          await Promise.all(brokenNodes.map((node: any) => db.sync_queue.delete(node.id!)));
        }
        
        // 2. PROCESS QUEUE
        if (typeof syncEngine.processQueue === 'function') {
          await syncEngine.processQueue();
        }
        
        // 3. UI STATE SYNC
        if (queryClient && typeof queryClient.resumePausedMutations === 'function') {
          await queryClient.resumePausedMutations();
        }
        
        // 4. PERFORMANCE FIX: Targeted Invalidation
        // Instead of refreshing the WHOLE app, we only refresh specific project data.
        if (queryClient) {
          queryClient.invalidateQueries({ queryKey: ['projects'] });
          queryClient.invalidateQueries({ queryKey: ['measurements'] });
        }
        
        console.log("✅ QS Vault: Ledger aligned.");
      } catch (error: unknown) {
        console.warn(`⚠️ QS Vault: Sync deferred.`);
      } finally {
        isSyncing = false;
      }
    };

    const handleOnlineNode = () => {
      if (stabilityTimer) clearTimeout(stabilityTimer);
      stabilityTimer = setTimeout(() => performVaultPush(), 2000);
    };

    const handleOfflineNode = () => {
      if (stabilityTimer) clearTimeout(stabilityTimer);
      console.log("🛡️ QS Vault: Offline Mode. Encryption active.");
    };

    window.addEventListener("online", handleOnlineNode);
    window.addEventListener("offline", handleOfflineNode);

    if (navigator.onLine) performVaultPush();

    const heartbeatInterval = setInterval(() => {
      if (navigator.onLine && !isSyncing) performVaultPush();
    }, 60000);

    return () => {
      window.removeEventListener("online", handleOnlineNode);
      window.removeEventListener("offline", handleOfflineNode);
      if (stabilityTimer) clearTimeout(stabilityTimer);
      clearInterval(heartbeatInterval);
    };
  }, []);
};