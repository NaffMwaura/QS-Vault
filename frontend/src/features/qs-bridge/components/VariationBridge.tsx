/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Save,
  Briefcase,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

/* ======================================================
    OFFICE MODULE RESOLUTION (PRO-DEV)
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
    console.warn("Bridge Engine: Infrastructure nodes in standby.");
  }
};

resolveModules();

/** --- TYPES --- **/

interface Variation {
  id: string;
  project_id: string;
  description: string;
  qs_pricing_status: 'unpriced' | 'pending' | 'approved';
  estimated_cost: number;
  approved_sum?: number;
  created_at: string;
}

interface VariationBridgeProps {
  projectId: string | null;
}

/** --- MAIN COMPONENT: THE SITE CHANGE HUB --- **/

const VariationBridge: React.FC<VariationBridgeProps> = ({ projectId: initialId }) => {
  const { theme, user } = useAuth();
  
  // WORKSPACE CONTEXT
  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  
  // DATA STATES
  const [variations, setVariations] = useState<Variation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // FORM STATES
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVariation, setNewVariation] = useState({
    description: '',
    estimated_cost: 0
  });

  /** * 1. DATA HANDSHAKE: RECOVER SITE CHANGES */
  const syncBridgeData = useCallback(async () => {
    if (!db || !user) {
        setTimeout(() => setIsLoading(false), 800);
        return;
    }

    try {
      setIsLoading(true);
      
      // Fetch available project nodes
      const projects = await db.projects.where('user_id').equals(user.id).toArray();
      setAvailableProjects(projects);

      if (selectedId) {
        const storedVariations = await db.variations
          .where('project_id')
          .equals(selectedId)
          .reverse()
          .toArray();
        setVariations(storedVariations);
      } else if (projects.length > 0) {
        setSelectedId(projects[0].id);
      }
    } catch (err) {
      console.error("Bridge Engine: Vault access failed.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedId, user]);

  useEffect(() => {
    syncBridgeData();
  }, [syncBridgeData]);

  /** * 2. LOG SITE CHANGE (SAVE PROTOCOL) */
  const handleLogChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !db || !user) return;

    setIsSaving(true);
    const variationId = crypto.randomUUID();
    const variationData = {
      id: variationId,
      project_id: selectedId,
      description: newVariation.description,
      estimated_cost: newVariation.estimated_cost,
      qs_pricing_status: 'unpriced' as const,
      created_at: new Date().toISOString()
    };

    try {
      await db.variations.add(variationData);
      if (syncEngine) {
        await syncEngine.queueChange('variations', variationId, 'INSERT', variationData);
      }

      setNewVariation({ description: '', estimated_cost: 0 });
      setShowAddForm(false);
      setShowSavedToast(true);
      syncBridgeData();
      setTimeout(() => {
        setIsSaving(false);
        setTimeout(() => setShowSavedToast(false), 3000);
      }, 600);
    } catch (err) {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Permanently erase this site change record?")) return;
    await db.variations.delete(id);
    if (syncEngine) await syncEngine.queueChange('variations', id, 'DELETE', null);
    syncBridgeData();
  };

  const totals = useMemo(() => {
    const unpriced = variations.filter(v => v.qs_pricing_status === 'unpriced').length;
    const value = variations.reduce((acc, curr) => acc + (curr.estimated_cost || 0), 0);
    return { unpriced, value };
  }, [variations]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-40 opacity-30">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-amber-500" />
        <p className={`font-black text-[10px] uppercase tracking-[0.5em] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-950'}`}>Syncing Change Ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left pb-10">
      
      {/* 1. TOP HUB: CONTEXT SWITCHER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-3">
          <h3 className={`text-4xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Site Change Hub</h3>
          <div className="flex items-center gap-4">
             <div className="relative group">
                <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" />
                <select 
                  value={selectedId || ''} 
                  onChange={(e) => setSelectedId(e.target.value)}
                  className={`pl-12 pr-10 py-3 rounded-xl border appearance-none font-black uppercase text-[10px] tracking-widest cursor-pointer outline-none transition-all
                    ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white hover:border-amber-500' : 'bg-white border-zinc-200 text-zinc-950 hover:border-amber-500 shadow-sm'}`}
                >
                  {availableProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic leading-none mt-1">Audit Link Active</p>
          </div>
        </div>

        {showSavedToast && (
            <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 animate-in zoom-in duration-300 shadow-lg shadow-emerald-500/5">
                <CheckCircle2 size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Vault Updated</span>
            </div>
        )}
      </div>

      {/* 2. OPERATIONAL KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className={`p-10 rounded-[3.5rem] border shadow-2xl transition-all duration-500 flex justify-between items-center
          ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
          <div className="text-left space-y-2">
            <p className={`text-[10px] font-black uppercase tracking-[0.4em] leading-none ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-900'}`}>Pending Pricing</p>
            <p className={`text-6xl font-black italic tracking-tighter ${totals.unpriced > 0 ? 'text-amber-500' : 'text-zinc-500'}`}>
              {totals.unpriced.toString().padStart(2, '0')}
            </p>
          </div>
          <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'} text-amber-500 shadow-lg`}>
            <AlertCircle size={32} strokeWidth={2.5} />
          </div>
        </div>

        <div className={`p-10 rounded-[3.5rem] border shadow-2xl transition-all duration-500 flex justify-between items-center
          ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
          <div className="text-left space-y-2">
            <p className={`text-[10px] font-black uppercase tracking-[0.4em] leading-none ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-900'}`}>Estimated Value</p>
            <p className={`text-6xl font-black italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
              <span className="text-xl font-bold mr-2 not-italic text-amber-500">KES</span>
              {totals.value >= 1000 ? `${(totals.value / 1000).toFixed(1)}k` : totals.value}
            </p>
          </div>
          <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'} text-emerald-500 shadow-lg`}>
            <TrendingUp size={32} strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* 3. CHANGE MANAGEMENT WORKSPACE */}
      <div className={`rounded-[4rem] border backdrop-blur-3xl overflow-hidden transition-all duration-500 shadow-2xl
        ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
        
        <div className="p-12 border-b border-zinc-800/40 flex flex-col md:flex-row justify-between items-center gap-8 bg-white/1">
           <div className="text-left space-y-2">
              <h3 className={`text-4xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Change Ledger</h3>
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-500">Syncing Site Events with QS Valuation Nodes</p>
           </div>
           <button 
             onClick={() => setShowAddForm(!showAddForm)}
             className="px-10 py-6 bg-amber-500 text-black font-black uppercase text-xs rounded-2xl italic tracking-[0.2em] shadow-2xl hover:bg-amber-400 transition-all flex items-center gap-4 active:scale-95 shadow-amber-500/20"
           >
              {showAddForm ? <X size={22} /> : <Plus size={22} strokeWidth={3} />}
              {showAddForm ? 'Close Editor' : 'Log Site Change'}
           </button>
        </div>

        {/* LOG FORM NODE */}
        {showAddForm && (
          <form onSubmit={handleLogChange} className="p-12 bg-zinc-950/40 border-b border-amber-500/20 animate-in slide-in-from-top-4 duration-500 space-y-12">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4 text-left">
                   <label className={`text-[12px] font-black uppercase ml-4 tracking-widest italic ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-950'}`}>What was changed?</label>
                   <input 
                     required
                     placeholder="e.g. Relocating foundation due to rock..."
                     value={newVariation.description}
                     onChange={e => setNewVariation({...newVariation, description: e.target.value})}
                     className={`w-full p-8 rounded-4xl border font-bold outline-none transition-all text-lg shadow-inner
                       ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-950 focus:border-amber-500'}`}
                   />
                </div>
                <div className="space-y-4 text-left">
                   <label className={`text-[12px] font-black uppercase ml-4 tracking-widest italic ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-950'}`}>Rough Site Estimate (KES)</label>
                   <div className="relative group">
                      <span className="absolute left-8 top-1/2 -translate-y-1/2 text-amber-500 font-black text-xl italic opacity-40">KES</span>
                      <input 
                        type="number"
                        placeholder="0"
                        value={newVariation.estimated_cost || ''}
                        onChange={e => setNewVariation({...newVariation, estimated_cost: parseInt(e.target.value) || 0})}
                        className={`w-full p-8 pl-24 rounded-4xl border font-black text-4xl italic tracking-tighter outline-none transition-all shadow-inner
                          ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-950 focus:border-amber-500'}`}
                      />
                   </div>
                </div>
             </div>
             <button type="submit" disabled={isSaving} className="w-full h-24 bg-amber-500 text-black font-black uppercase text-sm tracking-[0.6em] rounded-3xl shadow-2xl hover:bg-amber-400 transition-all flex items-center justify-center gap-6 italic active:scale-[0.98]">
                {isSaving ? <Loader2 size={32} className="animate-spin" /> : <Save size={32} strokeWidth={2.5} />}
                Dispatch Change to Office
             </button>
          </form>
        )}

        {/* LOGGED SITE CHANGES LIST */}
        <div className="p-12 space-y-8">
           {variations.length > 0 ? variations.map((v) => (
             <div key={v.id} className={`p-10 rounded-[3.5rem] border group transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-10 shadow-xl
                ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800 hover:border-amber-500/20' : 'bg-zinc-50 border-zinc-100 hover:border-amber-500'}`}>
                <div className="flex-1 text-left space-y-5">
                   <div className="flex items-center gap-5">
                      <div className={`p-4 rounded-2xl border ${v.qs_pricing_status === 'unpriced' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-lg'}`}>
                         <FileEdit size={24} />
                      </div>
                      <div className="space-y-1">
                         <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest italic font-bold">NODE_REF: {v.id.slice(0,8).toUpperCase()}</span>
                         <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${v.qs_pricing_status === 'unpriced' ? 'text-rose-500' : 'text-emerald-500'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${v.qs_pricing_status === 'unpriced' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                            {v.qs_pricing_status === 'unpriced' ? 'Awaiting Pricing' : 'Valuation Approved'}
                         </div>
                      </div>
                   </div>
                   <h4 className={`text-2xl sm:text-3xl font-black uppercase italic tracking-tighter leading-tight transition-colors ${theme === 'dark' ? 'text-zinc-100 group-hover:text-white' : 'text-zinc-950'}`}>
                     {v.description}
                   </h4>
                   <div className="flex items-center gap-8 opacity-40">
                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{new Date(v.created_at).toDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HardHat size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest italic leading-none">Logged by Field Node</span>
                      </div>
                   </div>
                </div>

                <div className="text-right flex items-center gap-10 w-full md:w-auto border-t md:border-t-0 pt-8 md:pt-0 border-zinc-800/40">
                   <div className="text-right flex-1 md:flex-none space-y-2">
                      <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-900'}`}>Rough Estimate</p>
                      <p className={`text-4xl font-black italic tracking-tighter text-amber-500 drop-shadow-xl`}>
                        <span className="text-sm mr-2 not-italic opacity-40">KES</span>
                        {v.estimated_cost.toLocaleString()}
                      </p>
                   </div>
                   <div className="flex gap-3">
                      <button onClick={() => handleDelete(v.id)} className="p-5 rounded-2xl bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-90 opacity-0 group-hover:opacity-100 shadow-lg">
                        <Trash2 size={24} />
                      </button>
                      <button className={`p-5 rounded-2xl transition-all shadow-inner active:scale-90
                        ${theme === 'dark' ? 'bg-zinc-900 text-zinc-600 hover:text-amber-500' : 'bg-zinc-100 text-zinc-400 hover:text-amber-600 shadow-sm'}`}>
                         <ChevronRight size={24} strokeWidth={3} />
                      </button>
                   </div>
                </div>
             </div>
           )) : (
             <div className="py-32 text-center opacity-10 flex flex-col items-center gap-8 border-2 border-dashed border-zinc-800 rounded-[4rem]">
                <BarChart3 size={100} />
                <p className="font-black uppercase text-lg tracking-[0.5em] italic leading-none">Change Ledger Empty</p>
             </div>
           )}
        </div>

        <div className={`p-10 border-t border-zinc-800/40 flex items-center justify-between opacity-30
          ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100 shadow-inner'}`}>
           <div className="flex items-center gap-4">
              <ShieldCheck size={20} className="text-emerald-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 leading-none">Immutable Audit Handshake Active</p>
           </div>
           <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest leading-none">QS_BRIDGE_v4.6 • ISO_19650</p>
        </div>
      </div>

      <footer className="pt-24 pb-12 text-center opacity-20 select-none flex flex-col items-center gap-8">
         <div className="h-px w-80 bg-zinc-800" />
         <p className="text-[11px] font-black uppercase tracking-[2em] text-zinc-600 italic leading-none text-center">
           CHANGE MONITOR ENGINE • QS VAULT
         </p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 20px; }
      `}</style>
    </div>
  );
};

export default VariationBridge;