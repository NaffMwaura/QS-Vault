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
  CheckCircle2,
  Zap
} from 'lucide-react';
import { useAuth } from "../../auth/AuthContext";

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

const SMM_REGISTRY: SMMSection[] = [
  { id: 'excavation', code: 'SEC-D', label: 'Excavation & Earthwork', icon: Pickaxe, defaultTool: 'area' },
  { id: 'concrete', code: 'SEC-F', label: 'Concrete Work', icon: Box, defaultTool: 'area' },
  { id: 'walling', code: 'SEC-G', label: 'Walling & Partitions', icon: Layers, defaultTool: 'length' },
  { id: 'finishes', code: 'SEC-U', label: 'Floor & Wall Finishes', icon: PaintBucket, defaultTool: 'area' },
  { id: 'openings', code: 'SEC-L', label: 'Doors & Windows', icon: DoorOpen, defaultTool: 'count' },
];

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
    <div className={`w-full h-full flex flex-col justify-between space-y-10 animate-in fade-in duration-500 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
      
      {/* 1. GUIDANCE HEADER */}
      <div className={`p-6 rounded-4xl border-2 transition-colors duration-500
        ${theme === 'dark' ? 'bg-zinc-950/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 shrink-0">
             <Info size={20} strokeWidth={2.5} />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-1.5 italic">
              Context Setup
            </p>
            <p className={`text-sm font-bold leading-snug ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
              Select a work section below. The system will automatically arm the correct measurement tool for that category.
            </p>
          </div>
        </div>
      </div>

      {/* 2. TOOL SELECTION HUB */}
      <div className="space-y-5">
        <div className="flex items-center gap-3">
           <Zap size={16} className="text-zinc-500" />
           <label className={`text-[11px] font-black uppercase tracking-widest italic leading-none
              ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
             Active Tool
           </label>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'area', icon: Target, label: 'Area' },
            { id: 'length', icon: Ruler, label: 'Length' },
            { id: 'count', icon: Hash, label: 'Count' },
          ].map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id as MeasurementTool)}
              className={`flex flex-col items-center justify-center gap-3 h-24 rounded-3xl border-2 transition-all active:scale-95
                ${activeTool === tool.id 
                  ? 'bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20' 
                  : theme === 'dark' 
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white' 
                    : 'bg-white border-zinc-200 text-zinc-500 hover:border-amber-500/50 hover:text-zinc-900 shadow-sm'}`}
            >
              <tool.icon size={28} strokeWidth={activeTool === tool.id ? 2.5 : 2} />
              <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${activeTool === tool.id ? 'opacity-80' : ''}`}>
                {tool.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. SMM COMPLIANCE CATEGORIES */}
      <div className={`space-y-5 pt-4 border-t ${theme === 'dark' ? 'border-zinc-800/30' : 'border-zinc-200'}`}>
        <div className="flex items-center gap-3">
           <Layers size={16} className="text-zinc-500" />
           <label className={`text-[11px] font-black uppercase tracking-widest italic leading-none
              ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
             Standard Work Sections (SMM-KE)
           </label>
        </div>
        
        <div className="space-y-3">
          {SMM_REGISTRY.map((section) => {
            const isActive = activeSection === section.label;
            return (
              <button
                key={section.id}
                onClick={() => handleSectionSelect(section)}
                className={`w-full flex items-center justify-between p-4 rounded-4xl border-2 transition-all duration-300 group relative overflow-hidden
                  ${isActive 
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-md' 
                    : theme === 'dark' 
                      ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700' 
                      : 'bg-white border-zinc-200 text-zinc-600 hover:border-amber-500/30 shadow-sm'}`}
              >
                <div className="flex items-center gap-5 relative z-10">
                  <div className={`p-3.5 rounded-xl border-2 transition-all duration-300
                    ${isActive 
                      ? 'bg-amber-500 text-black border-amber-500 shadow-xl' 
                      : theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                    <section.icon size={20} strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <p className={`text-[10px] font-black uppercase tracking-[0.3em] leading-none mb-1.5 italic
                      ${isActive ? 'text-amber-500' : 'text-zinc-500'}`}>
                      {section.code}
                    </p>
                    <h5 className={`text-[14px] font-black uppercase tracking-tight leading-none
                      ${isActive ? (theme === 'dark' ? 'text-white' : 'text-zinc-900') : (theme === 'dark' ? 'text-zinc-300 group-hover:text-white' : 'text-zinc-700 group-hover:text-black')}`}>
                      {section.label}
                    </h5>
                  </div>
                </div>
                {isActive && (
                   <ChevronRight size={24} strokeWidth={3} className="text-amber-500 animate-in slide-in-from-left-4 duration-500 mr-2" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. COMPLIANCE FOOTER */}
      <div className={`flex items-center justify-between pt-6 border-t opacity-60 ${theme === 'dark' ? 'border-zinc-800/30' : 'border-zinc-200'}`}>
         <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 leading-none">
           Engine Status
         </p>
         <div className="flex items-center gap-2 text-amber-500">
            <CheckCircle2 size={14} />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] italic leading-none">Auto-Arming Active</span>
         </div>
      </div>

    </div>
  );
};

export default SMMWorkSections;