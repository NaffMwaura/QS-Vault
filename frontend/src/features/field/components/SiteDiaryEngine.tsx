/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sun, 
  CloudRain, 
  Cloud, 
  Users,  
  Plus, 
  Camera, 
  Save, 
  CheckCircle2,
  Truck,
  AlertTriangle,
  Loader2,
  History
} from 'lucide-react';

/* ======================================================
    SITE DIARY: DAILY PROGRESS TRACKER
    Uses Dexie (Offline) + SyncEngine (Online)
   ====================================================== */

let useAuth: any = () => ({ theme: 'dark' });
let db: any = null;
let syncEngine: any = null;

const resolveModules = async () => {
  try {
    const authMod = await import("../../auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;
    const dbMod = await import("../../../lib/database/database");
    if (dbMod.db) db = dbMod.db;
    if (dbMod.syncEngine) syncEngine = dbMod.syncEngine;
  } catch (e) {
    // Shims active for sandbox
  }
};
resolveModules();

interface SiteDiaryEngineProps {
  projectId: string | null;
}

const SiteDiaryEngine: React.FC<SiteDiaryEngineProps> = ({ projectId }) => {
  useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  
  // Data for today's specific entry
  const [diaryData, setDiaryData] = useState({
    id: '',
    weather: 'sunny' as 'sunny' | 'rainy' | 'overcast' | 'stormy',
    headcount: 0,
    progress_summary: '',
  });

  /** * LOAD TODAY'S RECORD
   * Checks the local device (Dexie) to see if we already started a report for today.
   */
  const loadTodaysData = useCallback(async () => {
    if (!db || !projectId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const existingEntry = await db.site_diary
        .where('[project_id+date]')
        .equals([projectId, today])
        .first();

      if (existingEntry) {
        setDiaryData({
          id: existingEntry.id,
          weather: existingEntry.weather,
          headcount: existingEntry.headcount,
          progress_summary: existingEntry.progress_summary,
        });
        setLastSaved(existingEntry.created_at);
      } else {
        // Reset for a fresh day
        setDiaryData({
          id: crypto.randomUUID(),
          weather: 'sunny',
          headcount: 0,
          progress_summary: '',
        });
      }
    } catch (err) {
      console.error("Diary: Failed to read from device.", err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadTodaysData();
  }, [loadTodaysData]);

  /** * SAVE DAILY REPORT
   * Saves to device immediately (Offline) and queues for Cloud sync.
   */
  const handleSaveDiary = async () => {
    if (!projectId || !db) return;
    setIsSaving(true);
    
    const today = new Date().toISOString().split('T')[0];
    const reportEntry = {
      ...diaryData,
      project_id: projectId,
      date: today,
      created_at: new Date().toISOString()
    };

    try {
      // 1. SAVE TO DEVICE (Works without internet)
      await db.site_diary.put(reportEntry);
      
      // 2. QUEUE FOR SYNC (Uploads when internet returns)
      if (syncEngine) {
        await syncEngine.queueChange('site_diary', reportEntry.id, 'UPDATE', reportEntry);
      }
      
      setLastSaved(reportEntry.created_at);
      setTimeout(() => setIsSaving(false), 600);
    } catch (err) {
      console.error("Diary: Save failed.", err);
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-40 opacity-20">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-amber-500" />
        <p className="font-black text-[10px] uppercase tracking-[0.4em]">Checking Daily Records...</p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8 text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. MAIN ENTRY FORM */}
      <div className="lg:col-span-2 space-y-8">
        <div className="theme-surface-overlay p-8 sm:p-12 rounded-[3.5rem] border backdrop-blur-3xl shadow-2xl transition-all duration-500">
          
          <div className="flex justify-between items-start mb-12">
            <div className="space-y-2">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter">Site Diary</h3>
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em] leading-none">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            {lastSaved && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span className="text-[8px] font-black uppercase text-emerald-600">Saved Locally</span>
              </div>
            )}
          </div>

          <div className="space-y-12">
            {/* Weather */}
            <div className="space-y-5">
              <label className="text-[11px] font-black uppercase text-zinc-600 ml-3 tracking-[0.4em] italic">Today's Weather</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { id: 'sunny', icon: Sun, label: 'Clear Sky' },
                  { id: 'rainy', icon: CloudRain, label: 'Raining' },
                  { id: 'overcast', icon: Cloud, label: 'Cloudy' },
                  { id: 'stormy', icon: AlertTriangle, label: 'Stormy' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setDiaryData({...diaryData, weather: opt.id as any})}
                    className={`flex flex-col items-center gap-4 p-8 rounded-4xl border transition-all duration-300
                      ${diaryData.weather === opt.id 
                        ? 'bg-amber-500 border-amber-500 text-black shadow-xl' 
                        : 'theme-surface-inset theme-muted hover:border-zinc-600'}`}
                  >
                    <opt.icon size={28} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Workforce */}
            <div className="space-y-5">
              <label className="text-[11px] font-black uppercase text-zinc-600 ml-3 tracking-[0.4em] italic">Total People on Site</label>
              <div className="relative group">
                <Users className="absolute left-8 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-amber-500 transition-colors" size={24} />
                <input 
                  type="number"
                  placeholder="Enter total headcount..."
                  value={diaryData.headcount || ''}
                  onChange={(e) => setDiaryData({...diaryData, headcount: parseInt(e.target.value) || 0})}
                  className="theme-input w-full p-8 pl-20 rounded-2rem] border outline-none focus:border-amber-500/50 transition-all font-black text-3xl italic tracking-tighter"
                />
              </div>
            </div>

            {/* Work Summary */}
            <div className="space-y-5">
              <label className="text-[11px] font-black uppercase text-zinc-600 ml-3 tracking-[0.4em] italic">What was done today?</label>
              <textarea 
                rows={5}
                placeholder="List the main tasks completed or any delays experienced..."
                value={diaryData.progress_summary}
                onChange={(e) => setDiaryData({...diaryData, progress_summary: e.target.value})}
                className="theme-input theme-muted w-full p-10 rounded-[2.5rem] border outline-none focus:border-amber-500/50 transition-all text-base leading-relaxed font-medium"
              />
            </div>
          </div>

          <div className="mt-12 pt-12 border-t border-zinc-800/60">
            <button 
              onClick={handleSaveDiary}
              disabled={isSaving}
              className="w-full py-8 bg-amber-500 text-black rounded-4xl font-black uppercase text-xs tracking-[0.5em] shadow-2xl hover:bg-amber-400 active:scale-[0.98] transition-all flex items-center justify-center gap-5 italic"
            >
              {isSaving ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} className="stroke-[3px]" />}
              Save Daily Report
            </button>
          </div>
        </div>
      </div>

      {/* 2. SITE PHOTOS & ALERTS */}
      <div className="space-y-8 flex flex-col">
        <div className="theme-surface-overlay p-10 rounded-[3.5rem] border shadow-2xl flex flex-col flex-1">
          
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4 text-left">
              <Camera size={22} className="text-blue-500" />
              <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-zinc-500">Site Photos</h3>
            </div>
          </div>

          <div className="flex-1 border-2 border-dashed border-zinc-800/60 rounded-[2.5rem] flex flex-col items-center justify-center p-12 opacity-30 group hover:opacity-100 hover:border-amber-500/40 transition-all cursor-pointer bg-zinc-950/20">
            <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-4xl mb-6 group-hover:scale-110 transition-all">
              <Plus size={40} className="text-zinc-700 group-hover:text-amber-500" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-center">Add Photo</p>
          </div>

          <div className="mt-10 p-6 bg-zinc-950/60 rounded-3xl border border-zinc-800 text-left">
             <div className="flex items-center gap-4 mb-3">
                <History size={16} className="text-zinc-600" />
                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">History</span>
             </div>
             <p className="text-[10px] font-bold text-zinc-600 italic">No photos uploaded for this day yet.</p>
          </div>
        </div>

        {/* Deliveries Snapshot */}
        <div className={`p-10 rounded-[3.5rem] border border-zinc-800 bg-zinc-950/40 flex justify-between items-center group cursor-pointer hover:border-amber-500/20 transition-all`}>
           <div className="text-left">
              <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.3em] mb-3 leading-none">Deliveries Today</p>
              <p className="text-3xl font-black italic text-zinc-400 group-hover:text-white transition-colors leading-none tracking-tighter">00 Items</p>
           </div>
           <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-[1.8rem] text-zinc-700 group-hover:text-amber-500 transition-all shadow-inner">
              <Truck size={24} />
           </div>
        </div>
      </div>
    </div>
  );
};

export default SiteDiaryEngine;
