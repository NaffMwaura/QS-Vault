import React, { useState, useEffect, useCallback } from 'react';
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

const VariationBridge: React.FC<VariationBridgeProps> = ({ projectId }) => {
  const { user } = useAuth();
  
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
      
      {/* 1. OPERATIONAL HUD (Summary Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-8 rounded-[2.5rem] shadow-2xl flex justify-between items-center transition-all duration-500 theme-card`}>
          <div className="text-left space-y-2">
            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] leading-none">Unpriced Changes</p>
            <p className={`text-4xl font-black italic tracking-tighter ${unpricedCount > 0 ? 'text-[var(--app-accent-strong)]' : 'text-zinc-500'}`}>
              {unpricedCount.toString().padStart(2, '0')} Nodes
            </p>
          </div>
          <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'} text-amber-500 shadow-lg`}>
            <AlertCircle size={32} strokeWidth={2.5} />
          </div>
        </div>

        <div className={`p-8 rounded-[2.5rem] shadow-2xl flex justify-between items-center transition-all duration-500 theme-card`}>
          <div className="text-left space-y-2">
            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] leading-none">Estimated Value</p>
            <p className={`text-4xl font-black italic tracking-tighter text-[var(--app-heading)]`}>
              KES {(totalPotentialValue / 1000).toFixed(1)}k
            </p>
          </div>
          <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'} text-emerald-500 shadow-lg`}>
            <TrendingUp size={32} strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* 2. CHANGE MANAGEMENT WORKSPACE */}
      <div className={`rounded-[3.5rem] outline-none overflow-hidden transition-all duration-500 theme-panel`}>
        
        <div className="p-10 border-b border-[var(--app-border)] flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white/1">
           <div className="text-left space-y-2">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none text-[var(--app-heading)]">Site Change Bridge</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--app-meta)] italic">Syncing site events with QS valuations</p>
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
          <form onSubmit={handleLogChange} className="p-10 bg-amber-500/5 border-b border-amber-500/20 animate-in slide-in-from-top-4 space-y-8">
             <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase text-[var(--app-meta)] ml-2 tracking-widest">Description of Change</label>
                   <input 
                     required
                     placeholder="e.g. Relocating foundation due to rock..."
                     value={newVariation.description}
                     onChange={e => setNewVariation({...newVariation, description: e.target.value})}
                     className={`w-full p-6 rounded-2xl border font-bold transition-all theme-input outline-none focus:border-[var(--app-accent-strong)]`}
                   />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase text-[var(--app-meta)] ml-2 tracking-widest">Site Estimate (KES)</label>
                   <div className="relative">
                      <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--app-meta)]" size={18} />
                      <input 
                        type="number"
                        placeholder="0"
                        value={newVariation.estimated_cost || ''}
                        onChange={e => setNewVariation({...newVariation, estimated_cost: parseInt(e.target.value)})}
                        className={`w-full p-6 pl-14 rounded-2xl border font-black text-xl transition-all theme-input outline-none focus:border-[var(--app-accent-strong)]`}
                      />
                   </div>
                </div>
             </div>
             <div className="flex gap-4">
                <Button 
                  type="submit" 
                  isLoading={isSaving}
                  className="flex-1 py-6 italic"
                  leftIcon={<Calculator size={18} />}
                >
                   Send to QS for Pricing
                </Button>
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)}
                  className={`px-10 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all theme-button-secondary`}
                >
                  Cancel
                </button>
             </div>
          </form>
        )}

        {/* LOGGED SITE CHANGES LIST */}
        <div className="p-12 space-y-8">
           {variations.length > 0 ? variations.map((v) => (
             <div key={v.id} className="p-8 rounded-[2.5rem] theme-card hover:border-[var(--app-accent-strong)] group transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="flex-1 text-left space-y-4">
                   <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl border ${v.qs_pricing_status === 'unpriced' ? 'theme-status-error' : 'theme-status-online'}`}>
                         <FileEdit size={16} />
                      </div>
                      <span className="text-[10px] font-mono text-[var(--app-meta)] uppercase tracking-widest italic">REF: {v.id.slice(0,8)}</span>
                   </div>
                   <h4 className={`text-xl font-black uppercase tracking-tight leading-tight text-[var(--app-heading)] group-hover:text-[var(--app-primary-bg)]`}>
                     {v.description}
                   </h4>
                   <div className="flex items-center gap-6 opacity-40 text-[var(--app-heading)]">
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

                <div className="text-right flex items-center gap-8">
                   <div className="text-right space-y-1">
                      <p className="text-[9px] font-black uppercase text-[var(--app-meta)] tracking-widest leading-none">Rough Estimate</p>
                      <p className="text-2xl font-black italic tracking-tighter text-[var(--app-accent-strong)]">
                        KES {v.estimated_cost.toLocaleString()}
                      </p>
                   </div>
                   <button className={`p-4 rounded-2xl transition-all shadow-inner theme-button-secondary border-[var(--app-border)] hover:bg-[color-mix(in_srgb,var(--app-secondary-fg)_10%,transparent)]`}>
                      <ArrowRight size={20} />
                   </button>
                </div>
             </div>
           )) : (
             <div className="py-20 text-center opacity-10 flex flex-col items-center gap-6 text-[var(--app-heading)]">
                <BarChart3 size={80} />
                <p className="font-black uppercase text-sm tracking-[0.5em] italic">Change Ledger is Empty</p>
             </div>
           )}
        </div>

        <div className={`p-8 border-t border-[var(--app-border)] flex items-center justify-between opacity-30 theme-panel shadow-none`}>
           <div className="flex items-center gap-3">
              <CheckCircle2 size={14} className="text-[var(--app-success)]" />
              <p className="text-[9px] font-black uppercase tracking-widest text-[var(--app-meta)]">Infrastructure Watch Active</p>
           </div>
           <p className="text-[9px] font-mono text-[var(--app-meta)] uppercase tracking-tighter">SECURE_BRIDGE_PROTOCOL_v4.5</p>
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