/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
  CheckCircle2
} from 'lucide-react';

/* ======================================================
    OFFICE DATABASE INTEGRATION
   ====================================================== */

let useAuth: any = () => ({ theme: 'dark' });
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
    console.warn("Rates Engine: Resolution deferred.");
  }
};

resolveModules();

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
  const { theme } = useAuth();
  const [rateSearch, setRateSearch] = useState("");
  const [activeRateCategory, setActiveRateCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Core Data State
  const [rates, setRates] = useState<RateItem[]>([]);
  
  // Rate Editing States
  const [editingRate, setEditingRate] = useState<RateItem | null>(null);
  const [newRateValue, setNewRateValue] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Fallback Seeding List
  const FALLBACK_RATES: RateItem[] = [
    { id: '1', code: 'MAT-001', name: 'Portland Cement (50kg)', category: 'material', unit: 'Bag', rate: 850 },
    { id: '2', code: 'LAB-020', name: 'Skilled Mason (Daily)', category: 'labor', unit: 'Day', rate: 2500 },
    { id: '3', code: 'PLT-005', name: 'Concrete Mixer (Diesel)', category: 'plant', unit: 'Day', rate: 4500 },
    { id: '4', code: 'MAT-012', name: 'River Sand', category: 'material', unit: 'Ton', rate: 3200 },
    { id: '5', code: 'LAB-021', name: 'General Laborer', category: 'labor', unit: 'Day', rate: 1200 },
    { id: '6', code: 'MAT-088', name: 'T12 Reinforcement Bar', category: 'material', unit: 'Kg', rate: 145 },
  ];

  /** * 1. VAULT SYNC ENGINE
   * Recovers prices from the local device registry. 
   * If the registry is empty, seeds with FALLBACK_RATES.
   */
  const syncWithVault = async () => {
    if (!db) {
      setTimeout(() => setIsLoading(false), 1000);
      return;
    }

    try {
      setIsLoading(true);
      let localRates = await db.rates_library.toArray();

      // INITIAL SEEDING Node
      if (localRates.length === 0) {
        await db.rates_library.bulkAdd(FALLBACK_RATES);
        localRates = FALLBACK_RATES;
      }

      setRates(localRates);
    } catch (err) {
      console.error("Rates Vault Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    syncWithVault();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** * 2. UPDATE RATE HANDSHAKE */
  const handleUpdateRate = async () => {
    if (!editingRate || !newRateValue || isUpdating || !db) return;
    
    setIsUpdating(true);
    const updatedValue = parseFloat(newRateValue);

    try {
      // 1. Commit to Local Device (Dexie)
      await db.rates_library.update(editingRate.id, { 
        rate: updatedValue, 
        updated_at: new Date().toISOString() 
      });

      // 2. Queue Cloud Sync Protocol
      if (syncEngine) {
        await syncEngine.queueChange('rates_library', editingRate.id, 'UPDATE', { 
          rate: updatedValue 
        });
      }

      // 3. UI Update
      setRates(prev => prev.map(r => r.id === editingRate.id ? { ...r, rate: updatedValue } : r));
      
      setShowSuccessToast(true);
      setTimeout(() => {
        setIsUpdating(false);
        setEditingRate(null);
        setTimeout(() => setShowSuccessToast(false), 2000);
      }, 500);
    } catch (err) {
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-40 opacity-20">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-amber-500" />
        <p className="font-black text-[10px] uppercase tracking-[0.5em]">Synchronizing Price Book...</p>
      </div>
    );
  }

  return (
    <div className={`p-8 sm:p-12 rounded-[4rem] border backdrop-blur-3xl transition-all duration-500 relative shadow-2xl
      ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200'}`}>
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-16 text-left">
        <div className="text-left space-y-1">
          <h3 className={`text-4xl font-black uppercase italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
            Price Book<span className="text-amber-500">.</span>
          </h3>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mt-3 italic leading-none">
            Verified Site Resource Registry
          </p>
        </div>

        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500" size={20} />
          <input 
            type="text" placeholder="Search Item or Code..." value={rateSearch} onChange={e => setRateSearch(e.target.value)}
            className={`w-full pl-16 pr-8 py-6 rounded-3xl outline-none font-bold text-sm border shadow-inner transition-all
              ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-900'}`} 
          />
        </div>
      </header>

      <div className="flex gap-3 mb-12 overflow-x-auto pb-4 custom-scrollbar">
        {[
          { id: 'all', label: 'All Resources', icon: Database },
          { id: 'material', label: 'Materials', icon: Package },
          { id: 'labor', label: 'Labor Nodes', icon: HardHat },
          { id: 'plant', label: 'Equipment', icon: Truck },
        ].map(cat => (
          <button key={cat.id} onClick={() => setActiveRateCategory(cat.id)}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border shrink-0
              ${activeRateCategory === cat.id ? 'bg-amber-500 text-black border-amber-500 shadow-xl' : 'bg-zinc-900/40 text-zinc-500 border-zinc-800 hover:text-zinc-300'}`}>
            <cat.icon size={14} /> {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredRates.map(r => (
          <div key={r.id} className={`p-10 rounded-[3.5rem] border shadow-2xl transition-all flex flex-col justify-between h-85 text-left group
            ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 hover:border-amber-500/20' : 'bg-white border-zinc-100 shadow-zinc-200/50 hover:border-amber-500'}`}>
            
            <div className="flex justify-between items-start mb-10">
              <div className="space-y-1">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-mono font-black border transition-colors leading-none
                  ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-600 group-hover:text-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-400 group-hover:text-amber-600'}`}>
                  {r.code}
                </span>
                <p className="text-[9px] font-black uppercase text-zinc-700 tracking-widest mt-2">{r.category}</p>
              </div>
              <div className={`p-4 rounded-3xl transition-all shadow-lg ${theme === 'dark' ? 'bg-zinc-800 text-zinc-600 group-hover:text-amber-500' : 'bg-zinc-100 text-zinc-400'}`}>
                {r.category === 'labor' ? <HardHat size={20}/> : r.category === 'plant' ? <Truck size={20}/> : <Package size={20}/>}
              </div>
            </div>

            <div className="flex-1">
              <h4 className={`font-black text-xl uppercase tracking-tight mb-3 transition-colors leading-tight ${theme === 'dark' ? 'text-zinc-300 group-hover:text-white' : 'text-zinc-900'}`}>{r.name}</h4>
              <p className="text-[11px] font-black text-zinc-600 uppercase tracking-widest leading-none italic">Measured per {r.unit}</p>
            </div>

            <div className={`pt-8 border-t flex justify-between items-center ${theme === 'dark' ? 'border-zinc-800/60' : 'border-zinc-100'}`}>
              <div className="text-left">
                <p className="text-[8px] font-black uppercase text-zinc-500 mb-1 leading-none tracking-widest">Standard Rate</p>
                <span className={`text-3xl sm:text-4xl font-black italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
                  <span className="text-sm font-bold text-amber-500 mr-1 opacity-60 not-italic">KES</span>
                  {r.rate.toLocaleString()}
                </span>
              </div>
              
              <button onClick={() => { setEditingRate(r); setNewRateValue(r.rate.toString()); }}
                className={`p-4 rounded-2xl transition-all shadow-xl active:scale-90 ${theme === 'dark' ? 'bg-zinc-800 text-zinc-600 hover:text-amber-500' : 'bg-zinc-100 text-zinc-400 hover:text-amber-600 shadow-sm'}`}>
                <Edit3 size={18}/>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- EDIT RATE MODAL --- */}
      {editingRate && (
        <div className="fixed inset-0 z-100] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/60 animate-in fade-in duration-300">
           <div className={`w-full max-w-xl p-12 sm:p-16 rounded-[4rem] border shadow-2xl transition-all duration-500 transform animate-in zoom-in-95
             ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white shadow-black' : 'bg-white border-zinc-200 text-zinc-950'}`}>
             
             <div className="flex justify-between items-start mb-12">
                <div className="text-left space-y-3">
                   <div className="flex items-center gap-4">
                      <span className="px-3 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 font-mono text-[10px] font-black uppercase tracking-widest">{editingRate.code}</span>
                      {showSuccessToast && <div className="flex items-center gap-2 text-emerald-500 animate-bounce"><CheckCircle2 size={14}/> <span className="text-[9px] font-black uppercase">Synced</span></div>}
                   </div>
                   <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">{editingRate.name}</h3>
                </div>
                <button onClick={() => setEditingRate(null)} className="p-4 rounded-2xl bg-zinc-950/40 text-zinc-500 hover:text-rose-500 transition-all"><X size={20}/></button>
             </div>

             <div className="space-y-12">
                <div className="space-y-4 text-left">
                   <label className="text-[11px] font-black uppercase text-zinc-500 ml-4 tracking-[0.4em] italic">New Standard Rate (KES)</label>
                   <div className="relative group">
                      <span className="absolute left-8 top-1/2 -translate-y-1/2 text-amber-500 font-black text-xl italic opacity-40">KES</span>
                      <input autoFocus type="number" value={newRateValue} onChange={e => setNewRateValue(e.target.value)}
                        className={`w-full p-8 pl-24 rounded-[2.5rem] font-black text-4xl italic tracking-tighter outline-none border transition-all shadow-inner
                          ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-950 focus:border-amber-500'}`} />
                   </div>
                </div>

                <div className="flex gap-4">
                   <button disabled={isUpdating || !newRateValue} onClick={handleUpdateRate}
                     className="flex-1 h-20 bg-amber-500 text-black rounded-4xl font-black uppercase text-xs tracking-[0.4em] shadow-2xl hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-5 italic shadow-amber-500/20">
                     {isUpdating ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} strokeWidth={2.5} />}
                     Commit Vault Change
                   </button>
                </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default RatesLibrary;