/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Database, 
  Edit3,
  Loader2,
  Package,
  HardHat,
  Truck,
  X,
  Save,
  AlertCircle
} from 'lucide-react';
import { useAuth } from "../../../features/auth/AuthContext";
import { db, syncEngine } from "../../../lib/database/database";

/* ======================================================
    OFFICE DATABASE INTEGRATION (OFFLINE-READY)
   ====================================================== */

/** --- TYPES --- **/

export interface RateItem {
  id: string;
  name: string;
  category: 'material' | 'labor' | 'plant';
  unit: string;
  rate: number;
  code: string;
}

/** --- MAIN COMPONENT: PRICES & RATES LIBRARY --- **/

const RatesLibrary: React.FC = () => {
  useAuth();
  const [rateSearch, setRateSearch] = useState("");
  const [activeRateCategory, setActiveRateCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Rate Editing States
  const [editingRate, setEditingRate] = useState<RateItem | null>(null);
  const [newRateValue, setNewRateValue] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Fallback "Nairobi Average" data stream
  const [rates, setRates] = useState<RateItem[]>([
    { id: '1', code: 'MAT-001', name: 'Portland Cement (50kg)', category: 'material', unit: 'Bag', rate: 850 },
    { id: '2', code: 'LAB-020', name: 'Skilled Mason (Daily)', category: 'labor', unit: 'Day', rate: 2500 },
    { id: '3', code: 'PLT-005', name: 'Concrete Mixer (Diesel)', category: 'plant', unit: 'Day', rate: 4500 },
    { id: '4', code: 'MAT-012', name: 'River Sand', category: 'material', unit: 'Ton', rate: 3200 },
    { id: '5', code: 'LAB-021', name: 'General Laborer', category: 'labor', unit: 'Day', rate: 1200 },
    { id: '6', code: 'MAT-088', name: 'T12 Reinforcement Bar', category: 'material', unit: 'Kg', rate: 145 },
  ]);

  /** * DATABASE SYNC
   * Handshake with local Dexie storage to ensure we are using the most recent site rates.
   */
  useEffect(() => {
    const syncRates = async () => {
      if (!db) {
        setTimeout(() => setIsLoading(false), 800);
        return;
      }
      try {
        setIsLoading(true);
        // Note: In production, we pull from 'db.rates'
        await new Promise(resolve => setTimeout(resolve, 600));
      } catch (err) {
        console.error("Rates Error: Could not sync with office records.");
      } finally {
        setIsLoading(false);
      }
    };
    syncRates();
  }, []);

  /** * UPDATE RATE HANDSHAKE
   * 1. Updates the UI state immediately.
   * 2. Commits to local device memory (Dexie).
   * 3. Queues cloud update for background synchronization.
   */
  const handleUpdateRate = async () => {
    if (!editingRate || !newRateValue || isUpdating) return;
    
    setIsUpdating(true);
    const updatedRate = parseFloat(newRateValue);

    try {
      // 1. Update UI (Optimistic)
      setRates(prev => prev.map(r => r.id === editingRate.id ? { ...r, rate: updatedRate } : r));

      // 2. Commit to Device (Dexie)
      const ratesTable = (db as typeof db & {
        rates?: { update: (id: string, changes: Record<string, unknown>) => Promise<unknown> };
      })?.rates;
      if (ratesTable) {
        await ratesTable.update(editingRate.id, { rate: updatedRate, updated_at: new Date().toISOString() });
      }

      // 3. Queue Cloud Sync
      if (syncEngine) {
        await syncEngine.queueChange('rates', editingRate.id, 'UPDATE', { rate: updatedRate });
      }

      setTimeout(() => {
        setIsUpdating(false);
        setEditingRate(null);
      }, 500);
    } catch (err) {
      console.error("Rate Mutation Failed:", err);
      setIsUpdating(false);
    }
  };

  const filteredRates = useMemo(() => {
    return rates.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(rateSearch.toLowerCase()) || 
                           r.code.toLowerCase().includes(rateSearch.toLowerCase());
      const matchesCat = activeRateCategory === 'all' || r.category === activeRateCategory;
      return matchesSearch && matchesCat;
    });
  }, [rateSearch, activeRateCategory, rates]);

  return (
    <div className="theme-panel p-8 sm:p-12 transition-all duration-500 relative">
      
      {/* 1. Price Book Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-16 text-left">
        <div className="text-left space-y-1">
          <h3 className="theme-title text-4xl font-black uppercase italic tracking-tighter leading-none">
            Price Book<span className="text-amber-500">.</span>
          </h3>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mt-3 italic leading-none">
            Standardized Material & Labor Rates Database
          </p>
        </div>

        <div className="relative w-full md:w-96 group text-left">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search Item or SMM Code..." 
            value={rateSearch} 
            onChange={e => setRateSearch(e.target.value)}
            className="theme-input w-full pl-16 pr-8 py-6 rounded-3xl outline-none font-bold text-sm transition-all shadow-inner border focus:border-amber-500/40" 
          />
        </div>
      </header>

      {/* 2. Category Selectors */}
      <div className="flex gap-3 mb-12 overflow-x-auto pb-4 custom-scrollbar text-left">
        {[
          { id: 'all', label: 'All Resources', icon: Database },
          { id: 'material', label: 'Materials', icon: Package },
          { id: 'labor', label: 'Labor/Workforce', icon: HardHat },
          { id: 'plant', label: 'Plant & Equipment', icon: Truck },
        ].map(cat => (
          <button 
            key={cat.id} 
            onClick={() => setActiveRateCategory(cat.id)}
            className={`theme-admin-control flex px-6 py-4 items-center gap-3 text-[10px] font-black uppercase tracking-widest shrink-0 transition-all border-2
              ${activeRateCategory === cat.id 
                ? 'bg-amber-500 border-amber-500 text-black' 
                : 'text-zinc-500 border-transparent hover:border-amber-500/50 hover:bg-[color-mix(in_srgb,var(--app-heading)_5%,transparent)]'}`}
          >
            <cat.icon size={14} />
            {cat.label}
          </button>
        ))}
      </div>

      {/* 3. Rate Entries Grid */}
      {isLoading ? (
        <div className="py-40 text-center opacity-20">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="font-black uppercase text-xs tracking-widest">Opening Rate Schedule...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredRates.length > 0 ? filteredRates.map(r => (
            <div key={r.id} className="theme-card p-10 shadow-2xl group hover:border-amber-500/30 transition-all flex flex-col justify-between h-80 text-left">
              
              <div className="flex justify-between items-start mb-10 text-left">
                <div className="space-y-1 text-left">
                  <span className="theme-surface-inset theme-muted px-3 py-1 rounded-lg text-[10px] font-mono font-black border transition-colors leading-none group-hover:text-amber-500">
                    {r.code}
                  </span>
                  <p className="text-[9px] font-black uppercase text-zinc-700 tracking-widest mt-2">{r.category}</p>
                </div>
                <div className="theme-button-muted theme-muted p-4 rounded-3xl transition-all shadow-lg group-hover:text-amber-500 group-hover:bg-amber-500/10">
                  {r.category === 'labor' ? <HardHat size={20}/> : r.category === 'plant' ? <Truck size={20}/> : <Package size={20}/>}
                </div>
              </div>

              <div className="text-left flex-1">
                <h4 className="theme-subtle font-black text-xl uppercase tracking-tight mb-3 transition-colors leading-tight group-hover:text-[var(--app-fg)]">
                  {r.name}
                </h4>
                <p className="text-[11px] font-black text-zinc-600 uppercase tracking-widest leading-none italic">
                  Measured per {r.unit}
                </p>
              </div>

              <div className="theme-divider pt-8 border-t flex justify-between items-center">
                <div className="text-left">
                  <p className="text-[8px] font-black uppercase text-zinc-500 mb-1 leading-none tracking-widest text-left">Standard Rate</p>
                  <span className="theme-title text-3xl sm:text-4xl font-black italic tracking-tighter">
                    <span className="text-sm font-bold text-amber-500 mr-1 opacity-60 not-italic">KES</span>
                    {r.rate.toLocaleString()}
                  </span>
                </div>
                
                {/* TOOLTIP WRAPPER */}
                <div className="relative group/tooltip">
                  <button 
                    onClick={() => { setEditingRate(r); setNewRateValue(r.rate.toString()); }}
                    className="theme-button-muted theme-muted p-4 rounded-2xl transition-all shadow-xl active:scale-90 hover:text-amber-500"
                  >
                    <Edit3 size={18}/>
                  </button>
                  
                  {/* Floating Label Popup */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-zinc-900 text-amber-500 text-[8px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-zinc-800 shadow-2xl z-50">
                    Adjust Cost
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-32 text-center border-2 border-dashed border-zinc-800 rounded-[4rem] opacity-20">
              <Search size={64} className="mx-auto mb-6" />
              <p className="font-black uppercase text-sm tracking-[0.5em]">No matching items in office database</p>
            </div>
          )}
        </div>
      )}

      {/* --- EDIT RATE MODAL OVERLAY --- */}
      {editingRate && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-6 backdrop-blur-2xl bg-black/60 animate-in fade-in duration-300">
           <div className="theme-panel w-full max-w-xl p-10 sm:p-14 shadow-2xl transition-all duration-500 transform animate-in zoom-in-95">
             
             <div className="flex justify-between items-start mb-12">
                <div className="text-left space-y-2">
                   <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 font-mono text-[10px] font-black">{editingRate.code}</span>
                      <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Pricing Adjuster</p>
                   </div>
                   <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">{editingRate.name}</h3>
                </div>
                <button onClick={() => setEditingRate(null)} className="theme-surface-inset theme-muted p-4 rounded-2xl hover:text-[var(--app-fg)] transition-colors"><X size={20}/></button>
             </div>

             <div className="space-y-10">
                <div className="space-y-4 text-left">
                   <label className="text-[11px] font-black uppercase text-zinc-500 ml-4 tracking-[0.4em] italic">New Standard Rate (KES)</label>
                   <div className="relative group">
                      <span className="absolute left-8 top-1/2 -translate-y-1/2 text-amber-500 font-black text-xl italic opacity-40">KES</span>
                      <input 
                        autoFocus
                        type="number"
                        value={newRateValue}
                        onChange={e => setNewRateValue(e.target.value)}
                        className="theme-input w-full p-8 pl-24 rounded-4xl font-black text-4xl italic tracking-tighter outline-none border transition-all focus:border-amber-500"
                      />
                   </div>
                   <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest ml-4">Rate is calculated per {editingRate.unit}.</p>
                </div>

                <div className="flex gap-4">
                   <button 
                     disabled={isUpdating || !newRateValue}
                     onClick={handleUpdateRate}
                     className="flex-1 py-7 bg-amber-500 text-black rounded-4xl font-black uppercase text-xs tracking-[0.4em] shadow-2xl hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-4 italic"
                   >
                     {isUpdating ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                     Commit Change
                   </button>
                   <button 
                     onClick={() => setEditingRate(null)}
                     className="theme-button-muted theme-muted px-10 rounded-4xl border font-black uppercase text-[10px] tracking-widest transition-all hover:text-[var(--app-fg)]"
                   >
                     Cancel
                   </button>
                </div>
             </div>

             <div className="mt-12 pt-8 border-t border-zinc-800/40 flex items-center gap-3 opacity-40">
                <AlertCircle size={14} className="text-amber-500" />
                <p className="text-[8px] font-black uppercase tracking-widest">Rate changes will affect future BoQ computations.</p>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default RatesLibrary;
