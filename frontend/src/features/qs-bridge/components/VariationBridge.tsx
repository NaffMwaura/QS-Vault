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
  HardHat,
  Calculator,
} from 'lucide-react';
import { useAuth } from "../../auth/AuthContext";
import Button from "../../../components/ui/Button";
import { db, syncEngine } from "../../../lib/database/database";

/* ======================================================
    OFFICE MODULE RESOLUTION (OFFLINE-FIRST)
   ====================================================== */

/** --- TYPES --- **/

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
  const { user } = useAuth();
  
  // Data States
  const [variations, setVariations] = useState<Variation[]>([]);
  const [, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVariation, setNewVariation] = useState({
    description: '',
    estimated_cost: 0
  });

  /** * DATA HANDSHAKE: VAULT RECOVERY
   * Pulls site changes from the local device (Dexie).
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
      console.error("Bridge Engine: Local vault access failed.", err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    refreshVariationData();
  }, [refreshVariationData]);

  /** * LOG SITE CHANGE (Save & Sync)
   * Commits to local memory instantly so the Site Manager can get back to work.
   */
  const handleLogChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !db || !user) return;

    setIsSaving(true);
    const variationId = crypto.randomUUID();
    const variationData = {
      id: variationId,
      project_id: projectId,
      site_log_id: null,
      description: newVariation.description,
      estimated_cost: newVariation.estimated_cost,
      qs_pricing_status: 'unpriced' as const,
      created_at: new Date().toISOString()
    };

    try {
      // 1. SAVE TO LOCAL DEVICE (DEXIE)
      await db.variations.add(variationData);
      
      // 2. QUEUE FOR CLOUD (Background)
      if (syncEngine) {
        await syncEngine.queueChange('variations', variationId, 'INSERT', variationData);
      }

      setNewVariation({ description: '', estimated_cost: 0 });
      setShowAddForm(false);
      refreshVariationData();
    } catch (err) {
      console.error("Bridge: Could not vault site change.", err);
    } finally {
      setIsSaving(false);
    }
  };

  const unpricedCount = variations.filter(v => v.qs_pricing_status === 'unpriced').length;
  const totalPotentialValue = variations.reduce((acc, curr) => acc + (curr.estimated_cost || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-left">
      
      {/* 1. OPERATIONAL HUD (Summary Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-8 rounded-[2.5rem] shadow-2xl flex justify-between items-center transition-all duration-500 theme-card`}>
          <div className="text-left space-y-2">
            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] leading-none">Unpriced Changes</p>
            <p className={`text-4xl font-black italic tracking-tighter ${unpricedCount > 0 ? 'text-[var(--app-accent-strong)]' : 'text-zinc-500'}`}>
              {unpricedCount.toString().padStart(2, '0')} Nodes
            </p>
          </div>
          <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-500">
            <AlertCircle size={24} />
          </div>
        </div>

        <div className={`p-8 rounded-[2.5rem] shadow-2xl flex justify-between items-center transition-all duration-500 theme-card`}>
          <div className="text-left space-y-2">
            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] leading-none">Estimated Value</p>
            <p className={`text-4xl font-black italic tracking-tighter text-[var(--app-heading)]`}>
              KES {(totalPotentialValue / 1000).toFixed(1)}k
            </p>
          </div>
          <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-500">
            <TrendingUp size={24} />
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
           <Button 
             variant="primary"
             onClick={() => setShowAddForm(!showAddForm)}
             leftIcon={<Plus size={16} className="stroke-[3px]" />}
           >
              Log Site Change
           </Button>
        </div>

        {/* LOG FORM NODE */}
        {showAddForm && (
          <form onSubmit={handleLogChange} className="p-10 bg-amber-500/5 border-b border-amber-500/20 animate-in slide-in-from-top-4 space-y-8">
             <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase text-[var(--app-meta)] ml-2 tracking-widest">Description of Change</label>
                   <input 
                     required
                     placeholder="e.g. Relocating drainage due to rock..."
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
                        placeholder="0.00"
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

        {/* LOGGED VARIATIONS LIST */}
        <div className="p-10 space-y-6">
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
                        <Clock size={12} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{new Date(v.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HardHat size={12} />
                        <span className="text-[9px] font-black uppercase tracking-widest italic">Logged by Site Team</span>
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
    </div>
  );
};

export default VariationBridge;
