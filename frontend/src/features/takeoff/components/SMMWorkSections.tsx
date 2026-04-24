/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Zap,
  MousePointer2
} from 'lucide-react';

/** --- TYPES --- **/

export type MeasurementTool = 'length' | 'area' | 'count';

interface SMMSection {
  id: string;
  code: string;
  label: string;
  icon: React.ElementType;
  defaultTool: MeasurementTool;
  description: string; // Added for newbie clarity
}

interface SMMWorkSectionsProps {
  activeSection: string;
  setActiveSection: (id: string) => void;
  activeTool: MeasurementTool;
  setActiveTool: (tool: MeasurementTool) => void;
  theme?: string;
}

const SMM_REGISTRY: SMMSection[] = [
  { id: 'excavation', code: 'SEC-D', label: 'Excavation', icon: Pickaxe, defaultTool: 'area', description: 'Digging and earthworks' },
  { id: 'concrete', code: 'SEC-F', label: 'Concrete Work', icon: Box, defaultTool: 'area', description: 'Slabs, beams, and columns' },
  { id: 'walling', code: 'SEC-G', label: 'Walling', icon: Layers, defaultTool: 'length', description: 'Stone or brick partitions' },
  { id: 'finishes', code: 'SEC-U', label: 'Finishes', icon: PaintBucket, defaultTool: 'area', description: 'Tiling, plaster, and paint' },
  { id: 'openings', code: 'SEC-L', label: 'Doors & Windows', icon: DoorOpen, defaultTool: 'count', description: 'Counting frames and units' },
];

/** --- MAIN COMPONENT: WORK CATEGORY & TOOL SELECTOR --- **/

const SMMWorkSections: React.FC<SMMWorkSectionsProps> = ({ 
  activeSection, 
  setActiveSection, 
  activeTool, 
  setActiveTool,
  theme = 'dark'
}) => {

  const handleSectionSelect = (section: SMMSection) => {
    setActiveSection(section.label);
    setActiveTool(section.defaultTool);
  };

  return (
    <aside className="w-full h-auto overflow-visible flex flex-col space-y-10 p-4 sm:p-0 transition-colors duration-500">
      
      {/* 1. SIMPLE GUIDANCE HEADER */}
      <div className={`p-6 rounded-[2rem] border-2 transition-all shadow-xl
        ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
        <div className="flex items-start gap-5">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 shrink-0">
             <Info size={20} strokeWidth={2.5} />
          </div>
          <div className="text-left space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">Step 1: Pick Category</p>
            <p className={`text-sm font-bold leading-snug ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
              Select the type of work you are measuring. We will automatically pick the best tool for you.
            </p>
          </div>
        </div>
      </div>

      {/* 2. TOOL SELECTION HUB (Visual Overrides) */}
      <div className="space-y-5">
        <div className="flex items-center gap-3 ml-2 opacity-60">
           <MousePointer2 size={14} className="text-amber-500" />
           <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Measurement Tools</label>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'area', icon: Target, label: 'Area ($m^2$)' },
            { id: 'length', icon: Ruler, label: 'Length ($m$)' },
            { id: 'count', icon: Hash, label: 'Count ($Nr$)' },
          ].map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id as MeasurementTool)}
              className={`flex flex-col items-center justify-center gap-3 py-6 rounded-2xl border-2 transition-all active:scale-95 shadow-xl
                ${activeTool === tool.id 
                  ? 'bg-amber-500 text-black border-amber-600 shadow-amber-500/20' 
                  : theme === 'dark' 
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600' 
                    : 'bg-white border-zinc-200 text-zinc-400 hover:border-zinc-300'}`}
            >
              <tool.icon size={28} strokeWidth={activeTool === tool.id ? 3 : 2} />
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                {tool.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. WORK CATEGORIES (Simplified SMM-KE) */}
      <div className="space-y-5 flex flex-col">
        <div className="flex items-center gap-3 ml-2 opacity-60">
           <Layers size={14} className="text-amber-500" />
           <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Work Categories</label>
        </div>
        
        <div className="space-y-4">
          {SMM_REGISTRY.map((section) => {
            const isActive = activeSection === section.label;
            return (
              <button
                key={section.id}
                onClick={() => handleSectionSelect(section)}
                className={`w-full flex items-center justify-between p-6 rounded-3xl border-2 transition-all duration-500 group relative overflow-hidden
                  ${isActive 
                    ? 'bg-amber-500/10 border-amber-500 shadow-2xl' 
                    : theme === 'dark' 
                      ? 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700' 
                      : 'bg-white border-zinc-100 shadow-sm hover:border-amber-500/30'}`}
              >
                {isActive && <div className="absolute inset-0 bg-amber-500/5 animate-pulse" />}

                <div className="flex items-center gap-6 relative z-10 text-left">
                  <div className={`p-4 rounded-2xl border-2 transition-all duration-500 shadow-inner
                    ${isActive ? 'bg-amber-500 text-black border-amber-400 scale-110' : 'bg-zinc-950 border-zinc-800'}`}>
                    <section.icon size={20} />
                  </div>
                  <div className="text-left space-y-1">
                    <p className={`text-[9px] font-black uppercase tracking-widest leading-none
                      ${isActive ? 'text-amber-500' : 'text-zinc-600'}`}>
                      {section.code}
                    </p>
                    <h5 className={`text-sm font-black uppercase tracking-tight leading-none
                      ${isActive ? (theme === 'dark' ? 'text-white' : 'text-black') : 'text-zinc-500'}`}>
                      {section.label}
                    </h5>
                    <p className="text-[9px] font-bold text-zinc-700 uppercase leading-none italic">{section.description}</p>
                  </div>
                </div>
                {isActive && <ChevronRight size={20} className="text-amber-500 animate-in slide-in-from-left-4 duration-500" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. ACTIVE STATUS SUMMARY */}
      <div className={`p-8 rounded-[2rem] border-2 flex flex-col gap-4 transition-all duration-500 shadow-inner
        ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
        
        <div className="flex items-center gap-3">
           <Zap size={16} className="text-amber-500 animate-pulse" />
           <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] italic">Current Setup</p>
        </div>
        
        <div className="flex flex-col gap-2 text-left">
          <p className="text-xs font-bold text-zinc-400">
            Armed Tool: <span className="text-amber-500 uppercase italic">{activeTool} Mode</span>
          </p>
          <p className="text-xs font-bold text-zinc-400">
            Targeting: <span className="text-amber-500 uppercase italic">{activeSection}</span>
          </p>
        </div>

        <div className="pt-4 border-t border-zinc-800 flex items-center gap-3 opacity-40">
           <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600">
             Logic following Professional SMM Standard
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

