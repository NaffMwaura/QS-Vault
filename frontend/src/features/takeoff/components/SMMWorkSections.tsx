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
  description: string;
}

interface SMMWorkSectionsProps {
  activeSection: string;
  setActiveSection: (id: string) => void;
  activeTool: MeasurementTool;
  setActiveTool: (tool: MeasurementTool) => void;
  theme?: string;
}

/** --- THE REGISTRY: SMM-KE (KENYA) STANDARDS --- **/
const SMM_REGISTRY: SMMSection[] = [
  { id: 'excavation', code: 'SEC-D', label: 'Excavation', icon: Pickaxe, defaultTool: 'area', description: 'Bulk digging and trenches' },
  { id: 'concrete', code: 'SEC-F', label: 'Concrete Work', icon: Box, defaultTool: 'area', description: 'Foundations and slabs' },
  { id: 'walling', code: 'SEC-G', label: 'Walling', icon: Layers, defaultTool: 'length', description: 'Stone and brick masonry' },
  { id: 'finishes', code: 'SEC-U', label: 'Finishes', icon: PaintBucket, defaultTool: 'area', description: 'Plaster, floor and wall tiles' },
  { id: 'openings', code: 'SEC-L', label: 'Doors & Windows', icon: DoorOpen, defaultTool: 'count', description: 'Joinery and glazing units' },
];

/** --- MAIN COMPONENT: TRADE & TOOL SELECTOR --- **/
const SMMWorkSections: React.FC<SMMWorkSectionsProps> = ({ 
  activeSection, 
  setActiveSection, 
  activeTool, 
  setActiveTool,
  theme = 'dark'
}) => {

  // Auto-configures the tool based on the trade selected
  const handleSectionSelect = (section: SMMSection) => {
    setActiveSection(section.label);
    setActiveTool(section.defaultTool);
  };

  return (
    <div className="w-full flex flex-col space-y-8 transition-colors duration-500">
      
      {/* 1. ASSISTANT HEADER */}
      <div className={`p-6 rounded-[2rem] border-2 transition-all shadow-xl
        ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
        <div className="flex items-start gap-4">
          <Info size={18} className="text-amber-500 shrink-0 mt-1" />
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-1">Trade Selection</p>
            <p className={`text-xs font-bold leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Pick a work category. The system will arm the correct tool and apply the right measurement rules.
            </p>
          </div>
        </div>
      </div>

      {/* 2. MANUAL TOOL OVERRIDE */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 ml-2 opacity-40">
           <MousePointer2 size={12} className="text-amber-500" />
           <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Override Tool</label>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'area', icon: Target, label: 'Area' },
            { id: 'length', icon: Ruler, label: 'Length' },
            { id: 'count', icon: Hash, label: 'Count' },
          ].map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id as MeasurementTool)}
              className={`flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border-2 transition-all active:scale-95
                ${activeTool === tool.id 
                  ? 'bg-amber-500 text-black border-amber-600 shadow-lg shadow-amber-500/10' 
                  : theme === 'dark' 
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-500' 
                    : 'bg-white border-zinc-200 text-zinc-400'}`}
            >
              <tool.icon size={22} strokeWidth={activeTool === tool.id ? 3 : 2} />
              <span className="text-[8px] font-black uppercase tracking-tighter">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. CATEGORY LIST */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 ml-2 opacity-40">
           <Layers size={12} className="text-amber-500" />
           <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">SMM-KE Work Sections</label>
        </div>
        
        <div className="space-y-3">
          {SMM_REGISTRY.map((section) => {
            const isActive = activeSection === section.label;
            return (
              <button
                key={section.id}
                onClick={() => handleSectionSelect(section)}
                className={`w-full flex items-center justify-between p-5 rounded-[1.8rem] border-2 transition-all duration-300 group
                  ${isActive 
                    ? 'bg-amber-500/10 border-amber-500 shadow-xl' 
                    : theme === 'dark' 
                      ? 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700' 
                      : 'bg-white border-zinc-100 hover:border-amber-500/20'}`}
              >
                <div className="flex items-center gap-4 text-left">
                  <div className={`p-3 rounded-xl border-2 transition-all
                    ${isActive ? 'bg-amber-500 text-black border-amber-400' : 'bg-zinc-950 border-zinc-800'}`}>
                    <section.icon size={18} />
                  </div>
                  <div>
                    <p className={`text-[8px] font-black uppercase tracking-widest leading-none mb-1
                      ${isActive ? 'text-amber-500' : 'text-zinc-600'}`}>
                      {section.code}
                    </p>
                    <h5 className={`text-sm font-black uppercase tracking-tight leading-none
                      ${isActive ? (theme === 'dark' ? 'text-white' : 'text-zinc-950') : 'text-zinc-500'}`}>
                      {section.label}
                    </h5>
                  </div>
                </div>
                {isActive && <ChevronRight size={18} className="text-amber-500" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. ACTIVE CONFIGURATION HUD */}
      <div className={`p-6 rounded-[2rem] border-2 flex items-center justify-between transition-all duration-500 shadow-inner
        ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
        <div className="flex flex-col gap-1 text-left">
           <div className="flex items-center gap-2 mb-1">
              <Zap size={14} className="text-amber-500" />
              <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Active Link</p>
           </div>
           <p className={`text-[10px] font-bold leading-none ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-800'}`}>
             Node: <span className="text-amber-500 uppercase">{activeSection}</span>
           </p>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
           <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Ready</span>
        </div>
      </div>
    </div>
  );
};

export default SMMWorkSections;
