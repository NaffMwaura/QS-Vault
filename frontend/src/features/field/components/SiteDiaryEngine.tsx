/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
  History,
  X,
  Calendar,
  Package,
  Trash2,
  ArrowLeft,
  ChevronDown,
  Briefcase,
} from 'lucide-react';

/* ======================================================
    OFFICE MODULE RESOLUTION
   ====================================================== */

let useAuth: any = () => ({ theme: 'light', user: null });
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
    console.warn("Diary Engine: System resolution deferred.");
  }
};

resolveModules();

/** --- TYPES --- **/

interface SiteDiaryEngineProps {
  projectId: string | null;
}

/** --- MAIN COMPONENT: PROFESSIONAL SITE LEDGER --- **/

const SiteDiaryEngine: React.FC<SiteDiaryEngineProps> = ({ projectId: initialId }) => {
  const { theme, user } = useAuth();
  
  // WORKSPACE CONTEXT
  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  
  // DATA STATES
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedNotification, setShowSavedNotification] = useState(false);
  const [viewingHistory, setViewingHistory] = useState(false);
  
  const [pastRecords, setPastRecords] = useState<any[]>([]);
  const [deliveryCount, setDeliveryCount] = useState(0);
  const [dayPhotos, setDayPhotos] = useState<any[]>([]);
  
  const [diaryData, setDiaryData] = useState({
    id: '',
    weather: 'sunny' as 'sunny' | 'rainy' | 'overcast' | 'stormy',
    headcount: 0,
    progress_summary: '',
    date: new Date().toISOString().split('T')[0]
  });

  /** * 1. DATA HANDSHAKE: LOAD PROJECTS & RECORDS */
  const syncWorkspaceData = useCallback(async () => {
    if (!db || !user) {
        setTimeout(() => setIsLoading(false), 800);
        return;
    }

    try {
      setIsLoading(true);

      // Fetch user projects for the switcher
      const projects = await db.projects.where('user_id').equals(user.id).toArray();
      setAvailableProjects(projects);

      if (selectedId) {
        // Fetch specific project record for current date
        const allProjectDiaries = await db.site_diary.where('project_id').equals(selectedId).toArray();
        const entry = allProjectDiaries.find((d: any) => d.date === diaryData.date);

        if (entry) {
          setDiaryData(entry);
        } else {
          setDiaryData(prev => ({
            ...prev,
            id: crypto.randomUUID(),
            weather: 'sunny',
            headcount: 0,
            progress_summary: ''
          }));
        }

        // Fetch Photos for this day/project
        const photos = await db.site_photos.where('project_id').equals(selectedId).toArray();
        setDayPhotos(photos.filter((p: any) => p.timestamp?.startsWith(diaryData.date)));

        // Fetch Deliveries
        const deliveries = await db.material_logistics.where('project_id').equals(selectedId).toArray();
        setDeliveryCount(deliveries.filter((item: any) => item.timestamp?.startsWith(diaryData.date)).length);

        setPastRecords(allProjectDiaries.sort((a: any, b: any) => b.date.localeCompare(a.date)));
      } else if (projects.length > 0) {
        setSelectedId(projects[0].id);
      }
    } catch (err) {
      console.error("Vault access deferred.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedId, user, diaryData.date]);

  useEffect(() => {
    syncWorkspaceData();
  }, [syncWorkspaceData]);

  /** * 2. EVIDENCE HANDSHAKE: PHOTO CAPTURE */
  const handleCapturePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const photoRecord = {
        id: crypto.randomUUID(),
        project_id: selectedId,
        url: reader.result as string,
        timestamp: new Date().toISOString(),
        task_tag: 'Site Progress'
      };

      try {
        await db.site_photos.add(photoRecord);
        if (syncEngine) await syncEngine.queueChange('site_photos', photoRecord.id, 'INSERT', photoRecord);
        setDayPhotos(prev => [...prev, photoRecord]);
        setShowSavedNotification(true);
        setTimeout(() => setShowSavedNotification(false), 2000);
      } catch (err) { console.error("Photo vaulting failed."); }
    };
    reader.readAsDataURL(file);
  };

  /** * 3. COMMIT TO LEDGER (SAVE) */
  const handleSaveDiary = async () => {
    if (!selectedId || !db) return;
    setIsSaving(true);
    
    const record = {
      ...diaryData,
      project_id: selectedId,
      created_at: new Date().toISOString()
    };

    try {
      await db.site_diary.put(record);
      if (syncEngine) {
        await syncEngine.queueChange('site_diary', record.id, 'UPDATE', record);
      }
      
      setShowSavedNotification(true);
      setTimeout(() => {
        setIsSaving(false);
        setTimeout(() => setShowSavedNotification(false), 3000);
      }, 800);
    } catch (err) {
      setIsSaving(false);
    }
  };

  /** * 4. ARCHIVAL PROTOCOL (DELETE) */
  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm("Permanently erase this site record?")) return;
    try {
      await db.site_diary.delete(id);
      if (syncEngine) await syncEngine.queueChange('site_diary', id, 'DELETE', null);
      setViewingHistory(false);
      syncWorkspaceData();
    } catch (err) { console.error("Deletion failed."); }
  };

  if (isLoading && !viewingHistory) {
    return (
      <div className="flex flex-col items-center justify-center p-40 opacity-30">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-amber-500" />
        <p className={`font-black text-[10px] uppercase tracking-[0.5em] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-950'}`}>Synchronizing Day Node...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left pb-10">
      
      {/* 1. MASTER WORKSPACE CONTROL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-4">
        <div className="space-y-3">
          <h3 className={`text-4xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Daily Ledger</h3>
          <div className="flex items-center gap-4">
             <div className="relative group">
                <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" />
                <select 
                  value={selectedId || ''} 
                  onChange={(e) => setSelectedId(e.target.value)}
                  className={`pl-12 pr-10 py-3 rounded-xl border appearance-none font-black uppercase text-[10px] tracking-widest cursor-pointer outline-none transition-all
                    ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white hover:border-amber-500' : 'bg-white border-zinc-200 text-zinc-900 hover:border-amber-500 shadow-sm'}`}
                >
                  {availableProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  {availableProjects.length === 0 && <option>No Projects Found</option>}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic leading-none mt-1">Site Context Active</p>
          </div>
        </div>

        {showSavedNotification && (
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 animate-in zoom-in duration-300">
                <CheckCircle2 size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Record Secured</span>
            </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        
        {/* LEFT COLUMN: PRIMARY INPUTS */}
        <div className="lg:col-span-2 space-y-10">
          <div className={`p-10 sm:p-14 rounded-[4rem] border shadow-2xl transition-all duration-500
            ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
            
            <header className="flex justify-between items-start mb-14">
              <div className="space-y-3">
                <h3 className={`text-3xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Today's Entry</h3>
                <div className="flex items-center gap-3">
                  <Calendar size={14} className="text-amber-500" />
                  <p className={`text-[11px] font-black uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-900'}`}>
                    {new Date(diaryData.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </header>

            <div className="space-y-16">
              {/* Weather Selection */}
              <div className="space-y-6">
                <label className={`text-[12px] font-black uppercase ml-4 tracking-[0.3em] italic ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-950'}`}>What is the weather?</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { id: 'sunny', icon: Sun, label: 'Sunny' },
                    { id: 'rainy', icon: CloudRain, label: 'Rainy' },
                    { id: 'overcast', icon: Cloud, label: 'Cloudy' },
                    { id: 'stormy', icon: AlertTriangle, label: 'Stormy' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setDiaryData({...diaryData, weather: opt.id as any})}
                      className={`flex flex-col items-center gap-4 p-8 rounded-3xl border transition-all duration-300 active:scale-95
                        ${diaryData.weather === opt.id 
                          ? 'bg-amber-500 border-amber-500 text-black shadow-xl shadow-amber-500/20' 
                          : 'bg-zinc-950/20 border-zinc-800 text-zinc-500 hover:border-zinc-500'}`}
                    >
                      <opt.icon size={32} strokeWidth={2.5} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Workforce Input */}
              <div className="space-y-6">
                <label className={`text-[12px] font-black uppercase ml-4 tracking-[0.3em] italic ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-950'}`}>How many people on site?</label>
                <div className="relative group flex flex-col items-center">
                  <div className="relative w-full">
                     <Users className="absolute left-10 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-amber-500 transition-colors" size={32} />
                     <input 
                       type="number"
                       placeholder="0"
                       value={diaryData.headcount || ''}
                       onChange={(e) => setDiaryData({...diaryData, headcount: parseInt(e.target.value) || 0})}
                       className={`w-full p-12 text-center rounded-[3rem] border outline-none transition-all font-black text-6xl italic tracking-tighter shadow-inner
                         ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500/50' : 'bg-zinc-50 border-zinc-200 text-zinc-950 focus:border-amber-500'}`}
                     />
                  </div>
                  <span className={`mt-5 font-black uppercase text-[10px] tracking-[0.5em] text-center ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'} group-focus-within:text-amber-500`}>Personnel Nodes</span>
                </div>
              </div>

              {/* Work Done Textarea */}
              <div className="space-y-6">
                <label className={`text-[12px] font-black uppercase ml-4 tracking-[0.3em] italic ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-950'}`}>What was done today?</label>
                <textarea 
                  rows={6}
                  placeholder="Record tasks completed, material nodes received, or site delays..."
                  value={diaryData.progress_summary}
                  onChange={(e) => setDiaryData({...diaryData, progress_summary: e.target.value})}
                  className={`w-full p-10 rounded-[3.5rem] border outline-none transition-all text-lg font-medium shadow-inner
                    ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-300 focus:border-amber-500/50' : 'bg-zinc-50 border-zinc-200 text-zinc-950 focus:border-amber-500'}`}
                />
              </div>
            </div>

            <div className="mt-16 pt-12 border-t border-zinc-800/40 text-center">
              <button 
                onClick={handleSaveDiary}
                disabled={isSaving}
                className="w-full py-9 bg-amber-500 text-black rounded-[2.5rem] font-black uppercase text-sm tracking-[0.5em] shadow-2xl hover:bg-amber-400 active:scale-[0.98] transition-all flex items-center justify-center gap-6 italic"
              >
                {isSaving ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} strokeWidth={3.5} />}
                Secure Today's Ledger
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: EVIDENCE & HISTORY */}
        <div className="space-y-8 flex flex-col">
          
          {/* Photo Evidence Node */}
          <div className={`p-10 rounded-[4rem] border shadow-2xl flex flex-col transition-all
            ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-xl'}`}>
            
            <div className="flex justify-between items-center mb-10 text-left">
              <div className="flex items-center gap-4">
                <Camera size={24} className="text-blue-500" />
                <h3 className={`text-[12px] font-black uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-900'}`}>Site Evidence</h3>
              </div>
            </div>

            {/* Captured Image Grid (linked to day) */}
            {dayPhotos.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-8 animate-in fade-in duration-500">
                 {dayPhotos.map((p) => (
                   <div key={p.id} className="aspect-square rounded-2xl overflow-hidden border border-zinc-800 shadow-lg relative group">
                      <img src={p.url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Evidence Node" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <p className="text-[8px] font-black uppercase text-white tracking-widest">{new Date(p.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                   </div>
                 ))}
              </div>
            )}

            <label className="flex-1 border-2 border-dashed border-zinc-800/60 rounded-[3.5rem] flex flex-col items-center justify-center p-12 opacity-40 group hover:opacity-100 hover:border-amber-500/40 transition-all cursor-pointer bg-zinc-950/20 shadow-inner min-h-220px]">
              <div className="p-10 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] mb-6 group-hover:scale-110 transition-all group-hover:bg-amber-500 group-hover:border-amber-600 shadow-xl">
                <Plus size={48} className="text-zinc-700 group-hover:text-black transition-colors" />
              </div>
              <p className={`text-[11px] font-black uppercase tracking-[0.5em] text-center ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-950'}`}>Add Site Node</p>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCapturePhoto} />
            </label>

            <div className="mt-10 p-6 bg-zinc-950/60 rounded-[2.5rem] border border-zinc-800 text-left">
               <div className="flex items-center gap-4 mb-4">
                  <History size={16} className="text-zinc-600" />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-900'}`}>Archival Node</span>
               </div>
               <button 
                onClick={() => setViewingHistory(true)}
                className="w-full py-5 rounded-2xl border border-zinc-800 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all active:scale-95 shadow-xl"
               >
                  Retrieve Past Records
               </button>
            </div>
          </div>

          {/* Logistics Node */}
          <div className={`p-12 rounded-[4rem] border transition-all duration-500 flex justify-between items-center group shadow-xl
             ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800 shadow-black' : 'bg-zinc-50 border-zinc-200 shadow-zinc-200/50'}`}>
             <div className="text-left ">
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 leading-none ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-900'}`}>Arrivals Today</p>
                <p className={`text-5xl font-black italic tracking-tighter leading-none transition-colors group-hover:text-amber-500
                   ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-950'}`}>
                  {deliveryCount.toString().padStart(2, '0')} Nodes
                </p>
             </div>
             <div className="p-7 bg-zinc-900 border border-zinc-800 rounded-[2.2rem] text-zinc-700 group-hover:text-amber-500 transition-all shadow-inner">
                <Truck size={32} />
             </div>
          </div>
        </div>
      </div>

      {/* 3. HISTORY MODAL OVERLAY (Presentation Ready) */}
      {viewingHistory && (
        <div className="fixed inset-0 z-100] flex items-center justify-center p-6 sm:p-20 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`w-full max-w-4xl rounded-[4.5rem] border p-12 sm:p-16 shadow-2xl relative animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col
            ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-xl'}`}>
            
            <button onClick={() => setViewingHistory(false)} className="absolute top-10 right-10 p-5 bg-zinc-900 rounded-2xl text-zinc-500 hover:text-white shadow-lg transition-all active:scale-90"><X size={28}/></button>
            
            <div className="mb-12 text-left space-y-2">
              <h4 className={`text-4xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Project Archival</h4>
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Select a day to review or update site data</p>
            </div>

            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-4 pb-10">
               {pastRecords.length > 0 ? pastRecords.map(rec => (
                 <div key={rec.id} className={`p-10 rounded-[3rem] border transition-all flex items-center justify-between gap-8
                   ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900' : 'bg-zinc-50 border-zinc-100 hover:bg-zinc-100'}`}>
                    
                    <div className="text-left flex-1">
                       <p className="text-[11px] font-black uppercase text-amber-500 mb-3 leading-none">{new Date(rec.date).toDateString()}</p>
                       <p className={`text-xl font-black uppercase italic tracking-tight transition-colors 
                         ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-900'}`}>
                         {rec.progress_summary ? (rec.progress_summary.slice(0, 70) + "...") : "No Task Record"}
                       </p>
                       <div className="mt-5 flex items-center gap-6 opacity-40">
                          <div className="flex items-center gap-2">
                             <Users size={14} /> <span className="text-[10px] font-black">{rec.headcount} Personnel</span>
                          </div>
                          <div className="flex items-center gap-2">
                             {rec.weather === 'sunny' ? <Sun size={14} /> : <Cloud size={14} />} 
                             <span className="text-[10px] font-black uppercase">{rec.weather}</span>
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-4">
                       <button 
                         onClick={() => { setDiaryData(rec); setViewingHistory(false); }}
                         className="p-6 bg-amber-500 text-black rounded-2xl shadow-xl hover:bg-amber-400 transition-all flex items-center gap-3 active:scale-95"
                       >
                          <ArrowLeft size={20} />
                          <span className="text-[11px] font-black uppercase tracking-widest">Edit</span>
                       </button>
                       <button 
                         onClick={() => handleDeleteRecord(rec.id)}
                         className="p-6 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-lg active:scale-95"
                       >
                          <Trash2 size={20} />
                       </button>
                    </div>
                 </div>
               )) : (
                 <div className="py-24 text-center opacity-20">
                    <Package size={80} className="mx-auto mb-8" />
                    <p className="font-black uppercase text-base tracking-widest italic">Vault Empty</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      <footer className="col-span-full pt-16 text-center opacity-20 select-none pb-10">
         <p className="text-[9px] font-black uppercase tracking-[1.8em] text-zinc-600 italic leading-none text-center">
           ISO 19650 QUALITY COMPLIANCE • SITE READY OS
         </p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 20px; }
      `}</style>
    </div>
  );
};

export default SiteDiaryEngine;