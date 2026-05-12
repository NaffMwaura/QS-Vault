/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileEdit,
  Trash2,
  Loader2,
  X,
  ShieldCheck,
  Briefcase,
  ChevronDown,
  RefreshCw,
  Eye,
  Layout,
  Send,
  Scale,
  Zap,
} from "lucide-react";

/* ======================================================
    OFFICE MODULE RESOLUTION (STABILIZED)
   ====================================================== */

let useAuth: any = () => ({ theme: "light", user: null, isOnline: true });
let db: any = null;
let syncEngine: any = null;

const resolveInfrastructure = async () => {
  try {
    const authMod = await import("../../auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const dbMod = await import("../../../lib/database/database");
    if (dbMod.db) db = dbMod.db;
    if (dbMod.syncEngine) syncEngine = dbMod.syncEngine;
  } catch (e) {
    console.warn("Bridge Engine: Handshake nodes in standby.");
  }
};

resolveInfrastructure();

/** --- TYPES --- **/
interface Variation {
  id: string;
  project_id: string;
  site_log_id: string | null;
  description: string;
  qs_pricing_status: "unpriced" | "pending" | "approved";
  estimated_cost: number;
  approved_sum?: number;
  created_at: string;
}

interface VariationBridgeProps {
  projectId: string | null;
}

/** --- MAIN COMPONENT: THE SITE CHANGE HUB --- **/

const VariationBridge: React.FC<VariationBridgeProps> = ({ projectId: initialId }) => {
  const { user, theme, } = useAuth();
  
  // WORKSPACE CONTEXT
  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  
  // DATA STATES
  const [variations, setVariations] = useState<Variation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // FORM STATES
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVariation, setNewVariation] = useState({
    description: "",
    estimated_cost: 0,
  });

  /** * 1. DATA HARVEST: LOAD PROJECTS & SECURED CHANGES */
  const syncBridgeData = useCallback(async () => {
    if (!db || !user) {
      setTimeout(() => setIsLoading(false), 1000);
      return;
    }

    try {
      if (isLoading) setIsLoading(true);

      // Load projects for the context switcher
      const projects = await db.projects.where("user_id").equals(user.id).toArray();
      setAvailableProjects(projects);

      const activeId = selectedId || (projects.length > 0 ? projects[0].id : null);
      if (activeId && activeId !== selectedId) setSelectedId(activeId);

      if (activeId) {
        const storedVariations = await db.variations
          .where("project_id")
          .equals(activeId)
          .reverse()
          .toArray();
        setVariations(storedVariations);
      }
    } catch (err) {
      console.error("Bridge: Vault access denied.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedId, user, isLoading]);

  useEffect(() => {
    syncBridgeData();
  }, [syncBridgeData]);

  /** * 2. COMMIT CHANGE TO VAULT */
  const handleLogChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !db || !newVariation.description) return;

    setIsSaving(true);
    const variationId = crypto.randomUUID();
    const variationData: Variation = {
      id: variationId,
      project_id: selectedId,
      site_log_id: null,
      description: newVariation.description,
      estimated_cost: newVariation.estimated_cost,
      qs_pricing_status: "unpriced",
      created_at: new Date().toISOString(),
    };

    try {
      await db.variations.add(variationData);
      if (syncEngine) await syncEngine.queueChange("variations", variationId, "INSERT", variationData);
      
      setNewVariation({ description: "", estimated_cost: 0 });
      setShowAddForm(false);
      setShowSavedToast(true);
      await syncBridgeData();
      setTimeout(() => setShowSavedToast(false), 3000);
    } catch (err) {
      console.error("Change archival failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("ERASE RECORD: Permanently remove this variation from the ledger?")) return;
    try {
      await db.variations.delete(id);
      if (syncEngine) await syncEngine.queueChange("variations", id, "DELETE", null);
      syncBridgeData();
    } catch (e) { console.error("Purge failed."); }
  };

  const totals = useMemo(() => {
    const unpriced = variations.filter(v => v.qs_pricing_status === "unpriced").length;
    const value = variations.reduce((acc, curr) => acc + (curr.estimated_cost || 0), 0);
    return { unpriced, value };
  }, [variations]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-40 opacity-30">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-amber-500" />
        <p className={`font-black text-[10px] uppercase tracking-[0.5em] italic ${theme === "dark" ? "text-zinc-500" : "text-zinc-950"}`}>
          Recalibrating Change Bridge...
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 space-y-12 pb-20 text-left duration-700 max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* 1. MASTER COMMAND HUD (CONTEXT SELECTOR) */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div className="space-y-4 w-full lg:w-auto text-left">
          <div className="flex items-center gap-4">
             <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500 shadow-inner">
                <Scale size={20} strokeWidth={2.5} />
             </div>
             <p className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">Project Variation Controller</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
             <div className="relative group min-w-280px] sm:min-w-340px]">
                <Briefcase size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500 z-10" />
                <select 
                  value={selectedId || ''} 
                  onChange={(e) => setSelectedId(e.target.value)}
                  className={`w-full pl-14 pr-12 py-4 rounded-2xl border-2 appearance-none font-black uppercase text-[11px] tracking-widest cursor-pointer outline-none transition-all
                    ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white hover:border-amber-500 shadow-black' : 'bg-white border-zinc-200 text-zinc-950 hover:border-amber-500 shadow-sm'}`}
                >
                  {availableProjects.length > 0 ? (
                    availableProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                  ) : (
                    <option value="">No Active Projects</option>
                  )}
                </select>
                <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none z-10" />
             </div>
             
             <button 
                onClick={() => { setIsRefreshing(true); syncBridgeData(); }} 
                className={`p-4 rounded-xl border-2 transition-all active:scale-90 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-amber-500' : 'bg-white border-zinc-100 text-zinc-400 hover:text-amber-600 shadow-sm'}`}
                title="Sync Bridge Data"
             >
                <RefreshCw size={20} className={isRefreshing ? 'animate-spin text-amber-500' : ''} />
             </button>

             {showSavedToast && (
                <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 animate-in zoom-in duration-300">
                    <CheckCircle2 size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Identity Synced</span>
                </div>
             )}
          </div>
        </div>

        <div className="flex gap-4 w-full lg:w-auto">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-4 rounded-2xl bg-amber-500 px-10 py-5 text-[11px] font-black uppercase italic tracking-widest text-black shadow-2xl shadow-amber-500/20 transition-all hover:bg-amber-400 active:scale-95 border-2 border-amber-300"
          >
            {showAddForm ? <X size={20} strokeWidth={3} /> : <Plus size={20} strokeWidth={3} />}
            {showAddForm ? "Abort Entry" : "Log Site Change"}
          </button>
        </div>
      </header>

      {/* 2. SUMMARY DASHBOARD */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className={`p-10 rounded-[3.5rem] border-2 shadow-2xl transition-all duration-500 flex justify-between items-center group
          ${theme === "dark" ? "bg-zinc-900/40 border-zinc-800 shadow-black" : "bg-white border-zinc-200 shadow-zinc-200/50"}`}>
          <div className="space-y-3 text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">Unpriced Variations</p>
            <p className={`text-7xl font-black italic tracking-tighter ${totals.unpriced > 0 ? "text-amber-500" : "text-zinc-700"}`}>
              {totals.unpriced.toString().padStart(2, "0")}
            </p>
          </div>
          <div className={`p-6 rounded-3xl border-2 shadow-lg transition-all group-hover:scale-110 ${theme === "dark" ? "border-zinc-800 bg-zinc-950" : "border-zinc-100 bg-zinc-50"} text-amber-500 shadow-amber-500/5`}>
            <AlertCircle size={36} strokeWidth={2.5} />
          </div>
        </div>

        <div className={`p-10 rounded-[3.5rem] border-2 shadow-2xl transition-all duration-500 flex justify-between items-center group
          ${theme === "dark" ? "bg-zinc-900/40 border-zinc-800 shadow-black" : "bg-white border-zinc-200 shadow-zinc-200/50"}`}>
          <div className="space-y-3 text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">Exposure Delta</p>
            <p className={`text-7xl font-black italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
              <span className="text-xl font-bold mr-2 not-italic text-amber-500">KES</span>
              {totals.value >= 1000000 ? `${(totals.value / 1000000).toFixed(2)}M` : totals.value >= 1000 ? `${(totals.value / 1000).toFixed(1)}K` : totals.value}
            </p>
          </div>
          <div className={`p-6 rounded-3xl border-2 shadow-lg transition-all group-hover:scale-110 ${theme === "dark" ? "border-zinc-800 bg-zinc-950" : "border-zinc-100 bg-zinc-50"} text-emerald-500 shadow-emerald-500/5`}>
            <TrendingUp size={36} strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* 3. MAIN LEDGER WORKSPACE */}
      <div className={`rounded-[4.5rem] border-2 backdrop-blur-3xl overflow-hidden transition-all duration-500 shadow-2xl
        ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
        
        {/* LOG FORM NODE */}
        {showAddForm && (
          <form onSubmit={handleLogChange} className="animate-in slide-in-from-top-6 space-y-12 border-b-2 border-amber-500/20 bg-zinc-950/20 p-12 sm:p-16">
            <div className="flex items-center gap-4 border-l-4 border-amber-500 px-6 mb-12">
               <h4 className="text-3xl font-black uppercase italic tracking-tighter leading-none">New Site Instruction</h4>
            </div>
            
            <div className="grid gap-12 md:grid-cols-2">
              <div className="space-y-4 text-left">
                <label className="ml-5 text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">Change Description</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Record what is different from the original drawings..."
                  value={newVariation.description}
                  onChange={(e) => setNewVariation({ ...newVariation, description: e.target.value })}
                  className={`w-full p-10 rounded-[3rem] border-2 font-medium text-lg outline-none transition-all shadow-inner leading-relaxed
                    ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-950 focus:border-amber-500'}`}
                />
              </div>
              <div className="space-y-12">
                <div className="space-y-4 text-left">
                    <label className="ml-5 text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">Preliminary Cost Estimate</label>
                    <div className="relative group">
                      <span className="absolute left-10 top-1/2 -translate-y-1/2 text-amber-500 font-black text-2xl italic opacity-40">KES</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={newVariation.estimated_cost || ""}
                        onChange={(e) => setNewVariation({ ...newVariation, estimated_cost: parseInt(e.target.value) || 0 })}
                        className={`w-full p-10 pl-28 rounded-[3rem] border-2 font-black text-6xl italic tracking-tighter outline-none transition-all shadow-inner
                          ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-950 focus:border-amber-500'}`}
                      />
                    </div>
                </div>
                <button type="submit" disabled={isSaving} className="w-full h-24 bg-amber-500 text-black font-black uppercase text-xs tracking-[0.5em] rounded-[2.5rem] shadow-2xl hover:bg-amber-400 transition-all flex items-center justify-center gap-6 italic active:scale-[0.98] shadow-amber-500/20 border-4 border-black/5">
                  {isSaving ? <Loader2 size={32} className="animate-spin" /> : <Send size={32} strokeWidth={2.5} />}
                  Secure to Project Vault
                </button>
              </div>
            </div>
          </form>
        )}

        {/* LEDGER LIST */}
        <div className="space-y-8 p-8 sm:p-16">
          <div className="flex items-center justify-between mb-12 px-4">
             <div className="text-left space-y-2">
                <h3 className={`text-4xl font-black uppercase italic leading-none tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Technical Ledger</h3>
                <p className="text-[10px] font-black uppercase italic tracking-[0.4em] text-zinc-500">Immutable Change Records</p>
             </div>
             <div className={`px-6 py-3 rounded-full border-2 text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-500 shadow-inner'}`}>
                {variations.length} Active Nodes
             </div>
          </div>

          {variations.length > 0 ? (
            <div className="grid grid-cols-1 gap-8">
              {variations.map((v) => {
                const isExpanded = expandedId === v.id;
                return (
                  <div key={v.id} className={`rounded-[4rem] border-2 transition-all duration-500 overflow-hidden flex flex-col group relative
                    ${theme === 'dark' 
                        ? (isExpanded ? 'bg-zinc-900 border-amber-500/40 shadow-amber-500/5 shadow-2xl' : 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700') 
                        : (isExpanded ? 'bg-white border-amber-500/40 shadow-xl' : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300')}`}>
                    
                    <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-10 transition-opacity pointer-events-none">
                        <BarChart3 size={160} />
                    </div>

                    {/* ROW HEADER */}
                    <div className="p-10 flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
                       <div className="text-left flex-1 space-y-5">
                          <div className="flex items-center gap-5">
                             <div className={`p-3.5 rounded-xl border-2 ${v.qs_pricing_status === 'unpriced' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                                <FileEdit size={18} strokeWidth={2.5} />
                             </div>
                             <span className="text-[11px] font-mono font-black text-zinc-500 uppercase italic tracking-widest">VARIATION_NODE_{v.id.slice(0, 6).toUpperCase()}</span>
                          </div>
                          <h4 className={`text-3xl font-black uppercase italic tracking-tight transition-colors leading-tight
                            ${theme === 'dark' ? 'text-zinc-100 group-hover:text-amber-500' : 'text-zinc-950'}`}>
                            {v.description.length > 65 ? v.description.slice(0, 65) + "..." : v.description}
                          </h4>
                       </div>

                       <div className="flex flex-wrap items-center gap-6">
                          <div className="text-right hidden sm:block">
                             <p className="text-[10px] font-black uppercase text-zinc-600 leading-none mb-2 italic">Estimator Node</p>
                             <p className="text-4xl font-black italic tracking-tighter text-amber-500 shadow-amber-500/10">KES {v.estimated_cost.toLocaleString()}</p>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => setExpandedId(isExpanded ? null : v.id)}
                              className={`flex items-center gap-4 px-8 py-5 rounded-[1.8rem] border-2 font-black uppercase text-[11px] tracking-widest transition-all active:scale-95 shadow-xl
                                ${theme === 'dark' 
                                  ? (isExpanded ? 'bg-amber-500 text-black border-amber-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white') 
                                  : (isExpanded ? 'bg-amber-500 text-black border-amber-400' : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900')}`}
                            >
                               {isExpanded ? <X size={20} strokeWidth={3} /> : <Eye size={20} strokeWidth={2.5} />} {isExpanded ? 'Close' : 'Review'}
                            </button>
                            
                            <button onClick={() => handleDelete(v.id)} className="p-5 bg-rose-500/10 text-rose-500 border-2 border-rose-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-all active:scale-90 hover:bg-rose-500 hover:text-white shadow-rose-500/10">
                               <Trash2 size={24} />
                            </button>
                          </div>
                       </div>
                    </div>

                    {/* EXPANDED DETAILS */}
                    {isExpanded && (
                      <div className="p-12 border-t-2 border-zinc-800/40 bg-zinc-950/20 animate-in slide-in-from-top-6 duration-500 space-y-12 relative z-10">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                            <div className="space-y-6 text-left">
                               <div className="flex items-center gap-4 opacity-50">
                                  <Layout size={18} className="text-amber-500" />
                                  <p className="text-[11px] font-black uppercase tracking-widest">Full Technical Narrative</p>
                               </div>
                               <p className={`text-xl font-medium leading-relaxed italic ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                                  "{v.description}"
                               </p>
                            </div>
                            <div className="space-y-8">
                               <div className={`p-10 rounded-[3rem] border-2 transition-all ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800 shadow-inner' : 'bg-white border-zinc-200 shadow-sm'}`}>
                                  <div className="flex justify-between items-center mb-4">
                                     <p className="text-[10px] font-black uppercase text-zinc-500 leading-none italic">Valuation Progress</p>
                                     <div className={`w-2 h-2 rounded-full ${v.qs_pricing_status === 'unpriced' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                                  </div>
                                  <p className={`text-2xl font-black text-left uppercase tracking-[0.2em] leading-none ${v.qs_pricing_status === 'unpriced' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                     {v.qs_pricing_status}
                                  </p>
                               </div>
                               <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.4em] text-zinc-600 px-6">
                                  <Clock size={16} strokeWidth={3} />
                                  <span>Logged: {new Date(v.created_at).toDateString()}</span>
                               </div>
                            </div>
                         </div>
                         <div className="pt-10 border-t-2 border-zinc-800/40 flex justify-between items-center opacity-40 italic">
                            <div className="flex items-center gap-3">
                               <Zap size={14} className="text-amber-500" />
                               <p className="text-[10px] font-black uppercase tracking-widest leading-none">Vault Handshake Secured</p>
                            </div>
                            <ShieldCheck size={20} className="text-emerald-500" />
                         </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-48 text-center opacity-10 flex flex-col items-center gap-12 border-2 border-dashed border-zinc-800 rounded-[4rem] mx-10 mb-10">
              <BarChart3 size={120} strokeWidth={1} />
              <p className="font-black uppercase text-2xl tracking-[0.6em] italic leading-none">Change Ledger Empty</p>
            </div>
          )}
        </div>

        <div className={`p-10 border-t-2 border-zinc-800/40 flex items-center justify-between opacity-30 shadow-inner
          ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50'}`}>
           <div className="flex items-center gap-5 text-left">
              <ShieldCheck size={24} className="text-emerald-500 shadow-emerald-500/10" />
              <div className="text-left">
                <p className="text-[11px] font-black uppercase tracking-widest leading-none text-zinc-500">Audit Protocol Active</p>
                <p className="text-[9px] font-black uppercase tracking-widest mt-1 text-zinc-700">Verifying Project Node: {selectedId?.slice(0, 12).toUpperCase()}</p>
              </div>
           </div>
           <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest leading-none mt-1">BRIDGE_OS_v4.5 • ISO_19650</p>
        </div>
      </div>

      <footer className="pt-32 pb-12 text-center opacity-10 select-none flex flex-col items-center gap-10">
         <div className="h-px w-80 bg-zinc-800" />
         <p className="text-[11px] font-black uppercase tracking-[2.5em] text-zinc-600 italic leading-none text-center">
           CHANGE MONITOR ENGINE • QS VAULT
         </p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 20px; border: 1px solid transparent; background-clip: content-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
      `}</style>
    </div>
  );
};

export default VariationBridge;