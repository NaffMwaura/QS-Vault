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

  const handleSectionSelect = (section: SMMSection) => {
    setActiveSection(section.label);
    setActiveTool(section.defaultTool);
  };

  return (
    <aside className="theme-page w-full h-auto overflow-visible flex flex-col space-y-10 p-6 transition-colors duration-500 sm:p-10">
      
      {/* 1. GUIDANCE HEADER */}
      <div className="theme-panel rounded-4xl border-2 p-6 transition-colors duration-500">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 shrink-0">
             <Info size={20} strokeWidth={2.5} />
          </div>
          <div className="text-left">
            <p className="theme-meta mb-1.5 text-[10px] font-black uppercase tracking-[0.3em] italic">
              Context Setup
            </p>
            <p className="theme-body text-sm font-bold leading-snug">
              Select a work section below. The system will automatically arm the correct measurement tool for that category.
            </p>
          </div>
        </div>
      </div>

      {/* 2. TOOL SELECTION HUB */}
      <div className="space-y-5">
        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--app-meta)] ml-1 italic block text-left">
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
              className={`flex flex-col items-center justify-center gap-3 py-6 rounded-2xl border-2 transition-all active:scale-95 shadow-xl
                ${activeTool === tool.id 
                  ? 'bg-[var(--app-accent-strong)] text-[var(--app-primary-fg)] border-[var(--app-accent-strong)] shadow-lg' 
                  : 'bg-[var(--app-surface)] text-[var(--app-meta)] border-[var(--app-border)] hover:border-[var(--app-accent-strong)] hover:text-[var(--app-accent-strong)]'}`}
            >
              <tool.icon size={28} strokeWidth={activeTool === tool.id ? 2.5 : 2} />
              <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${activeTool === tool.id ? 'opacity-80' : ''}`}>
                {tool.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. SMM COMPLIANCE CATEGORIES */}
      <div className="space-y-5 flex flex-col">
        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--app-meta)] ml-1 italic block text-left">
          Standard Work Sections (SMM-KE)
        </label>
        
        <div className="space-y-3">
          {SMM_REGISTRY.map((section) => {
            const isActive = activeSection === section.label;
            return (
              <button
                key={section.id}
                onClick={() => handleSectionSelect(section)}
                className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-500 group relative overflow-hidden
                  ${isActive 
                    ? 'theme-status-warning shadow-2xl' 
                    : 'bg-[var(--app-surface)] text-[var(--app-meta)] border-[var(--app-border)] hover:border-[var(--app-accent-strong)] hover:text-[var(--app-heading)] shadow-sm'}`}
              >
                {/* Decorative Background Pulse for Active Node */}
                {isActive && (
                  <div className="absolute inset-0 bg-[var(--app-accent-strong)] opacity-5 animate-pulse" />
                )}

                <div className="flex items-center gap-5 relative z-10">
                  <div className={`p-4 rounded-xl border-2 transition-all duration-500 shadow-inner
                    ${isActive ? 'bg-[var(--app-accent-strong)] text-[var(--app-primary-fg)] border-[var(--app-accent-strong)] scale-110 shadow-xl' : 'bg-[var(--app-surface)] border-[var(--app-border)] shadow-black'}`}>
                    <section.icon size={18} />
                  </div>
                  <div className="text-left">
                    <p className={`text-[9px] font-black uppercase tracking-[0.2em] leading-none mb-2
                      ${isActive ? 'text-[var(--app-accent-strong)]' : 'text-[var(--app-meta)]'}`}>
                      {section.code}
                    </p>
                    <h5 className={`text-[12px] font-black uppercase tracking-tight leading-none
                      ${isActive ? 'text-[var(--app-heading)]' : 'text-[var(--app-meta)] group-hover:text-[var(--app-heading)]'}`}>
                      {section.label}
                    </h5>
                  </div>
                </div>
                {isActive && <ChevronRight size={18} className="text-[var(--app-accent-strong)] animate-in slide-in-from-left-4 duration-500" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. OPERATIONAL TRACE SUMMARY */}
      <div className={`p-8 rounded-2xl border-2 border-[var(--app-border)] bg-[var(--app-surface-elevated)] text-left transition-all duration-500 relative overflow-hidden shadow-inner`}>
        
        <div className="flex items-center gap-3 mb-4">
           <Zap size={14} className="text-[var(--app-accent-strong)] animate-pulse" />
           <p className="text-[10px] font-black uppercase text-[var(--app-meta)] tracking-[0.3em] italic leading-none">
             Engine Armed
           </p>
        </div>
        
        <p className={`text-[11px] font-bold leading-relaxed text-[var(--app-meta)]`}>
          Active Tool: <span className="text-[var(--app-accent-strong)] italic uppercase">{activeTool}</span>
          <br/>
          Current Node: <span className="text-[var(--app-accent-strong)] italic uppercase">{activeSection}</span>
        </p>

        <div className="mt-6 pt-6 border-t border-[var(--app-border)] flex items-center gap-3 opacity-40">
           <Info size={14} className="text-[var(--app-meta)]" />
           <p className="text-[8px] font-black uppercase tracking-widest text-[var(--app-meta)]">
             Logic following SMM-KE 2026 Protocol
           </p>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--app-border); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--app-accent-strong); }
      `}</style>
    </aside>
  );
};

export default SMMWorkSections;
