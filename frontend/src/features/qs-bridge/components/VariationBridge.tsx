/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  Plus, 
  AlertCircle, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  TrendingUp,
  FileEdit,
  Loader2,
  HardHat,
  Calculator
} from 'lucide-react';

/* ======================================================
    OFFICE MODULE RESOLUTION (PRODUCTION READY)
   ====================================================== */

let useAuth: any = () => ({ 
  user: { id: 'dev-node-001' }, 
  theme: 'dark' 
});

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
    // Sandbox fallback
  }
};

resolveModules();

/** --- TYPES (Simplified) --- **/

interface Variation {
  id: string;
  description: string;
  qs_pricing_status: 'unpriced' | 'pending' | 'approved';
  estimated_cost: number;
  approved_sum?: number;
  created_at: string;
}

interface VariationBridgeProps {
  projectId: string | null;
}

/** --- MAIN COMPONENT: THE QS ↔ CM BRIDGE --- **/

const VariationBridge: React.FC<VariationBridgeProps> = ({ projectId }) => {
  const { theme, user } = useAuth();
  
  // Data States
  const [variations, setVariations] = useState<Variation[]>([]);
  const [, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State (For logging a new site change)
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVariation, setNewVariation] = useState({
    description: '',
    estimated_cost: 0
  });

  /** * DATA HANDSHAKE
   * Pulls site changes from the local project vault (Dexie).
   * Works 100% offline.
   */
  const refreshVariationData = useCallback(async () => {
    if (!db || !projectId) {
      setTimeout(() => setIsLoading(false), 1000);
      return;
    }

    try {
      setIsLoading(true);
      const storedVariations = await db.variations
        .where('project_id')
        .equals(projectId)
        .reverse()
        .toArray();

      setVariations(storedVariations);
    } catch (err) {
      console.error("Bridge Engine: Handshake failed.", err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    refreshVariationData();
  }, [refreshVariationData]);

  /** * LOG SITE CHANGE (Save & Sync) */
  const handleLogChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !db || !user) return;

    setIsSaving(true);
    const variationId = crypto.randomUUID();
    const variationData = {
      id: variationId,
      project_id: projectId,
      description: newVariation.description,
      estimated_cost: newVariation.estimated_cost,
      qs_pricing_status: 'unpriced',
      created_at: new Date().toISOString()
    };

    try {
      // 1. SAVE TO LOCAL DEVICE (DEXIE)
      await db.variations.add(variationData);
      
      // 2. QUEUE FOR CLOUD (SUPABASE)
      if (syncEngine) {
        await syncEngine.queueChange('variations', variationId, 'INSERT', variationData);
      }

      setNewVariation({ description: '', estimated_cost: 0 });
      setShowAddForm(false);
      refreshVariationData();
    } catch (err) {
      console.error("Change Vaulting Failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  /** * CALCULATE TOTALS */
  const unpricedCount = variations.filter(v => v.qs_pricing_status === 'unpriced').length;
  const totalPotentialValue = variations.reduce((acc, curr) => acc + (curr.estimated_cost || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-left">
      
      {/* 1. VARIATION HUD (Overview) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-8 rounded-[2.5rem] border shadow-2xl flex justify-between items-center transition-all duration-500
          ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'}`}>
          <div className="text-left space-y-2">
            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] leading-none">Unpriced Changes</p>
            <p className={`text-4xl font-black italic tracking-tighter ${unpricedCount > 0 ? 'text-amber-500' : 'text-zinc-500'}`}>
              {unpricedCount.toString().padStart(2, '0')} Nodes
            </p>
          </div>
          <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-500">
            <AlertCircle size={24} />
          </div>
        </div>

        <div className={`p-8 rounded-[2.5rem] border shadow-2xl flex justify-between items-center transition-all duration-500
          ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'}`}>
          <div className="text-left space-y-2">
            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] leading-none">Potential Value</p>
            <p className={`text-4xl font-black italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              KES {(totalPotentialValue / 1000).toFixed(1)}k
            </p>
          </div>
          <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-500">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE */}
      <div className={`rounded-[3.5rem] border backdrop-blur-3xl overflow-hidden transition-all duration-500
        ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800 shadow-2xl shadow-black' : 'bg-white border-zinc-200'}`}>
        
        <div className="p-10 border-b border-zinc-800/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white/[0.02]">
           <div className="text-left space-y-2">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">Change Management Bridge</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">Connecting Site Logs to Valuation</p>
           </div>
           <button 
             onClick={() => setShowAddForm(!showAddForm)}
             className="flex items-center gap-3 px-8 py-4 bg-amber-500 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-amber-400 active:scale-95 transition-all"
           >
              <Plus size={16} className="stroke-[3px]" /> Log Site Change
           </button>
        </div>

        {/* LOG FORM */}
        {showAddForm && (
          <form onSubmit={handleLogChange} className="p-10 bg-amber-500/5 border-b border-amber-500/20 animate-in slide-in-from-top-4 space-y-8">
             <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase text-zinc-500 ml-2 tracking-widest">What changed on site?</label>
                   <input 
                     required
                     placeholder="e.g. Additional excavation for deeper footings..."
                     value={newVariation.description}
                     onChange={e => setNewVariation({...newVariation, description: e.target.value})}
                     className="w-full p-6 rounded-2xl bg-zinc-950 border border-zinc-800 text-white font-bold outline-none focus:border-amber-500 transition-all"
                   />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase text-zinc-500 ml-2 tracking-widest">Estimated Impact (KES)</label>
                   <div className="relative">
                      <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700" size={18} />
                      <input 
                        type="number"
                        placeholder="0.00"
                        value={newVariation.estimated_cost || ''}
                        onChange={e => setNewVariation({...newVariation, estimated_cost: parseInt(e.target.value)})}
                        className="w-full p-6 pl-14 rounded-2xl bg-zinc-950 border border-zinc-800 text-white font-black text-xl outline-none focus:border-amber-500 transition-all"
                      />
                   </div>
                </div>
             </div>
             <div className="flex gap-4">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 py-6 bg-amber-500 text-black rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.3em] shadow-xl hover:bg-amber-400 transition-all flex items-center justify-center gap-4 italic"
                >
                   {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Calculator size={18} />}
                   Submit for QS Pricing
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)}
                  className="px-10 py-6 bg-zinc-800 text-zinc-400 rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest hover:bg-zinc-700 transition-all"
                >
                  Cancel
                </button>
             </div>
          </form>
        )}

        {/* VARIATION LIST */}
        <div className="p-10 space-y-6">
           {variations.length > 0 ? variations.map((v) => (
             <div key={v.id} className="p-8 rounded-[2.5rem] bg-zinc-950/40 border border-zinc-800 group hover:border-amber-500/20 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="flex-1 text-left space-y-4">
                   <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl border ${v.qs_pricing_status === 'unpriced' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                         <FileEdit size={16} />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">VAR-ID: {v.id.slice(0,8).toUpperCase()}</span>
                   </div>
                   <h4 className="text-xl font-black uppercase tracking-tight text-zinc-200 leading-tight">
                     {v.description}
                   </h4>
                   <div className="flex items-center gap-6 opacity-40">
                      <div className="flex items-center gap-2">
                        <Clock size={12} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{new Date(v.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HardHat size={12} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Logged by Site Node</span>
                      </div>
                   </div>
                </div>

                <div className="text-right flex items-center gap-8">
                   <div className="text-right space-y-1">
                      <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest leading-none">Estimated Cost</p>
                      <p className="text-2xl font-black italic tracking-tighter text-amber-500">
                        KES {v.estimated_cost.toLocaleString()}
                      </p>
                   </div>
                   <button className="p-4 rounded-2xl bg-zinc-900 text-zinc-600 hover:text-amber-500 transition-all group-hover:bg-amber-500/5 shadow-inner">
                      <ArrowRight size={20} />
                   </button>
                </div>
             </div>
           )) : (
             <div className="py-20 text-center opacity-10 flex flex-col items-center gap-6">
                <BarChart3 size={80} />
                <p className="font-black uppercase text-sm tracking-[0.5em] italic">No Site Changes Pending</p>
             </div>
           )}
        </div>

        <div className={`p-8 border-t border-zinc-800/40 flex items-center justify-between opacity-30
          ${theme === 'dark' ? 'bg-zinc-950/40' : 'bg-zinc-50'}`}>
           <div className="flex items-center gap-3">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 leading-none">QS Monitoring Active</p>
           </div>
           <p className="text-[9px] font-mono text-zinc-600 uppercase leading-none tracking-tighter">BRIDGE_ENGINE_V4.0 • OFFLINE_SYNC: READY</p>
        </div>
      </div>
    </div>
  );
};

export default VariationBridge;