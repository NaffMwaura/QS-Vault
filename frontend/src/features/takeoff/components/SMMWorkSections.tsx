 
import React from 'react';
import { 
  Hash, 
  Ruler, 
  Layers, 
  Box, 
  DoorOpen, 
  Pickaxe,
  ChevronRight,
  Target,
  PaintBucket,
  Info,
  Zap
} from 'lucide-react';
import { useAuth } from "../../auth/AuthContext";

/** --- TYPES --- **/

export type MeasurementTool = 'length' | 'area' | 'count';

interface SMMSection {
  id: string;
  code: string;
  label: string;
  icon: React.ElementType;
  defaultTool: MeasurementTool;
}

interface SMMWorkSectionsProps {
  activeSection: string;
  setActiveSection: (id: string) => void;
  activeTool: MeasurementTool;
  setActiveTool: (tool: MeasurementTool) => void;
}

/** --- SMM-KE REGISTRY: REGIONAL STANDARDS --- **/

const SMM_REGISTRY: SMMSection[] = [
  { id: 'excavation', code: 'SEC-D', label: 'Excavation & Earthwork', icon: Pickaxe, defaultTool: 'area' },
  { id: 'concrete', code: 'SEC-F', label: 'Concrete Work', icon: Box, defaultTool: 'area' },
  { id: 'walling', code: 'SEC-G', label: 'Walling & Partitions', icon: Layers, defaultTool: 'length' },
  { id: 'finishes', code: 'SEC-U', label: 'Floor & Wall Finishes', icon: PaintBucket, defaultTool: 'area' },
  { id: 'openings', code: 'SEC-L', label: 'Doors & Windows', icon: DoorOpen, defaultTool: 'count' },
];

/** --- MAIN COMPONENT: WORK CATEGORY NAVIGATOR --- **/

const SMMWorkSections: React.FC<SMMWorkSectionsProps> = ({ 
  activeSection, 
  setActiveSection, 
  activeTool, 
  setActiveTool 
}) => {
  const { theme } = useAuth();

  /** * SECTION HANDSHAKE
   * Automatically switches the tool to the most logical default for the chosen category
   * (e.g., Selecting "Doors" automatically arms the "Count" tool).
   */
  const handleSectionSelect = (section: SMMSection) => {
    setActiveSection(section.label);
    setActiveTool(section.defaultTool);
  };

  return (
    <aside className={`w-full flex flex-col space-y-10 p-6 sm:p-10 transition-colors duration-500 h-auto overflow-visible
      ${theme === 'dark' ? 'bg-transparent' : 'bg-zinc-50/30'}`}>
      
      {/* 1. TOOL SELECTION HUB */}
      <div className="space-y-5">
        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 ml-1 italic block text-left">
          Measurement Tools
        </label>
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'area', icon: Target, label: 'Area' },
            { id: 'length', icon: Ruler, label: 'Length' },
            { id: 'count', icon: Hash, label: 'Count' },
          ].map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id as MeasurementTool)}
              className={`flex flex-col items-center justify-center gap-3 py-6 rounded-2xl border transition-all active:scale-95 shadow-xl
                ${activeTool === tool.id 
                  ? 'bg-amber-500 text-black border-amber-600 shadow-amber-500/20' 
                  : theme === 'dark' 
                    ? 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300' 
                    : 'bg-white border-zinc-200 text-zinc-400 hover:border-zinc-400 hover:text-zinc-600'}`}
            >
              <tool.icon size={22} className={activeTool === tool.id ? 'stroke-[3px]' : ''} />
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                {tool.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. SMM COMPLIANCE CATEGORIES */}
      <div className="space-y-5 flex flex-col">
        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 ml-1 italic block text-left">
          Standard Work Sections (SMM-KE)
        </label>
        
        <div className="space-y-4 pr-0 sm:pr-3">
          {SMM_REGISTRY.map((section) => {
            const isActive = activeSection === section.label;
            return (
              <button
                key={section.id}
                onClick={() => handleSectionSelect(section)}
                className={`w-full flex items-center justify-between p-5 rounded-[2.5rem] border transition-all duration-500 group relative overflow-hidden
                  ${isActive 
                    ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-2xl shadow-amber-500/5' 
                    : theme === 'dark' 
                      ? 'bg-zinc-950 border-zinc-800/60 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300' 
                      : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-800 shadow-sm'}`}
              >
                {/* Decorative Background Pulse for Active Node */}
                {isActive && (
                  <div className="absolute inset-0 bg-amber-500/5 animate-pulse" />
                )}

                <div className="flex items-center gap-5 relative z-10">
                  <div className={`p-4 rounded-2xl border transition-all duration-500 shadow-inner
                    ${isActive ? 'bg-amber-500 text-black border-amber-500 scale-110 shadow-xl' : 'bg-zinc-900 border-zinc-800 shadow-black'}`}>
                    <section.icon size={18} />
                  </div>
                  <div className="text-left">
                    <p className={`text-[9px] font-black uppercase tracking-[0.2em] leading-none mb-2
                      ${isActive ? 'text-amber-500' : 'text-zinc-600'}`}>
                      {section.code}
                    </p>
                    <h5 className={`text-[12px] font-black uppercase tracking-tight leading-none
                      ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                      {section.label}
                    </h5>
                  </div>
                </div>
                {isActive && <ChevronRight size={18} className="text-amber-500 animate-in slide-in-from-left-4 duration-500" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. OPERATIONAL TRACE SUMMARY */}
      <div className={`p-8 rounded-[3rem] border text-left transition-all duration-500 relative overflow-hidden
        ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800 shadow-inner' : 'bg-white border-zinc-100 shadow-inner'}`}>
        
        <div className="flex items-center gap-3 mb-4">
           <Zap size={14} className="text-amber-500 animate-pulse" />
           <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] italic leading-none">
             Engine Armed
           </p>
        </div>
        
        <p className={`text-[11px] font-bold leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Active Tool: <span className="text-amber-500 italic uppercase">{activeTool}</span>
          <br/>
          Current Node: <span className="text-amber-500 italic uppercase">{activeSection}</span>
        </p>

        <div className="mt-6 pt-6 border-t border-zinc-800/40 flex items-center gap-3 opacity-40">
           <Info size={14} className="text-zinc-600" />
           <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600">
             Logic following SMM-KE 2026 Protocol
           </p>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
      `}</style>
    </aside>
  );
};

export default SMMWorkSections;
