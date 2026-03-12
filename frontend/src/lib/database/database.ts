/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dexie, type Table } from "dexie";
import { createClient } from "@supabase/supabase-js";

/** --- 1. CLOUD CONFIGURATION --- **/

const getEnv = (key: string) => {
  try {
    return import.meta.env[key] || "";
  } catch {
    return "";
  }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
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
  project_count?: number; 
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
  username?: string; 
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
  type: 'length' | 'area' | 'count';
  value: number;
  unit: string;
  sectionCode: string; // Added to support SMM Work Section filtering
  points: CanvasPoint[] | null; 
  created_at: string;
  updated_at: string;
  timestamp: string; // Used for "Recent Audit Entries" on dashboard
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

class QSPocketKnifeDB extends Dexie {
  profiles!: Table<Profile, string>;
  projects!: Table<Project, string>;
  bill_items!: Table<BillItem, string>;
  measurements!: Table<Measurement, string>;
  sync_queue!: Table<SyncQueueItem, number>;

  constructor() {
    super("QSPocketKnifeDB");
    
    // Schema versioning with indices for high-speed QS queries
    this.version(1).stores({
      profiles: "id, username, role",
      projects: "id, user_id, updated_at",
      bill_items: "id, project_id, item_code",
      measurements: "id, project_id, bill_item_id, sectionCode, timestamp",
      sync_queue: "++id, table, operation, record_id, created_at"
    });
  }
}

export const db = new QSPocketKnifeDB();

/** --- 4. SYNC ENGINE (Heartbeat Logic) --- **/

export const syncEngine = {
  processQueue: async () => {
    if (!navigator.onLine) return;

    const queue = await db.sync_queue.orderBy('id').toArray();
    if (queue.length === 0) return;

    for (const item of queue) {
      try {
        let error = null;

        if (item.operation === 'INSERT' || item.operation === 'UPDATE') {
          // Clean payload of UI-only calculated fields before cloud injection
          const { amount: _amount, ...cleanPayload } = item.payload as any;

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
          // Success: Remove from local queue
          await db.sync_queue.delete(item.id!);
          
          // Mark local record as synced
          const targetTable = db[item.table as keyof QSPocketKnifeDB] as Table<any, any>;
          if (targetTable && typeof targetTable.update === 'function') {
            await targetTable.update(item.record_id, { synced_at: new Date().toISOString() });
          }
        } else {
          console.error(`[Office Sync] Supabase error for ${item.table}:`, error.message);
          break; // Stop processing queue on error to maintain data integrity
        }
      } catch (err) {
        console.error(`[Office Sync] Handshake Failure:`, err);
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
    
    // Attempt immediate sync if connection is detected
    if (navigator.onLine) {
      syncEngine.processQueue();
    }
  }
};

/** --- 5. ADMIN SERVICE (COMMAND CENTER LOGIC) --- **/

export const adminService = {
  supabase,

  getGlobalStats: async () => {
    const [uRes, pRes, mRes] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('measurements').select('*', { count: 'exact', head: true })
    ]);
    
    return {
      totalUsers: uRes.count || 0,
      totalProjects: pRes.count || 0,
      totalMeasurements: mRes.count || 0,
      systemHealth: typeof navigator !== 'undefined' && navigator.onLine ? 'Optimal' : 'Offline'
    };
  },
  
  getAllProfiles: async () => {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) throw error;

    const { data: projects } = await supabase.from('projects').select('user_id');
    
    return (profiles as Profile[]).map(p => ({
      ...p,
      project_count: projects?.filter(proj => proj.user_id === p.id).length || 0
    }));
  },

  getAllProjects: async () => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        profiles:user_id (username)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((p: any) => ({
      ...p,
      username: p.profiles?.username || 'Unknown Node'
    }));
  },

  updateRole: async (userId: string, newRole: UserRole) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);
    
    if (error) throw error;

    try {
      await db.profiles.update(userId, { role: newRole });
    } catch (e) {
      // Local profile cache might not be initialized
    }
  },

  deleteProject: async (projectId: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);
    
    if (error) throw error;

    try {
      await db.projects.delete(projectId);
    } catch (e) {
      // Record not present in local admin cache
    }
  }
};
