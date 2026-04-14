import React, { useState, useEffect } from 'react';
import {
  Box, 
  Layers, 
  Calculator, 
  MinusCircle, 
  PlusCircle, 
  Activity,
  Zap
} from 'lucide-react';
import type { SmmParams } from "../types/takeoff";

export type SMMSection = 'Concrete' | 'Walling' | 'Finishes';

interface SMMTemplatesProps {
  activeSection: string;
  onParameterChange: (params: SmmParams) => void;
  isDeductionMode: boolean;
  setIsDeductionMode: (val: boolean) => void;
}

const SMMTemplates: React.FC<SMMTemplatesProps> = ({ 
  activeSection, 
  onParameterChange, 
  isDeductionMode, 
  setIsDeductionMode 
}) => {
  const [depth, setDepth] = useState("0.150");
  const [height, setHeight] = useState("3.000");
  const [wasteFactor, setWasteFactor] = useState("5");

  const category: SMMSection = activeSection.includes('Concrete') 
    ? 'Concrete' 
    : activeSection.includes('Walling') 
      ? 'Walling' 
      : 'Finishes';

  useEffect(() => {
    onParameterChange({
      depth: parseFloat(depth) || 0,
      height: parseFloat(height) || 0,
      waste: parseFloat(wasteFactor) || 0,
      mode: isDeductionMode ? 'DEDUCTION' : 'ADDITION'
    });
  }, [depth, height, wasteFactor, isDeductionMode, onParameterChange]);

  return (
    <div className="theme-panel p-8 rounded-[3rem] transition-all duration-500 overflow-hidden shadow-2xl backdrop-blur-3xl">
      <div className="space-y-8">
        <div className="flex justify-between items-start">
          <div className="text-left space-y-1">
            <h4 className="theme-heading text-xl font-black uppercase italic tracking-tighter leading-none">
              Measurement Rules
            </h4>
            <p className="theme-meta text-[9px] font-black uppercase tracking-[0.3em]">
              SMM-KE Standard Templates
            </p>
          </div>
          <div className="theme-card p-3 rounded-2xl shadow-inner">
            <Calculator size={18} className="theme-accent" />
          </div>
        </div>

        <div className="theme-card p-5 rounded-4xl flex items-center gap-5 transition-all duration-500">
          <div className="theme-accent-surface p-4 rounded-2xl text-amber-500 shadow-lg">
            {category === 'Concrete' ? <Box size={20} className="theme-accent" /> : category === 'Walling' ? <Layers size={20} className="theme-accent" /> : <Activity size={20} className="theme-accent" />}
          </div>
          <div className="text-left">
            <p className="theme-meta text-[8px] font-black uppercase tracking-[0.2em] mb-1.5 leading-none">Contextual Ruleset</p>
            <p className="theme-body text-sm font-black uppercase tracking-tight leading-none">
              {activeSection} Works
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <label className="theme-meta text-[10px] font-black uppercase tracking-widest ml-1 italic block text-left">
            Vertical Specifications
          </label>

          <div className="space-y-5">
            {category === 'Concrete' && (
              <div className="space-y-3 text-left">
                <div className="flex justify-between items-center ml-2">
                  <span className="theme-meta text-[9px] font-bold uppercase tracking-widest">Slab / Footing Depth (m)</span>
                  <span className="theme-accent text-[8px] font-mono opacity-60 uppercase font-black">Result: m³</span>
                </div>
                <div className="relative group">
                  <input 
                    type="number" step="0.001" value={depth}
                    onChange={(e) => setDepth(e.target.value)}
                    className="theme-input w-full p-5 rounded-2xl font-black text-xl italic tracking-tighter outline-none focus:theme-border shadow-inner" 
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] theme-meta font-black group-focus-within:theme-accent transition-colors uppercase italic">Depth</div>
                </div>
              </div>
            )}

            {category === 'Walling' && (
              <div className="space-y-3 text-left">
                <div className="flex justify-between items-center ml-2">
                  <span className="theme-meta text-[9px] font-bold uppercase tracking-widest">Wall Height (m)</span>
                  <span className="theme-accent text-[8px] font-mono opacity-60 uppercase font-black">Result: m²</span>
                </div>
                <div className="relative group">
                  <input 
                    type="number" step="0.001" value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="theme-input w-full p-5 rounded-2xl font-black text-xl italic tracking-tighter outline-none focus:theme-border shadow-inner" 
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] theme-meta font-black group-focus-within:theme-accent transition-colors uppercase italic">Height</div>
                </div>
              </div>
            )}

            <div className="space-y-3 text-left">
              <span className="theme-meta text-[9px] font-bold uppercase ml-2 tracking-widest">Wastage Allowance (%)</span>
              <div className="relative group">
                <input 
                  type="number" value={wasteFactor}
                  onChange={(e) => setWasteFactor(e.target.value)}
                  className="theme-input w-full p-5 rounded-2xl font-black text-xl italic tracking-tighter outline-none focus:theme-border shadow-inner" 
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] theme-meta font-black group-focus-within:theme-accent transition-colors uppercase italic">% Factor</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="theme-meta text-[10px] font-black uppercase tracking-widest ml-1 italic block text-left">
            Billing Polarity
          </label>
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={() => setIsDeductionMode(false)}
              className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl border transition-all active:scale-95 shadow-lg
                ${!isDeductionMode 
                  ? 'bg-emerald-500 text-black border-emerald-500 shadow-emerald-500/20' 
                  : 'theme-button-secondary opacity-60'}`}
            >
              <PlusCircle size={14} className={!isDeductionMode ? 'fill-current' : ''} />
              <span className="text-[10px] font-black uppercase tracking-widest">Addition</span>
            </button>
            <button 
              type="button" 
              onClick={() => setIsDeductionMode(true)}
              className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl border transition-all active:scale-95 shadow-lg
                ${isDeductionMode 
                  ? 'bg-rose-500 text-white border-rose-500 shadow-rose-500/20' 
                  : 'theme-button-secondary opacity-60'}`}
            >
              <MinusCircle size={14} className={isDeductionMode ? 'fill-current' : ''} />
              <span className="text-[10px] font-black uppercase tracking-widest">Deduction</span>
            </button>
          </div>
        </div>

        <div className="theme-panel p-5 rounded-2xl flex items-start gap-4 opacity-60 shadow-inner">
          <div className="mt-0.5"><Zap size={14} className="theme-accent" /></div>
          <div className="text-left space-y-1">
             <p className="theme-meta text-[9px] font-black uppercase tracking-widest leading-none">Logic Trace</p>
             <p className="theme-body text-[8px] font-bold uppercase leading-relaxed tracking-tight">
               Measurements are governed by the <span className="theme-accent italic">SMM-KE Standard Protocol</span> for {category} operations.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMMTemplates;
