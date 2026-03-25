/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dexie, type Table } from "dexie";
import { createClient } from "@supabase/supabase-js";

/** --- 1. CLOUD CONFIGURATION --- **/
const getEnv = (key: string) => {
  try { return import.meta.env[key] || ""; } catch { return ""; }
};

export const supabase = createClient(
  getEnv('VITE_SUPABASE_URL') || "https://placeholder.supabase.co",
  getEnv('VITE_SUPABASE_ANON_KEY') || "placeholder"
);

/** --- 2. THE CONSTRUCTION OS INTERFACES --- **/

export type UserRole = 'user' | 'editor' | 'admin' | 'super-admin';
export type TicketStatus = 'open' | 'pending' | 'closed';

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
  lat?: number; 
  lng?: number; 
  geofence_radius?: number; 
  username?: string; 
}

/* --- FIELD ENGINE (SITE EXECUTION) --- */
export interface SiteDiary {
  id: string;
  project_id: string;
  date: string;
  weather: 'sunny' | 'rainy' | 'overcast' | 'stormy';
  headcount: number;
  progress_summary: string;
  created_at: string;
}

export interface SiteLog {
  id: string;
  diary_id: string;
  timestamp: string;
  event: string;
  category: 'delivery' | 'inspection' | 'delay' | 'milestone';
}

export interface SitePhoto {
  id: string;
  project_id: string;
  url: string;
  x_coord: number; 
  y_coord: number;
  task_tag: string;
  timestamp: string;
}

export interface Issue {
  id: string;
  project_id: string;
  title: string;
  status: TicketStatus;
  assigned_subcontractor: string;
  description: string;
  created_at: string;
}

/* --- SCHEDULING & RESOURCES --- */
export interface GanttTask {
  id: string;
  project_id: string;
  bill_item_id: string | null; 
  title: string;
  start_date: string;
  end_date: string;
  completion_percentage: number;
}

export interface TimeClock {
  id: string;
  user_id: string;
  project_id: string;
  clock_in: string;
  clock_out: string | null;
  lat_in: number;
  lng_in: number;
  is_verified_geofence: boolean;
}

export interface MaterialLogistics {
  id: string;
  project_id: string;
  bill_item_id: string; 
  item_name: string;
  qty_received: number;
  delivery_note_ref: string;
  timestamp: string;
}

/* --- COMMUNICATION HUB --- */
export interface RFI {
  id: string;
  project_id: string;
  subject: string;
  to_professionals: string[]; 
  content: string;
  status: 'draft' | 'sent' | 'responded';
  created_at: string;
}

export interface ChatMessage {
  id: string;
  project_id: string;
  user_id: string;
  text: string;
  timestamp: string;
}

/* --- SAFETY & COMPLIANCE --- */
export interface ComplianceCheck {
  id: string;
  project_id: string;
  category: 'HSE' | 'Quality' | 'Structural';
  title: string;
  is_compliant: boolean;
  notes: string;
  inspector_id: string;
  timestamp: string;
}

export interface Permit {
  id: string;
  project_id: string;
  title: string;
  expiry_date: string;
  document_url: string | null;
  status: 'active' | 'expired' | 'pending';
}

/* --- THE BRIDGE: QS ↔ CM --- */
export interface Variation {
  id: string;
  project_id: string;
  site_log_id: string | null; 
  description: string;
  qs_pricing_status: 'unpriced' | 'pending' | 'approved';
  estimated_cost: number;
  approved_sum?: number;
  created_at: string;
}

/* --- QS CORE TABLES (SMM-KE ENGINE) --- */
export interface BillItem {
  id: string;
  project_id: string;
  item_code: string | null;
  description: string;
  unit: 'm3' | 'm2' | 'm' | 'nr' | 'kg' | 't';
  rate: number;
  quantity: number;
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
  type: 'length' | 'area' | 'count' | 'markup'; 
  value: number;
  unit: string;
  sectionCode: string; 
  points: CanvasPoint[] | null; 
  timestamp: string;
}

export interface SyncQueueItem {
  id?: number;
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  record_id: string;
  payload: any;
  created_at: number;
}

/** --- 3. DEXIE LOCAL STORAGE (THE PROJECT VAULT) --- **/

class QSPocketKnifeDB extends Dexie {
  profiles!: Table<Profile, string>;
  projects!: Table<Project, string>;
  bill_items!: Table<BillItem, string>;
  measurements!: Table<Measurement, string>;
  site_diary!: Table<SiteDiary, string>;
  site_logs!: Table<SiteLog, string>;
  site_photos!: Table<SitePhoto, string>;
  issues!: Table<Issue, string>;
  gantt_tasks!: Table<GanttTask, string>;
  timeclock!: Table<TimeClock, string>;
  material_logistics!: Table<MaterialLogistics, string>;
  rfis!: Table<RFI, string>;
  chat_messages!: Table<ChatMessage, string>;
  compliance_checks!: Table<ComplianceCheck, string>;
  permits!: Table<Permit, string>;
  variations!: Table<Variation, string>;
  sync_queue!: Table<SyncQueueItem, number>;

  constructor() {
    super("QSPocketKnifeDB");
    
    this.version(4).stores({
      profiles: "id, username, role",
      projects: "id, user_id, updated_at",
      bill_items: "id, project_id, item_code",
      measurements: "id, project_id, bill_item_id, sectionCode, timestamp",
      site_diary: "id, project_id, date",
      site_logs: "id, diary_id, category",
      site_photos: "id, project_id, task_tag",
      issues: "id, project_id, status, assigned_subcontractor",
      gantt_tasks: "id, project_id, bill_item_id",
      timeclock: "id, user_id, project_id, clock_in",
      material_logistics: "id, project_id, bill_item_id",
      rfis: "id, project_id, status",
      chat_messages: "id, project_id, user_id, timestamp",
      compliance_checks: "id, project_id, category, timestamp",
      permits: "id, project_id, status, expiry_date",
      variations: "id, project_id, qs_pricing_status",
      sync_queue: "++id, table, operation, record_id, created_at"
    });
  }
}

export const db = new QSPocketKnifeDB();

/** --- 4. GLOBAL SYNC ENGINE (OFFICE HANDSHAKE) --- **/

let isProcessing = false;

export const syncEngine = {
  /** * sanitizePayload
   * Standardizes payloads for PostgreSQL compatibility.
   * Maps camelCase to snake_case and removes UI fields.
   */
  sanitizePayload: (table: string, payload: any) => {
    const { synced_at, is_local, amount, ...clean } = payload;
    
    // Hard mapping for SMM columns to ensure no schema mismatch
    if (table === 'measurements') {
      if (clean.sectionCode !== undefined) {
        clean.section_code = clean.sectionCode;
        delete clean.sectionCode;
      }
    }

    if (table === 'bill_items') {
      if (clean.itemCode !== undefined) {
        clean.item_code = clean.itemCode;
        delete clean.itemCode;
      }
    }

    return clean;
  },

  processQueue: async () => {
    if (!navigator.onLine || isProcessing) return;
    
    try {
      isProcessing = true;
      const queue = await db.sync_queue.orderBy('id').toArray();
      
      if (queue.length === 0) return;

      for (const item of queue) {
        try {
          const cleanData = syncEngine.sanitizePayload(item.table, item.payload);

          const { error } = item.operation === 'DELETE' 
            ? await supabase.from(item.table).delete().eq('id', item.record_id)
            : await supabase.from(item.table).upsert(cleanData, { onConflict: 'id' });

          if (!error) {
            await db.sync_queue.delete(item.id!);
            const targetTable = (db as any)[item.table];
            if (targetTable) {
              await targetTable.update(item.record_id, { synced_at: new Date().toISOString() });
            }
          } else {
            console.error(`[Sync Engine] ${item.table} upload paused:`, error.message);
            
            // Critical schema error check
            if (error.message.includes("column") || error.code === "42703" || error.message.includes("section_code")) {
              console.warn(`[Sync Engine] Schema Mismatch on ${item.table}. Skipping record to unblock ledger.`);
              await db.sync_queue.delete(item.id!);
              continue;
            }
            break; 
          }
        } catch (err) {
          console.error(`[Sync Engine] Fatal entry error:`, err);
          break;
        }
      }
    } finally {
      isProcessing = false;
    }
  },

  queueChange: async (
    table: string, 
    id: string, 
    op: 'INSERT' | 'UPDATE' | 'DELETE', 
    data: any
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

/** --- 5. ADMIN SERVICE (PLATFORM AUDIT LOGIC) --- **/

export const adminService = {
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
      systemHealth: navigator.onLine ? 'Optimal' : 'Offline'
    };
  },
  
  getAllProfiles: async () => {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return profiles;
  },

  getAllProjects: async () => {
    const { data, error } = await supabase
      .from('projects')
      .select(`*, profiles:user_id (username)`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map((p: any) => ({
      ...p,
      username: p.profiles?.username || 'Authorized Node'
    }));
  },

  updateRole: async (userId: string, newRole: UserRole) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) throw error;
    await db.profiles.update(userId, { role: newRole });
  },

  deleteProject: async (projectId: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) throw error;
    await db.projects.delete(projectId);
  }
};