/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sun, 
  CloudRain, 
  Cloud, 
  Users,   
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
  ChevronDown,
  Briefcase,
  RefreshCw,
  FileUp,
  Eye,
  Layout,
  ShieldCheck
} from 'lucide-react';

/* ======================================================
    OFFICE MODULE RESOLUTION (STABILIZED)
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
    console.warn("Diary Engine: Waiting for database nodes...");
  }
};

resolveModules();

/** --- TYPES --- **/

interface SiteDiaryEngineProps {
  projectId: string | null;
}

/** --- MAIN COMPONENT: SITE DIARY & PROGRESS LOG --- **/

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
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  
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

  /** * 1. DATA RECOVERY: LOAD PROJECTS & PAST UPDATES */
  const syncWorkspaceData = useCallback(async (forceReloadForm = false) => {
    if (!db || !user) {
        setTimeout(() => setIsLoading(false), 800);
        return;
    }

    try {
      // Don't trigger global loading if we are just updating the list in the background
      if (forceReloadForm) setIsLoading(true);

      const projects = await db.projects.where('user_id').equals(user.id).toArray();
      setAvailableProjects(projects);

      if (selectedId) {
        const allProjectDiaries = await db.site_diary.where('project_id').equals(selectedId).toArray();
        
        if (forceReloadForm) {
            const entry = allProjectDiaries.find((d: any) => d.date === diaryData.date);
            if (entry) {
                setDiaryData(entry);
            }
        }

        if (!diaryData.id) {
            setDiaryData(prev => ({ ...prev, id: crypto.randomUUID() }));
        }

        const photos = await db.site_photos.where('project_id').equals(selectedId).toArray();
        const filteredPhotos = photos.filter((p: any) => p.timestamp?.startsWith(diaryData.date));
        setDayPhotos(filteredPhotos);

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
  }, [selectedId, user, diaryData.date, diaryData.id]);

  useEffect(() => {
    syncWorkspaceData(true);
  }, [selectedId, syncWorkspaceData]);

  /** * 2. PHOTO MANAGEMENT */
  const handleCapturePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedId) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const photoRecord = {
          id: crypto.randomUUID(),
          project_id: selectedId,
          url: reader.result as string,
          timestamp: new Date(diaryData.date).toISOString(), 
          task_tag: 'Site Evidence'
        };

        try {
          await db.site_photos.add(photoRecord);
          if (syncEngine) await syncEngine.queueChange('site_photos', photoRecord.id, 'INSERT', photoRecord);
          setDayPhotos(prev => [...prev, photoRecord]);
          setShowSavedNotification(true);
          setTimeout(() => setShowSavedNotification(false), 2000);
        } catch (err) { console.error("Photo saving failed."); }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!db || !window.confirm("Are you sure you want to delete this photo?")) return;
    try {
      await db.site_photos.delete(id);
      if (syncEngine) await syncEngine.queueChange('site_photos', id, 'DELETE', null);
      setDayPhotos(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      console.error("Removal failed.");
    }
  };

  /** * 3. SAVE CURRENT UPDATE */
  const handleSaveDiary = async () => {
    if (!selectedId || !db) return;
    setIsSaving(true);
    
    const record = {
      ...diaryData,
      project_id: selectedId,
      updated_at: new Date().toISOString()
    };

    try {
      await db.site_diary.put(record);
      if (syncEngine) {
        await syncEngine.queueChange('site_diary', record.id, 'UPDATE', record);
      }
      
      setShowSavedNotification(true);
      
      setTimeout(() => {
        setIsSaving(false);
        // Clear fields for a new entry after saving
        setDiaryData(prev => ({ 
          ...prev, 
          id: crypto.randomUUID(),
          progress_summary: '', 
          headcount: 0 
        })); 
        syncWorkspaceData(false);
        setTimeout(() => setShowSavedNotification(false), 3000);
      }, 600);
    } catch (err) {
      setIsSaving(false);
    }
  };

  const handleManualReset = () => {
     setDiaryData(prev => ({
        ...prev,
        progress_summary: '',
        headcount: 0
     }));
     syncWorkspaceData(false);
  };

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm("Permanently delete this project record?")) return;
    try {
      await db.site_diary.delete(id);
      if (syncEngine) await syncEngine.queueChange('site_diary', id, 'DELETE', null);
      syncWorkspaceData(false);
    } catch (err) { console.error("Deletion failed."); }
  };

  if (isLoading && !viewingHistory) {
    return (
      <div className="flex flex-col items-center justify-center p-40 opacity-30">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-amber-500" />
        <p className={`font-black text-[10px] uppercase tracking-[0.5em] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-950'}`}>Syncing Records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left pb-10">
      
      {/* 1. PROJECT SELECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-4">
        <div className="space-y-3 text-left">
          <h3 className={`text-4xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Daily Site Diary</h3>
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
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">Active Project</p>
          </div>
        </div>

        {showSavedNotification && (
            <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 animate-in zoom-in duration-300 shadow-lg shadow-emerald-500/5">
                <CheckCircle2 size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Record Saved</span>
            </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        
        {/* LEFT COLUMN: TODAY'S ENTRY */}
        <div className="lg:col-span-2 space-y-10">
          <div className={`p-10 sm:p-14 rounded-[4rem] border shadow-2xl transition-all duration-500
            ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
            
            <header className="flex justify-between items-start mb-14 text-left">
              <div className="space-y-3 text-left">
                <h3 className={`text-3xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Write Today's Update</h3>
                <div className="flex items-center gap-3">
                  <Calendar size={14} className="text-amber-500" />
                  <p className={`text-[11px] font-black uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-900'}`}>
                    {new Date(diaryData.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={handleManualReset} 
                className={`p-4 rounded-2xl border transition-all active:scale-90 ${theme === 'dark' ? 'border-zinc-800 text-zinc-500 hover:text-white bg-zinc-950/40' : 'border-zinc-200 text-zinc-400 hover:text-zinc-900 bg-zinc-50 shadow-inner'}`}
                title="Reset Form"
              >
                <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </header>

            <div className="space-y-16">
              {/* Weather Selection */}
              <div className="space-y-6 text-left">
                <label className={`text-[12px] font-black uppercase ml-4 tracking-[0.3em] italic ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-950'}`}>Weather Today</label>
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
                          ? 'bg-amber-500 border-amber-600 text-black shadow-xl shadow-amber-500/20' 
                          : 'bg-zinc-950/20 border-zinc-800 text-zinc-500 hover:border-zinc-500'}`}
                    >
                      <opt.icon size={32} strokeWidth={2.5} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Workforce Input */}
              <div className="space-y-6 text-left">
                <label className={`text-[12px] font-black uppercase ml-4 tracking-[0.3em] italic ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-950'}`}>How many people are working?</label>
                <div className="relative group">
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
              </div>

              {/* Work Done Textarea */}
              <div className="space-y-6 text-left">
                <label className={`text-[12px] font-black uppercase ml-4 tracking-[0.3em] italic ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-950'}`}>What was done today?</label>
                <textarea 
                  rows={6}
                  placeholder="Record work completed, major deliveries, or delays..."
                  value={diaryData.progress_summary}
                  onChange={(e) => setDiaryData({...diaryData, progress_summary: e.target.value})}
                  className={`w-full p-10 rounded-[3.5rem] border outline-none transition-all text-lg font-medium shadow-inner
                    ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-300 focus:border-amber-500/50' : 'bg-zinc-50 border-zinc-200 text-zinc-950 focus:border-amber-500'}`}
                />
              </div>
            </div>

            <div className="mt-16 pt-12 border-t border-zinc-800/40">
              <button 
                onClick={handleSaveDiary}
                disabled={isSaving}
                className="w-full py-9 bg-amber-500 text-black rounded-[2.5rem] font-black uppercase text-sm tracking-[0.6em] shadow-2xl hover:bg-amber-400 active:scale-[0.98] transition-all flex items-center justify-center gap-6 italic shadow-amber-500/20"
              >
                {isSaving ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} strokeWidth={3.5} />}
                Save to Project History
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PHOTOS & HISTORY */}
        <div className="space-y-8 flex flex-col">
          
          {/* Photo Evidence Node */}
          <div className={`p-10 rounded-[4rem] border shadow-2xl flex flex-col transition-all
            ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-xl shadow-zinc-200/50'}`}>
            
            <div className="flex justify-between items-center mb-10 text-left">
              <div className="flex items-center gap-4 text-left">
                <Camera size={24} className="text-blue-500" />
                <h3 className={`text-[12px] font-black uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-900'}`}>Site Photos</h3>
              </div>
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{dayPhotos.length} Added</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
               {dayPhotos.map((p) => (
                 <div key={p.id} className="aspect-square rounded-3xl overflow-hidden border border-zinc-800 shadow-lg relative group animate-in zoom-in duration-300">
                    <img src={p.url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Site Update" />
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeletePhoto(p.id); }}
                      className="absolute top-3 right-3 p-2.5 bg-rose-500 text-white rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-600 active:scale-90 z-20"
                    >
                       <X size={14} strokeWidth={4} />
                    </button>

                    <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 pointer-events-none">
                       <p className="text-[8px] font-black uppercase text-white tracking-widest leading-none">
                         {new Date(p.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                       </p>
                    </div>
                 </div>
               ))}

               {/* Add Photo Trigger */}
               <label className={`aspect-square border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center opacity-40 group hover:opacity-100 hover:border-amber-500/40 transition-all cursor-pointer bg-zinc-950/20 shadow-inner
                  ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'}`}>
                  <FileUp size={32} className="text-zinc-700 group-hover:text-amber-500 transition-colors" />
                  <p className="text-[8px] font-black uppercase tracking-widest mt-3 text-center px-4">Take Photo</p>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCapturePhoto} />
               </label>
            </div>

            <div className="mt-6 p-6 bg-zinc-950/60 rounded-[2.5rem] border border-zinc-800 text-left shadow-inner">
               <div className="flex items-center gap-4 mb-4 opacity-50">
                  <History size={16} className="text-zinc-500" />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-900'}`}>Project History</span>
               </div>
               <button 
                onClick={() => setViewingHistory(true)}
                className="w-full py-5 rounded-2xl border border-zinc-800 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all active:scale-95 shadow-xl bg-zinc-900/40"
               >
                  See Past Records
               </button>
            </div>
          </div>

          <div className={`p-10 rounded-[3.5rem] border transition-all duration-500 flex justify-between items-center group shadow-xl
             ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
             <div className="text-left">
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-3 leading-none ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-900'}`}>Deliveries Today</p>
                <p className={`text-5xl font-black italic tracking-tighter leading-none transition-colors group-hover:text-amber-500
                   ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-950'}`}>
                  {deliveryCount.toString().padStart(2, '0')}
                </p>
             </div>
             <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl text-zinc-700 group-hover:text-amber-500 transition-all shadow-inner">
                <Truck size={32} />
             </div>
          </div>
        </div>
      </div>

      {/* 3. ARCHIVE OVERLAY (UPDATED WITH EXPANDABLE ROWS) */}
      {viewingHistory && (
        <div className="fixed inset-0 z-100] flex items-center justify-center p-6 sm:p-20 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className={`w-full max-w-5xl rounded-[4.5rem] border p-8 sm:p-14 shadow-2xl relative animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col h-[85vh]
            ${theme === 'dark' ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}`}>
            
            <button onClick={() => { setViewingHistory(false); setExpandedRecordId(null); }} className="absolute top-10 right-10 p-5 bg-zinc-900 rounded-2xl text-zinc-500 hover:text-white shadow-lg transition-all active:scale-90 border border-zinc-800 z-20"><X size={28}/></button>
            
            <div className="mb-12 text-left space-y-3">
              <h4 className={`text-4xl sm:text-5xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Project History</h4>
              <p className="text-[11px] font-black uppercase text-zinc-500 tracking-[0.5em] italic text-left">Search and review past site updates</p>
            </div>

            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-6 pb-10">
               {pastRecords.length > 0 ? pastRecords.map(rec => {
                 const isExpanded = expandedRecordId === rec.id;
                 return (
                   <div key={rec.id} className={`rounded-[3.5rem] border transition-all duration-500 overflow-hidden flex flex-col group
                     ${theme === 'dark' 
                        ? (isExpanded ? 'bg-zinc-900 border-amber-500/40 shadow-amber-500/5 shadow-2xl' : 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700') 
                        : (isExpanded ? 'bg-white border-amber-500/40 shadow-xl' : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300')}`}>
                      
                      {/* Record Row Header */}
                      <div className="p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                         <div className="text-left flex-1 space-y-4">
                            <div className="flex items-center gap-4">
                               <span className="px-4 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-black text-amber-500 uppercase italic leading-none">{new Date(rec.date).toDateString()}</span>
                               <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-zinc-200 text-zinc-600'}`}>
                                  {rec.weather}
                               </span>
                            </div>
                            <h5 className={`text-2xl font-black uppercase italic tracking-tight transition-colors 
                              ${theme === 'dark' ? 'text-zinc-100 group-hover:text-white' : 'text-zinc-950'}`}>
                              {rec.progress_summary ? (rec.progress_summary.slice(0, 60) + "...") : "No description."}
                            </h5>
                         </div>

                         <div className="flex items-center gap-4">
                            {/* Expansion Button */}
                            <button 
                              onClick={() => setExpandedRecordId(isExpanded ? null : rec.id)}
                              className={`flex items-center gap-3 px-6 py-4 rounded-2xl border font-black uppercase text-[10px] tracking-widest transition-all
                                ${theme === 'dark' 
                                  ? (isExpanded ? 'bg-amber-500 text-black border-amber-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white') 
                                  : (isExpanded ? 'bg-amber-500 text-black border-amber-400 shadow-lg' : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900')}`}
                            >
                               {isExpanded ? <Eye size={18} strokeWidth={3} /> : <Eye size={18} />}
                               {isExpanded ? 'Collapse' : 'View Full Details'}
                            </button>
                            
                            {/* Restore Button (The fix for the blank screen) */}
                            <button 
                              onClick={() => { setDiaryData(rec); setViewingHistory(false); setExpandedRecordId(null); }}
                              className="p-4 bg-zinc-950 text-emerald-500 border border-zinc-800 rounded-2xl shadow-xl hover:bg-emerald-500 hover:text-black transition-all active:scale-95"
                              title="Copy back to editor"
                            >
                               <RefreshCw size={22} strokeWidth={2.5} />
                            </button>
                            
                            <button 
                              onClick={() => handleDeleteRecord(rec.id)}
                              className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-lg active:scale-95"
                            >
                               <Trash2 size={22} />
                            </button>
                         </div>
                      </div>

                      {/* Expandable Body */}
                      {isExpanded && (
                        <div className="p-10 border-t border-zinc-800/40 bg-zinc-950/20 animate-in slide-in-from-top-4 duration-500 space-y-10">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              <div className="space-y-4 text-left">
                                 <div className="flex items-center gap-3 opacity-60">
                                    <Layout size={16} className="text-amber-500" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-left">Complete Summary</p>
                                 </div>
                                 <p className={`text-lg font-medium leading-relaxed italic text-left ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                    "{rec.progress_summary || "Nothing recorded."}"
                                 </p>
                              </div>
                              <div className="grid grid-cols-2 gap-6 h-fit">
                                 <div className={`p-6 rounded-4xl border ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
                                    <p className="text-[9px] font-black uppercase text-zinc-500 mb-2 leading-none text-left">Workers</p>
                                    <p className="text-3xl font-black text-white text-left italic tracking-tighter leading-none">{rec.headcount}</p>
                                 </div>
                                 <div className={`p-6 rounded-4xl border ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
                                    <p className="text-[9px] font-black uppercase text-zinc-500 mb-2 leading-none text-left">Status</p>
                                    <p className="text-[11px] font-black text-emerald-500 text-left uppercase tracking-widest leading-none">Secured</p>
                                 </div>
                              </div>
                           </div>

                           <div className="pt-8 border-t border-zinc-800/40 flex justify-between items-center opacity-40 italic">
                              <p className="text-[9px] font-black uppercase tracking-widest">ID Reference: {rec.id}</p>
                              <ShieldCheck size={16} className="text-emerald-500" />
                           </div>
                        </div>
                      )}
                   </div>
                 );
               }) : (
                 <div className="py-24 text-center opacity-20">
                    <Package size={80} className="mx-auto mb-8" />
                    <p className="font-black uppercase text-base tracking-widest italic leading-none">No history found.</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      <footer className="col-span-full pt-16 text-center opacity-20 select-none pb-10">
         <p className="text-[9px] font-black uppercase tracking-[1.8em] text-zinc-600 italic leading-none text-center">
           SECURE SITE RECORDING ENGINE • QS VAULT
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