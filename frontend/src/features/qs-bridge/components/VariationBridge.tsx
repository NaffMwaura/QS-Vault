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
  HardHat,
  X,
  ShieldCheck,
  DollarSign,
  Calculator,
  ArrowRight,
  Briefcase,
  ChevronDown,
  RefreshCw,
  Eye,
  Layout,
  Send
} from "lucide-react";
import Button from "../../../components/ui/Button";

/* ======================================================
    OFFICE MODULE RESOLUTION (STABILIZED)
   ====================================================== */

let useAuth: any = () => ({ theme: "light", user: null });
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
    console.warn("Bridge Engine: Waiting for database nodes...");
  }
};

resolveModules();

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
  const { user, theme } = useAuth();
  
  // WORKSPACE CONTEXT
  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  
  // DATA STATES
  const [variations, setVariations] = useState<Variation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // FORM STATES
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVariation, setNewVariation] = useState({
    description: "",
    estimated_cost: 0,
  });

  /** * 1. DATA RECOVERY: LOAD PROJECTS & SAVED CHANGES */
  const syncBridgeData = useCallback(async () => {
    if (!db || !user) {
      setTimeout(() => setIsLoading(false), 800);
      return;
    }

    try {
      setIsLoading(true);

      // Load all projects for the selector
      const projects = await db.projects.where("user_id").equals(user.id).toArray();
      setAvailableProjects(projects);

      // Determine active project
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
      console.error("Bridge access deferred.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedId, user]);

  useEffect(() => {
    syncBridgeData();
  }, [syncBridgeData]);

  /** * 2. LOG NEW CHANGE */
  const handleLogChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !db) return;

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
      console.error("Save failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
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
        <p className={`font-black text-[10px] uppercase tracking-[0.5em] ${theme === "dark" ? "text-zinc-500" : "text-zinc-950"}`}>
          Syncing Change Hub...
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-12 pb-10 text-left duration-700">
      
      {/* 1. MASTER CONTEXT CONTROL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-4">
        <div className="space-y-3 text-left">
          <h3 className={`text-4xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Site Change Hub</h3>
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
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">Project Active</p>
          </div>
        </div>

        {showSavedToast && (
            <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 animate-in zoom-in duration-300 shadow-lg">
                <CheckCircle2 size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Record Logged</span>
            </div>
        )}
      </div>

      {/* 2. SUMMARY GRID */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className={`p-10 rounded-[3.5rem] border shadow-2xl transition-all duration-500 flex justify-between items-center
          ${theme === "dark" ? "bg-zinc-900/40 border-zinc-800 shadow-black" : "bg-white border-zinc-200 shadow-zinc-200/50"}`}>
          <div className="space-y-2 text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">New Site Changes</p>
            <p className={`text-6xl font-black italic tracking-tighter ${totals.unpriced > 0 ? "text-amber-500" : "text-zinc-500"}`}>
              {totals.unpriced.toString().padStart(2, "0")}
            </p>
          </div>
          <div className={`p-6 rounded-3xl border shadow-lg ${theme === "dark" ? "border-zinc-800 bg-zinc-950" : "border-zinc-100 bg-zinc-50"} text-amber-500`}>
            <AlertCircle size={32} strokeWidth={2.5} />
          </div>
        </div>

        <div className={`p-10 rounded-[3.5rem] border shadow-2xl transition-all duration-500 flex justify-between items-center
          ${theme === "dark" ? "bg-zinc-900/40 border-zinc-800 shadow-black" : "bg-white border-zinc-200 shadow-zinc-200/50"}`}>
          <div className="space-y-2 text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Estimated Extra Cost</p>
            <p className={`text-6xl font-black italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
              <span className="text-xl font-bold mr-2 not-italic text-amber-500">KES</span>
              {totals.value >= 1000 ? `${(totals.value / 1000).toFixed(1)}k` : totals.value}
            </p>
          </div>
          <div className={`p-6 rounded-3xl border shadow-lg ${theme === "dark" ? "border-zinc-800 bg-zinc-950" : "border-zinc-100 bg-zinc-50"} text-emerald-500`}>
            <TrendingUp size={32} strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* 3. MAIN LEDGER WORKSPACE */}
      <div className={`rounded-[4rem] border backdrop-blur-3xl overflow-hidden transition-all duration-500 shadow-2xl
        ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
        
        <div className="flex flex-col items-start justify-between gap-8 border-b border-zinc-800/40 bg-white/[0.01] p-10 md:flex-row md:items-center">
          <div className="space-y-2 text-left">
            <h3 className={`text-3xl font-black uppercase italic leading-none tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Change Ledger</h3>
            <p className="text-[10px] font-black uppercase italic tracking-[0.4em] text-zinc-500">Track and price site modifications</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-4 rounded-2xl bg-amber-500 px-10 py-6 text-xs font-black uppercase italic tracking-[0.2em] text-black shadow-2xl shadow-amber-500/20 transition-all hover:bg-amber-400 active:scale-95 border-2 border-amber-300"
          >
            {showAddForm ? <X size={22} /> : <Plus size={22} strokeWidth={3} />}
            {showAddForm ? "Close Editor" : "Log New Change"}
          </button>
        </div>

        {/* LOG FORM NODE */}
        {showAddForm && (
          <form onSubmit={handleLogChange} className="animate-in slide-in-from-top-4 space-y-12 border-b border-amber-500/20 bg-zinc-950/20 p-12">
            <div className="grid gap-12 md:grid-cols-2">
              <div className="space-y-4 text-left">
                <label className="ml-4 text-[11px] font-black uppercase tracking-widest text-zinc-500 italic">Describe the change</label>
                <input
                  required
                  placeholder="What is different from the original plan?"
                  value={newVariation.description}
                  onChange={(e) => setNewVariation({ ...newVariation, description: e.target.value })}
                  className={`w-full p-8 rounded-[2.5rem] border font-bold text-lg outline-none transition-all shadow-inner
                    ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200'}`}
                />
              </div>
              <div className="space-y-4 text-left">
                <label className="ml-4 text-[11px] font-black uppercase tracking-widest text-zinc-500 italic">Rough Estimate (KES)</label>
                <div className="relative group">
                  <span className="absolute left-8 top-1/2 -translate-y-1/2 text-amber-500 font-black text-xl italic opacity-40">KES</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={newVariation.estimated_cost || ""}
                    onChange={(e) => setNewVariation({ ...newVariation, estimated_cost: parseInt(e.target.value) || 0 })}
                    className={`w-full p-8 pl-24 rounded-[2.5rem] border font-black text-4xl italic tracking-tighter outline-none transition-all shadow-inner
                      ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200'}`}
                  />
                </div>
              </div>
            </div>
            <button type="submit" disabled={isSaving} className="w-full h-24 bg-amber-500 text-black font-black uppercase text-sm tracking-[0.6em] rounded-4xl shadow-2xl hover:bg-amber-400 transition-all flex items-center justify-center gap-6 italic active:scale-[0.98] shadow-amber-500/20">
              {isSaving ? <Loader2 size={32} className="animate-spin" /> : <Send size={32} strokeWidth={2.5} />}
              Send to Surveyor for Pricing
            </button>
          </form>
        )}

        {/* LEDGER LIST */}
        <div className="space-y-8 p-10 sm:p-12">
          {variations.length > 0 ? (
            variations.map((v) => {
              const isExpanded = expandedId === v.id;
              return (
                <div key={v.id} className={`rounded-[3.5rem] border transition-all duration-500 overflow-hidden flex flex-col group
                  ${theme === 'dark' 
                     ? (isExpanded ? 'bg-zinc-900 border-amber-500/40 shadow-amber-500/5 shadow-2xl' : 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700') 
                     : (isExpanded ? 'bg-white border-amber-500/40 shadow-xl' : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300')}`}>
                   
                   {/* ROW HEADER */}
                   <div className="p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="text-left flex-1 space-y-4">
                         <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl border ${v.qs_pricing_status === 'unpriced' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                               <FileEdit size={16} />
                            </div>
                            <span className="text-[10px] font-mono font-black text-zinc-500 uppercase italic leading-none">NODE_{v.id.slice(0, 6).toUpperCase()}</span>
                         </div>
                         <h4 className={`text-2xl font-black uppercase italic tracking-tight transition-colors 
                           ${theme === 'dark' ? 'text-zinc-100 group-hover:text-amber-500' : 'text-zinc-950'}`}>
                           {v.description}
                         </h4>
                      </div>

                      <div className="flex items-center gap-4">
                         <div className="text-right hidden sm:block mr-4">
                            <p className="text-[9px] font-black uppercase text-zinc-500 leading-none mb-1">Estimate</p>
                            <p className="text-2xl font-black italic tracking-tighter text-amber-500">KES {v.estimated_cost.toLocaleString()}</p>
                         </div>
                         
                         <button 
                           onClick={() => setExpandedId(isExpanded ? null : v.id)}
                           className={`flex items-center gap-3 px-6 py-4 rounded-2xl border font-black uppercase text-[10px] tracking-widest transition-all
                             ${theme === 'dark' 
                               ? (isExpanded ? 'bg-amber-500 text-black border-amber-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white') 
                               : (isExpanded ? 'bg-amber-500 text-black border-amber-400 shadow-lg' : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900')}`}
                         >
                            <Eye size={18} /> {isExpanded ? 'Hide' : 'Review'}
                         </button>
                         
                         <button onClick={() => handleDelete(v.id)} className="p-4 bg-rose-500/5 text-rose-500 border border-rose-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-all active:scale-90 shadow-lg">
                            <Trash2 size={22} />
                         </button>
                      </div>
                   </div>

                   {/* EXPANDED DETAILS */}
                   {isExpanded && (
                     <div className="p-10 border-t border-zinc-800/40 bg-zinc-950/20 animate-in slide-in-from-top-4 duration-500 space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                           <div className="space-y-4 text-left">
                              <div className="flex items-center gap-3 opacity-60">
                                 <Layout size={16} className="text-amber-500" />
                                 <p className="text-[10px] font-black uppercase tracking-widest">Full Narrative</p>
                              </div>
                              <p className={`text-lg font-medium leading-relaxed italic ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                 "{v.description}"
                              </p>
                           </div>
                           <div className="space-y-6">
                              <div className={`p-8 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                                 <p className="text-[10px] font-black uppercase text-zinc-500 mb-2 leading-none text-left italic">Pricing Progress</p>
                                 <p className={`text-xl font-black text-left uppercase tracking-widest leading-none ${v.qs_pricing_status === 'unpriced' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    {v.qs_pricing_status}
                                 </p>
                              </div>
                              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 px-4">
                                 <Clock size={12} />
                                 <span>Logged: {new Date(v.created_at).toDateString()}</span>
                              </div>
                           </div>
                        </div>
                        <div className="pt-8 border-t border-zinc-800/40 flex justify-between items-center opacity-40">
                           <p className="text-[9px] font-mono uppercase tracking-widest">Vault Transaction: {v.id}</p>
                           <ShieldCheck size={16} className="text-emerald-500" />
                        </div>
                     </div>
                   )}
                </div>
              );
            })
          ) : (
            <div className="py-32 text-center opacity-10 flex flex-col items-center gap-10">
              <BarChart3 size={100} strokeWidth={1} />
              <p className="font-black uppercase text-lg tracking-[0.8em] italic leading-none">No changes logged</p>
            </div>
          )}
        </div>

        <div className={`p-10 border-t border-zinc-800/40 flex items-center justify-between opacity-30 shadow-inner
          ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50'}`}>
           <div className="flex items-center gap-4 text-left">
              <ShieldCheck size={20} className="text-emerald-500" />
              <p className="text-[10px] font-black uppercase tracking-widest leading-none mt-1">Audit Handshake Enabled</p>
           </div>
           <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest leading-none mt-1">BRIDGE_v4.5 • ISO_19650</p>
        </div>
      </div>

      <footer className="pt-24 pb-12 text-center opacity-20 select-none flex flex-col items-center gap-8">
         <p className="text-[10px] font-black uppercase tracking-[2.5em] text-zinc-600 italic leading-none text-center">
           CHANGE MONITOR ENGINE • QS VAULT
         </p>
      </footer>
    </div>
  );
};

export default VariationBridge;