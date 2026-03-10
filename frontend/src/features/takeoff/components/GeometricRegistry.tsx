import React from 'react';
import { 
  Layers, 
  Trash2,  
  Ruler, 
  Maximize2, 
  CheckSquare,
  AlertCircle,
  
  Hash
} from 'lucide-react';

/* ======================================================
    MODULE RESOLUTION HANDLER (SANDBOX COMPATIBILITY)
   ====================================================== */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let useAuth: any = () => ({
  theme: 'dark',
});

const resolveModules = async () => {
  try {
    const authMod = await import("../../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // Sandbox fallback
  }
};

resolveModules();

/** --- TYPES --- **/

interface Measurement {
  id: string;
  label: string;
  type: 'length' | 'area' | 'count';
  value: number;
  unit: string;
  sectionCode: string;
  timestamp: string;
}

interface GeometricRegistryProps {
  measurements: Measurement[];
  onDelete: (id: string) => void;
  onEditLabel: (id: string, newLabel: string) => void;
  activeSection: string;
}

/** --- SUB-COMPONENT: REGISTRY_ITEM --- **/

const RegistryItem: React.FC<{ 
  item: Measurement; 
  onDelete: (id: string) => void; 
  theme: 'light' | 'dark' 
}> = ({ item, onDelete, theme }) => (
  <div className={`p-5 rounded-4xl border transition-all duration-300 group hover:scale-[1.02]
    ${theme === 'dark' 
      ? 'bg-zinc-900/40 border-zinc-800 hover:border-amber-500/30 shadow-xl' 
      : 'bg-white border-zinc-200 hover:border-amber-500/30 shadow-lg'}`}>
    
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl border transition-colors
          ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-600' : 'bg-zinc-50 border-zinc-100 text-zinc-400'}
          group-hover:text-amber-500 group-hover:border-amber-500/20`}>
          {item.type === 'length' ? <Ruler size={14} /> : item.type === 'area' ? <Maximize2 size={14} /> : <CheckSquare size={14} />}
        </div>
        <div className="text-left">
          <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest leading-none mb-1">
            {item.sectionCode.split(' - ')[0]} • {item.type}
          </p>
          <h5 className={`text-xs font-bold uppercase truncate max-w-30 leading-none
            ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-900'}`}>
            {item.label}
          </h5>
        </div>
      </div>
      <button 
        onClick={() => onDelete(item.id)}
        className="p-2 text-zinc-700 hover:text-rose-500 transition-colors active:scale-90"
      >
        <Trash2 size={14} />
      </button>
    </div>

    <div className={`pt-4 border-t flex justify-between items-end ${theme === 'dark' ? 'border-zinc-800/60' : 'border-zinc-100'}`}>
      <div className="text-left">
        <p className="text-[8px] font-black uppercase text-zinc-600 mb-1 leading-none tracking-tighter">
          Quantified Node
        </p>
        <p className="text-2xl font-black text-amber-500 tracking-tighter leading-none italic">
          {item.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          <span className="text-[10px] ml-1 opacity-40 not-italic uppercase font-bold">{item.unit}</span>
        </p>
      </div>
      <span className="text-[8px] font-mono text-zinc-700 uppercase tracking-widest leading-none mb-1">
        REF: {item.id.slice(0, 6)}
      </span>
    </div>
  </div>
);

/** --- MAIN COMPONENT --- **/

const GeometricRegistry: React.FC<GeometricRegistryProps> = ({ 
  measurements, 
  onDelete, 
  activeSection
}) => {
  const { theme } = useAuth();

  // Professional filtering by SMM Section
  const filteredRegistry = measurements.filter(m => m.sectionCode === activeSection);

  return (
    <aside className={`w-full h-full flex flex-col p-6 sm:p-8 space-y-8 overflow-hidden transition-colors duration-500
      ${theme === 'dark' ? 'bg-transparent' : 'bg-zinc-50/50'}`}>
      
      {/* 1. Registry HUD Header */}
      <div className="flex justify-between items-end shrink-0">
        <div className="text-left space-y-1">
          <h3 className={`text-2xl font-black italic tracking-tighter uppercase leading-none
            ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
            Registry Stream<span className="text-amber-500">.</span>
          </h3>
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
            Active Takeoff Audit Trail
          </p>
        </div>
        <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2
          ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
          <Hash size={10} className="text-amber-500" />
          <span className="text-[10px] font-black text-zinc-500 tracking-tighter uppercase">
            {filteredRegistry.length} Nodes
          </span>
        </div>
      </div>

      {/* 2. Scrollable Data Stream */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
        {filteredRegistry.length > 0 ? (
          filteredRegistry.map((m) => (
            <RegistryItem 
              key={m.id} 
              item={m} 
              onDelete={onDelete} 
              theme={theme} 
            />
          ))
        ) : (
          <div className="py-24 text-center space-y-6 opacity-20 border-2 border-dashed border-zinc-800 rounded-[3rem]">
            <Layers size={64} className="mx-auto text-zinc-700 animate-pulse" />
            <div className="space-y-2 px-6">
              <p className="font-black uppercase text-xs tracking-[0.4em]">Node Storage Empty</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                Initialize Geometric Handshake to populate stream
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Section Compliance Footer */}
      <div className={`p-6 rounded-4xl border shrink-0 text-left
        ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800/60' : 'bg-white border-zinc-200 shadow-xl'}`}>
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle size={14} className="text-amber-500 opacity-60" />
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            SMM Validation Node
          </p>
        </div>
        <p className={`text-[11px] font-bold leading-relaxed
          ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Currently filtering stream by <span className="text-amber-500 italic">{activeSection}</span> requirements.
        </p>
      </div>
    </aside>
  );
};

export default GeometricRegistry;

