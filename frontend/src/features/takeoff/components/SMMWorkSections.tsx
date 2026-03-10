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
  PaintBucket
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
    // @ts-
    const authMod = await import("../../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // Sandbox fallback
  }
};

resolveModules();

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
  theme?: 'light' | 'dark';
}

/** --- CONSTANTS: REGIONAL SMM REFS --- **/

const SMM_REGISTRY: SMMSection[] = [
  { id: 'excavation', code: 'SEC-D', label: 'Excavation & Earthwork', icon: Pickaxe, defaultTool: 'area' },
  { id: 'concrete', code: 'SEC-F', label: 'Concrete Work', icon: Box, defaultTool: 'area' },
  { id: 'walling', code: 'SEC-G', label: 'Walling & Partitions', icon: Layers, defaultTool: 'length' },
  { id: 'finishes', code: 'SEC-U', label: 'Floor & Wall Finishes', icon: PaintBucket, defaultTool: 'area' },
  { id: 'openings', code: 'SEC-L', label: 'Doors & Windows', icon: DoorOpen, defaultTool: 'count' },
];

/** --- MAIN COMPONENT --- **/

const SMMWorkSections: React.FC<SMMWorkSectionsProps> = ({ 
  activeSection, 
  setActiveSection, 
  activeTool, 
  setActiveTool 
}) => {
  const { theme } = useAuth();

  const handleSectionSelect = (section: SMMSection) => {
    setActiveSection(section.label);
    setActiveTool(section.defaultTool);
  };

  return (
    <aside className={`w-full flex flex-col space-y-8 p-6 sm:p-8 transition-colors duration-500
      ${theme === 'dark' ? 'bg-transparent' : 'bg-zinc-50/30'}`}>
      
      {/* 1. Tool Selection Hub */}
      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 ml-1 italic block text-left">
          Precision Toolset
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'area', icon: Target, label: 'Area' },
            { id: 'length', icon: Ruler, label: 'Length' },
            { id: 'count', icon: Hash, label: 'Count' },
          ].map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id as MeasurementTool)}
              className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border transition-all active:scale-95 shadow-lg
                ${activeTool === tool.id 
                  ? 'bg-amber-500 text-black border-amber-600 shadow-amber-500/20' 
                  : theme === 'dark' 
                    ? 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:text-zinc-300' 
                    : 'bg-white border-zinc-200 text-zinc-400 hover:text-zinc-600'}`}
            >
              <tool.icon size={18} className={activeTool === tool.id ? 'stroke-[3px]' : ''} />
              <span className="text-[8px] font-black uppercase tracking-widest leading-none">
                {tool.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. SMM Compliance Registry */}
      <div className="flex-1 space-y-4 overflow-hidden flex flex-col">
        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 ml-1 italic block text-left">
          SMM-KE Work Sections
        </label>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
          {SMM_REGISTRY.map((section) => {
            const isActive = activeSection === section.label;
            return (
              <button
                key={section.id}
                onClick={() => handleSectionSelect(section)}
                className={`w-full flex items-center justify-between p-5 rounded-4xl border transition-all duration-300 group
                  ${isActive 
                    ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-xl shadow-amber-500/5' 
                    : theme === 'dark' 
                      ? 'bg-zinc-950 border-zinc-800/60 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300' 
                      : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-800'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl border transition-colors
                    ${isActive ? 'bg-amber-500 text-black border-amber-500' : 'bg-zinc-900 border-zinc-800'}`}>
                    <section.icon size={16} />
                  </div>
                  <div className="text-left">
                    <p className={`text-[8px] font-black uppercase tracking-widest leading-none mb-1
                      ${isActive ? 'text-amber-500' : 'text-zinc-600'}`}>
                      {section.code}
                    </p>
                    <h5 className={`text-[11px] font-black uppercase tracking-tight leading-none
                      ${isActive ? 'text-white' : 'text-inherit group-hover:text-zinc-200'}`}>
                      {section.label}
                    </h5>
                  </div>
                </div>
                {isActive && <ChevronRight size={14} className="animate-in slide-in-from-left-2" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Operational Pulse Footer */}
      <div className={`p-6 rounded-[2.5rem] border text-left
        ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800/60 shadow-inner' : 'bg-white border-zinc-200 shadow-xl'}`}>
        <p className="text-[8px] font-black uppercase text-zinc-600 tracking-[0.3em] mb-2 italic">
          Active Protocol
        </p>
        <p className={`text-[10px] font-bold leading-tight ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Capturing <span className="text-amber-500 italic">{activeTool.toUpperCase()}</span> data for the 
          <span className="text-amber-500 italic"> {activeSection}</span> node.
        </p>
      </div>
    </aside>
  );
};

export default SMMWorkSections;


