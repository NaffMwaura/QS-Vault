import React, { useState, useMemo } from 'react';
import { 
  Search, 
  
  Layers, 
  User, 
  Activity, 
  Edit3,
  
} from 'lucide-react';

/* ======================================================
    MODULE RESOLUTION HANDLER (SANDBOX COMPATIBILITY)
    Ensures the component compiles in the Canvas environment.
   ====================================================== */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let useAuth: any = () => ({
  theme: 'dark',
});

const resolveModules = async () => {
  try {
    // @ts-
    const authMod = await import("../../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // Sandbox fallback active
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

/** --- MAIN COMPONENT --- **/

const RatesLibrary: React.FC = () => {
  const { theme } = useAuth();
  const [rateSearch, setRateSearch] = useState("");
  const [activeRateCategory, setActiveRateCategory] = useState<string>('all');

  // Pre-seeded "Nairobi Average" data stream
  const [rates] = useState<RateItem[]>([
    { id: '1', code: 'MAT-001', name: 'Portland Cement (50kg)', category: 'material', unit: 'Bag', rate: 850 },
    { id: '2', code: 'LAB-020', name: 'Skilled Mason (Daily)', category: 'labor', unit: 'Day', rate: 2500 },
    { id: '3', code: 'PLT-005', name: 'Concrete Mixer (Diesel)', category: 'plant', unit: 'Day', rate: 4500 },
    { id: '4', code: 'MAT-012', name: 'River Sand', category: 'material', unit: 'Ton', rate: 3200 },
    { id: '5', code: 'LAB-021', name: 'General Laborer', category: 'labor', unit: 'Day', rate: 1200 },
    { id: '6', code: 'MAT-088', name: 'T12 Reinforcement Bar', category: 'material', unit: 'Kg', rate: 145 },
  ]);

  const filteredRates = useMemo(() => {
    return rates.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(rateSearch.toLowerCase()) || 
                           r.code.toLowerCase().includes(rateSearch.toLowerCase());
      const matchesCat = activeRateCategory === 'all' || r.category === activeRateCategory;
      return matchesSearch && matchesCat;
    });
  }, [rateSearch, activeRateCategory, rates]);

  return (
    <div className={`p-8 sm:p-12 rounded-[4rem] border backdrop-blur-3xl transition-all duration-500
      ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200 shadow-2xl'}`}>
      
      {/* 1. Library Header Node */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-16 text-left">
        <div className="text-left space-y-1">
          <h3 className={`text-4xl font-black uppercase italic tracking-tighter leading-none 
            ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
            Rates Library<span className="text-amber-500">.</span>
          </h3>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mt-3 italic leading-none">
            Standardized Regional Material & Resource Database
          </p>
        </div>

        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search SMM Code or Item..." 
            value={rateSearch} 
            onChange={e => setRateSearch(e.target.value)}
            className={`w-full pl-16 pr-8 py-6 rounded-3xl outline-none font-bold text-sm transition-all shadow-inner border
              ${theme === 'dark' 
                ? 'bg-zinc-950/60 border-zinc-800 text-white focus:border-amber-500/40' 
                : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-amber-500/40'}`} 
          />
        </div>
      </header>

      {/* 2. Category Intelligence Tabs */}
      <div className="flex gap-3 mb-12 overflow-x-auto pb-4 custom-scrollbar">
        {['all', 'material', 'labor', 'plant'].map(cat => (
          <button 
            key={cat} 
            onClick={() => setActiveRateCategory(cat)}
            className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border
              ${activeRateCategory === cat 
                ? 'bg-amber-500 text-black border-amber-500 shadow-2xl shadow-amber-500/10' 
                : theme === 'dark' 
                  ? 'bg-zinc-900/40 text-zinc-500 border-zinc-800 hover:border-zinc-500' 
                  : 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:border-zinc-400'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 3. Resource Node Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredRates.length > 0 ? filteredRates.map(r => (
          <div key={r.id} className={`p-10 rounded-[3.5rem] border shadow-2xl group hover:border-amber-500/30 transition-all flex flex-col justify-between h-85 text-left
            ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-100'}`}>
            
            <div className="flex justify-between items-start mb-10 text-left">
              <div className="space-y-1 text-left">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-mono font-black border transition-colors leading-none
                  ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-600 group-hover:text-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-400 group-hover:text-amber-600'}`}>
                  {r.code}
                </span>
                <p className="text-[9px] font-black uppercase text-zinc-700 tracking-widest mt-2">{r.category}</p>
              </div>
              <div className={`p-4 rounded-3xl transition-all shadow-lg
                ${theme === 'dark' ? 'bg-zinc-800 text-zinc-600 group-hover:text-amber-500 group-hover:bg-amber-500/10' : 'bg-zinc-100 text-zinc-400 group-hover:text-amber-600 group-hover:bg-amber-500/5'}`}>
                {r.category === 'labor' ? <User size={20}/> : r.category === 'plant' ? <Activity size={20}/> : <Layers size={20}/>}
              </div>
            </div>

            <div className="text-left flex-1">
              <h4 className={`font-black text-xl uppercase tracking-tight mb-3 transition-colors leading-tight
                ${theme === 'dark' ? 'text-zinc-300 group-hover:text-white' : 'text-zinc-700 group-hover:text-zinc-900'}`}>
                {r.name}
              </h4>
              <p className="text-[11px] font-black text-zinc-600 uppercase tracking-widest leading-none italic">
                Quantified per {r.unit}
              </p>
            </div>

            <div className={`pt-8 border-t flex justify-between items-center ${theme === 'dark' ? 'border-zinc-800/60' : 'border-zinc-100'}`}>
              <div className="text-left">
                <p className="text-[8px] font-black uppercase text-zinc-500 mb-1 leading-none tracking-widest">Base Rate</p>
                <span className={`text-3xl sm:text-4xl font-black italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                  <span className="text-sm font-bold text-amber-500 mr-1 opacity-60 not-italic">KES</span>
                  {r.rate.toLocaleString()}
                </span>
              </div>
              <button className={`p-4 rounded-2xl transition-all shadow-xl
                ${theme === 'dark' ? 'bg-zinc-800 text-zinc-600 hover:text-amber-500' : 'bg-zinc-100 text-zinc-400 hover:text-amber-600'}`}>
                <Edit3 size={18}/>
              </button>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-32 text-center border-2 border-dashed border-zinc-800 rounded-[4rem] opacity-20">
            <Search size={64} className="mx-auto mb-6" />
            <p className="font-black uppercase text-sm tracking-[0.5em]">No matching resources in cloud node</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RatesLibrary;