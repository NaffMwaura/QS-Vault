/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-empty */
import React, { useState,  } from 'react';
import { 
  Sun, 
  CloudRain, 
  Cloud, 
  Users,  
  Plus, 
  Camera, 
  Save,
  Truck,
  AlertTriangle,
  Loader2,
  ClipboardList
} from 'lucide-react';

/* ======================================================
    SITE DIARY ENGINE: THE HEART OF FIELD OPS
    Updated to use the Construction OS V3 Schema
   ====================================================== */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let useAuth: any = () => ({ theme: 'dark' });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let syncEngine: any = null;

const resolveModules = async () => {
  try {
    const authMod = await import("../../auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;
    const dbMod = await import("../../../lib/database/database");
    if (dbMod.db) db = dbMod.db;
    if (dbMod.syncEngine) syncEngine = dbMod.syncEngine;
  } catch (e) {}
};
resolveModules();

interface SiteDiaryEngineProps {
  projectId: string | null;
}

const SiteDiaryEngine: React.FC<SiteDiaryEngineProps> = ({ projectId }) => {
  const { theme } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [activeDiaryId, setActiveDiaryId] = useState<string | null>(null);
  
  // State aligned with V3 Database Schema
  const [diaryData, setDiaryData] = useState({
    weather: 'sunny' as 'sunny' | 'rainy' | 'overcast' | 'stormy',
    headcount: 0,
    progress_summary: '',
  });

  const weatherOptions = [
    { id: 'sunny', icon: Sun, label: 'Clear' },
    { id: 'rainy', icon: CloudRain, label: 'Rain' },
    { id: 'overcast', icon: Cloud, label: 'Overcast' },
    { id: 'stormy', icon: AlertTriangle, label: 'Storm' },
  ];

  const handleSaveDiary = async () => {
    if (!projectId || !db) return;
    setIsSaving(true);
    
    const diaryEntry = {
      id: activeDiaryId || crypto.randomUUID(),
      project_id: projectId,
      date: new Date().toISOString().split('T')[0],
      ...diaryData,
      created_at: new Date().toISOString()
    };

    try {
      // 1. SAVE TO LOCAL VAULT (DEXIE)
      await db.site_diary.put(diaryEntry);
      
      // 2. QUEUE FOR CLOUD HANDSHAKE
      if (syncEngine) {
        await syncEngine.queueChange('site_diary', diaryEntry.id, 'UPDATE', diaryEntry);
      }
      
      setActiveDiaryId(diaryEntry.id);
      setTimeout(() => setIsSaving(false), 800);
    } catch (err) {
      console.error("Diary vault commit failed:", err);
      setIsSaving(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8 text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. OPERATIONAL LOG PANEL */}
      <div className="lg:col-span-2 space-y-8">
        <div className={`p-8 sm:p-12 rounded-[3.5rem] border backdrop-blur-3xl shadow-2xl transition-all duration-500
          ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'}`}>
          
          <div className="flex justify-between items-start mb-12">
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-amber-500">
                <ClipboardList size={22} />
                <h3 className="text-3xl font-black uppercase italic tracking-tighter">Execution Log</h3>
              </div>
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em] leading-none">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className={`p-5 rounded-2xl border flex items-center gap-3 ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">GPS Geofence Verified</span>
            </div>
          </div>

          <div className="space-y-12">
            {/* Weather Engine */}
            <div className="space-y-5">
              <label className="text-[11px] font-black uppercase text-zinc-600 ml-3 tracking-[0.4em] italic">Environmental Conditions</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {weatherOptions.map((opt) => (
                  <button
                    key={opt.id}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onClick={() => setDiaryData({...diaryData, weather: opt.id as any})}
                    className={`flex flex-col items-center gap-4 p-8 rounded-[2rem] border transition-all duration-300
                      ${diaryData.weather === opt.id 
                        ? 'bg-amber-500 border-amber-500 text-black shadow-[0_0_40px_rgba(245,158,11,0.2)]' 
                        : 'bg-zinc-950/40 border-zinc-800 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400'}`}
                  >
                    <opt.icon size={28} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Workforce Tracker */}
            <div className="space-y-5">
              <label className="text-[11px] font-black uppercase text-zinc-600 ml-3 tracking-[0.4em] italic">Total Headcount on Site</label>
              <div className="relative group">
                <Users className="absolute left-8 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-amber-500 transition-colors" size={24} />
                <input 
                  type="number"
                  placeholder="Total labor inclusive of sub-contractors..."
                  value={diaryData.headcount || ''}
                  onChange={(e) => setDiaryData({...diaryData, headcount: parseInt(e.target.value)})}
                  className="w-full p-8 pl-20 rounded-[2rem] bg-zinc-950/60 border border-zinc-800 text-white outline-none focus:border-amber-500/50 transition-all font-black text-3xl italic tracking-tighter"
                />
              </div>
            </div>

            {/* Progress Narrative */}
            <div className="space-y-5">
              <label className="text-[11px] font-black uppercase text-zinc-600 ml-3 tracking-[0.4em] italic">On-Site Progress Narrative</label>
              <textarea 
                rows={5}
                placeholder="Document critical milestones, equipment downtime, or material delivery delays..."
                value={diaryData.progress_summary}
                onChange={(e) => setDiaryData({...diaryData, progress_summary: e.target.value})}
                className="w-full p-10 rounded-[2.5rem] bg-zinc-950/60 border border-zinc-800 text-zinc-300 outline-none focus:border-amber-500/50 transition-all text-base leading-relaxed font-medium"
              />
            </div>
          </div>

          <div className="mt-12 pt-12 border-t border-zinc-800/60 flex flex-col sm:flex-row gap-6">
            <button 
              onClick={handleSaveDiary}
              disabled={isSaving}
              className="flex-1 py-8 bg-amber-500 text-black rounded-[2rem] font-black uppercase text-xs tracking-[0.5em] shadow-2xl hover:bg-amber-400 active:scale-[0.98] transition-all flex items-center justify-center gap-5 italic"
            >
              {isSaving ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} className="stroke-[3px]" />}
              Commit Diary to Vault
            </button>
            <button className={`p-8 rounded-[2rem] border border-zinc-800 text-zinc-500 hover:text-white transition-all`}>
               <Camera size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. FIELD EVIDENCE & ALERTS */}
      <div className="space-y-8 flex flex-col">
        {/* PHOTO PINNING ENGINE PREVIEW */}
        <div className={`p-10 rounded-[3.5rem] border shadow-2xl flex flex-col flex-1
          ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200'}`}>
          
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4 text-left">
              <Camera size={22} className="text-blue-500" />
              <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-zinc-500">Visual Evidence</h3>
            </div>
            <span className="px-3 py-1 bg-zinc-800 rounded-lg text-[10px] font-mono text-zinc-600">04 FILES</span>
          </div>

          <div className="flex-1 border-2 border-dashed border-zinc-800/60 rounded-[2.5rem] flex flex-col items-center justify-center p-12 opacity-30 group hover:opacity-100 hover:border-amber-500/40 transition-all cursor-pointer bg-zinc-950/20">
            <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2rem] mb-6 group-hover:scale-110 group-hover:border-amber-500/20 transition-all">
              <Plus size={40} className="text-zinc-700 group-hover:text-amber-500" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-center">Capture Site Node</p>
            <p className="text-[9px] font-bold text-zinc-600 uppercase mt-3 italic tracking-widest">Pin Photo to Floor Plan</p>
          </div>

          <div className="mt-10 space-y-5">
             <div className="flex items-start gap-5 p-6 bg-zinc-950/60 rounded-3xl border border-zinc-800 group hover:border-rose-500/30 transition-all text-left">
                <div className="p-4 bg-rose-500/10 text-rose-500 rounded-2xl shadow-inner group-hover:scale-110 transition-transform"><AlertTriangle size={20}/></div>
                <div>
                   <p className="text-[11px] font-black uppercase text-zinc-200">Critical Inspection</p>
                   <p className="text-[9px] font-bold text-zinc-600 uppercase mt-2 tracking-tighter italic">Defect Node #102 • Reinforcement Failure</p>
                </div>
             </div>
          </div>
        </div>

        {/* LOGISTICS SNAPSHOT */}
        <div className={`p-10 rounded-[3.5rem] border border-zinc-800 bg-zinc-950/40 flex justify-between items-center group cursor-pointer hover:border-amber-500/20 transition-all`}>
           <div className="text-left">
              <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.3em] mb-3 leading-none">Deliveries Observed</p>
              <p className="text-3xl font-black italic text-zinc-400 group-hover:text-white transition-colors leading-none tracking-tighter">04 Items</p>
           </div>
           <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-[1.8rem] text-zinc-700 group-hover:text-amber-500 group-hover:bg-amber-500/5 transition-all shadow-inner">
              <Truck size={24} />
           </div>
        </div>
      </div>
    </div>
  );
};

export default SiteDiaryEngine;