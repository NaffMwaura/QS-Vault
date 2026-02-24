import Dexie, { type Table } from "dexie";
import { createClient } from "@supabase/supabase-js";

// --- 1. CLOUD CONFIGURATION ---

const getSupabaseConfig = () => {
  // Fix: Vite uses import.meta.env to access .env variables
  return {
    url: import.meta.env.VITE_SUPABASE_URL || "",
    key: import.meta.env.VITE_SUPABASE_ANON_KEY || ""
  };
};

const config = getSupabaseConfig();

// Professional Guard: Ensure the app doesn't crash if env vars are missing
if (!config.url || !config.key) {
  console.error(
    "Sync Engine Error: Supabase URL or Key is missing. " +
    "Check your .env file and ensure variables start with VITE_"
  );
}

export const supabase = createClient(
  config.url || "https://placeholder.supabase.co",
  config.key || "placeholder"
);

// --- 2. DATABASE INTERFACES ---
export interface Project {
  id: string; 
  user_id: string;
  name: string;
  location: string;
  client_name: string;
  status: 'active' | 'completed' | 'archived';
  updated_at: string;
}

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface Measurement {
  id: string;
  project_id: string;
  boq_item_id: string;
  value: number;
  label?: string;
  points?: CanvasPoint[]; 
  updated_at: string;
}

export interface SyncQueueItem {
  id?: number;
  table: 'projects' | 'measurements';
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: Partial<Project> | Partial<Measurement> | Record<string, unknown>;
  created_at: number;
}

// --- 3. DEXIE LOCAL STORAGE ---
class QSPocketKnifeDB extends Dexie {
  projects!: Table<Project, string>;
  measurements!: Table<Measurement, string>;
  sync_queue!: Table<SyncQueueItem, number>;

  constructor() {
    super("QSPocketKnifeDB");
    
    this.version(1).stores({
      projects: "id, user_id, updated_at",
      measurements: "id, project_id, boq_item_id",
      sync_queue: "++id, table, operation, created_at"
    });
  }
}

export const db = new QSPocketKnifeDB();

// --- 4. SYNC ENGINE ---
export const syncEngine = {
  processQueue: async () => {
    const queue = await db.sync_queue.toArray();
    if (queue.length === 0) return;

    console.log(`[SyncEngine] Processing ${queue.length} items...`);

    for (const item of queue) {
      try {
        let error;

        if (item.operation === 'INSERT' || item.operation === 'UPDATE') {
          const { error: upsertError } = await supabase
            .from(item.table)
            .upsert(item.payload);
          error = upsertError;
        } else if (item.operation === 'DELETE') {
          const payloadId = (item.payload as { id?: string }).id;
          if (payloadId) {
            const { error: deleteError } = await supabase
              .from(item.table)
              .delete()
              .eq('id', payloadId);
            error = deleteError;
          }
        }

        if (!error) {
          await db.sync_queue.delete(item.id!);
        } else {
          console.error(`[SyncEngine] Supabase error for ${item.table}:`, error.message);
        }
      } catch (err) {
        console.error(`[SyncEngine] Network failure during sync:`, err);
        break; 
      }
    }
  }
};