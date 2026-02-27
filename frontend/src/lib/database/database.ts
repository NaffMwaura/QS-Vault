import { Dexie, type Table } from "dexie";
import { createClient } from "@supabase/supabase-js";

/** --- 1. CLOUD CONFIGURATION --- **/

interface ViteEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

const getEnvVar = (key: keyof ViteEnv): string => {
  try {
    // Resolve environment variables with strict typing for Vite/Sandbox
    const env = (import.meta as unknown as { env: ViteEnv }).env;
    return env[key] || "";
  } catch {
    return "";
  }
};

const supabaseUrl = getEnvVar("VITE_SUPABASE_URL");
const supabaseAnonKey = getEnvVar("VITE_SUPABASE_ANON_KEY");

// Initialize the Supabase Client
export const supabase = createClient(
  supabaseUrl || "https://placeholder-id.supabase.co",
  supabaseAnonKey || "placeholder-key"
);

/** --- 2. DATABASE INTERFACES --- **/

export type UserRole = 'user' | 'editor' | 'admin' | 'super-admin';

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  updated_at: string;
}

export interface Project {
  id: string; 
  user_id: string;
  name: string;
  location: string | null;
  client_name: string | null;
  contract_sum: number;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
  synced_at?: string;
}

export interface BillItem {
  id: string;
  project_id: string;
  item_code: string | null;
  description: string;
  unit: 'm3' | 'm2' | 'm' | 'nr' | 'kg' | 't';
  rate: number;
  quantity: number;
  amount?: number; 
  created_at: string;
  updated_at: string;
}

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface Measurement {
  id: string;
  project_id: string;
  bill_item_id: string | null;
  label: string | null;
  value: number;
  unit: string;
  points: CanvasPoint[] | null; 
  created_at: string;
  updated_at: string;
}

export interface SyncQueueItem {
  id?: number;
  table: 'projects' | 'bill_items' | 'measurements' | 'profiles';
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  record_id: string;
  payload: Record<string, unknown>;
  created_at: number;
}

/** --- 3. DEXIE LOCAL STORAGE (The Device Vault) --- **/

/**
 * QSPocketKnifeDB
 * Corrected: Removed manual 'version' property which was shadowing the method.
 * Inheritance from Dexie is now properly handled.
 */
class QSPocketKnifeDB extends Dexie {
  profiles!: Table<Profile, string>;
  projects!: Table<Project, string>;
  bill_items!: Table<BillItem, string>;
  measurements!: Table<Measurement, string>;
  sync_queue!: Table<SyncQueueItem, number>;

  constructor() {
    super("QSPocketKnifeDB");
    
    // Explicitly using the Dexie instance versioning logic
    this.version(1).stores({
      profiles: "id, username, role",
      projects: "id, user_id, updated_at",
      bill_items: "id, project_id, item_code",
      measurements: "id, project_id, bill_item_id",
      sync_queue: "++id, table, operation, record_id, created_at"
    });
  }
}

// Global instance of the local database
export const db = new QSPocketKnifeDB();

/** --- 4. SYNC ENGINE (Heartbeat Logic) --- **/

export const syncEngine = {
  processQueue: async () => {
    const queue = await db.sync_queue.orderBy('id').toArray();
    if (queue.length === 0) return;

    for (const item of queue) {
      try {
        let error = null;

        if (item.operation === 'INSERT' || item.operation === 'UPDATE') {
          // Destructure to prevent trying to write to generated Supabase columns
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { amount: _amount, ...cleanPayload } = item.payload;

          const { error: upsertError } = await supabase
            .from(item.table)
            .upsert(cleanPayload, { onConflict: 'id' });
          
          error = upsertError;
        } else if (item.operation === 'DELETE') {
          const { error: deleteError } = await supabase
            .from(item.table)
            .delete()
            .eq('id', item.record_id);
          error = deleteError;
        }

        if (!error) {
          // Clean up the local queue
          await db.sync_queue.delete(item.id!);
          
          // Identify the correct Dexie table to update synced timestamp
          const tableKey = item.table as keyof QSPocketKnifeDB;
          const targetTable = db[tableKey];
          
          if (targetTable && typeof targetTable === 'object' && 'update' in targetTable) {
            // @ts-expect-error - Dynamic lookup for offline sync status update
            await targetTable.update(item.record_id, { synced_at: new Date().toISOString() });
          }
        } else {
          console.error(`[SyncEngine] Supabase error for ${item.table}:`, error.message);
          break;
        }
      } catch (err) {
        console.error(`[SyncEngine] Sync Handshake Failure:`, err);
        break; 
      }
    }
  },

  queueChange: async (
    table: 'projects' | 'bill_items' | 'measurements' | 'profiles', 
    id: string, 
    op: 'INSERT' | 'UPDATE' | 'DELETE', 
    data: Record<string, unknown>
  ) => {
    await db.sync_queue.add({
      table,
      record_id: id,
      operation: op,
      payload: data,
      created_at: Date.now()
    });
    
    if (navigator.onLine) {
      syncEngine.processQueue();
    }
  }
};

/** --- 5. ADMIN SERVICE --- **/

export const adminService = {
  getGlobalStats: async () => {
    // Exact headcount HEAD queries for global dashboard overview
    const { count: u } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: p } = await supabase.from('projects').select('*', { count: 'exact', head: true });
    const { count: m } = await supabase.from('measurements').select('*', { count: 'exact', head: true });
    
    return {
      totalUsers: u || 0,
      totalProjects: p || 0,
      totalMeasurements: m || 0,
      systemHealth: 'Optimal'
    };
  },
  
  getAllProfiles: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data as Profile[];
  },

  updateRole: async (userId: string, newRole: UserRole) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);
    
    if (error) throw error;
  }
};