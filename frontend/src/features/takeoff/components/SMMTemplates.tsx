import React, { useState, useEffect } from 'react';
import {
  Box, 
  Layers, 
  Calculator, 
  MinusCircle, 
  PlusCircle, 
  Activity,
  Zap,
} from 'lucide-react';
import { useAuth } from "../../auth/AuthContext";
import type { SmmParams } from "../types/takeoff";

/** --- TYPES --- **/
export type SMMSection = 'Concrete' | 'Walling' | 'Finishes';

interface SMMTemplatesProps {
  activeSection: string;
  onParameterChange: (params: SmmParams) => void;
  isDeductionMode: boolean;
  setIsDeductionMode: (val: boolean) => void;
}

/** --- MAIN COMPONENT: MEASUREMENT RULES ENGINE --- **/
const SMMTemplates: React.FC<SMMTemplatesProps> = ({ 
  activeSection, 
  onParameterChange, 
  isDeductionMode, 
  setIsDeductionMode 
}) => {
  const { theme } = useAuth();

  /** * THE Z-AXIS PARAMETERS
   * Handling dimensions not visible on a 2D sheet.
   */
  const [depth, setDepth] = useState("0.150");
  const [height, setHeight] = useState("3.000");
  const [wasteFactor, setWasteFactor] = useState("5");

  /** * CONTEXTUAL HANDSHAKE */
  const category: SMMSection = activeSection.includes('Concrete') 
    ? 'Concrete' 
    : activeSection.includes('Walling') 
      ? 'Walling' 
      : 'Finishes';

  /** * ENGINE SYNCHRONIZATION */
  useEffect(() => {
    onParameterChange({
      depth: parseFloat(depth) || 0,
      height: parseFloat(height) || 0,
      waste: parseFloat(wasteFactor) || 0,
      mode: isDeductionMode ? 'DEDUCTION' : 'ADDITION'
    });
  }, [depth, height, wasteFactor, isDeductionMode, onParameterChange]);

  return (
    <div className="w-full animate-in fade-in duration-500">
      
      {/* 3-COLUMN WIDE LAYOUT */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        
        {/* COLUMN 1: CONTEXT & COMPLIANCE */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
             <Calculator size={18} className="text-zinc-500" />
             <label className={`text-[11px] font-black uppercase tracking-widest italic leading-none ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
               Active Ruleset
             </label>
          </div>
          
          <div className={`p-6 rounded-4xl border-2 flex items-center gap-5 transition-colors duration-500
            ${theme === 'dark' ? 'bg-zinc-950/80 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
            <div className="p-4 rounded-2xl bg-amber-500 text-black shadow-lg shadow-amber-500/20 shrink-0">
              {category === 'Concrete' ? <Box size={24} strokeWidth={2.5} /> : category === 'Walling' ? <Layers size={24} strokeWidth={2.5} /> : <Activity size={24} strokeWidth={2.5} />}
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] mb-1.5 leading-none italic">Category Focus</p>
              <p className={`text-lg font-black uppercase tracking-tight leading-none ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-900'}`}>
                {activeSection}
              </p>
            </div>
          </div>

          <div className={`p-6 rounded-4xl border-2 flex items-start gap-4 opacity-70 transition-colors
            ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <div className="mt-0.5"><Zap size={16} className="text-amber-500" /></div>
            <div className="text-left space-y-1.5">
               <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 leading-none">Logic Trace</p>
               <p className={`text-[11px] font-bold uppercase leading-relaxed tracking-widest ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                 Calculations governed by <span className="text-amber-500 italic">SMM-KE Standards</span>.
               </p>
            </div>
          </div>
        </div>

        {/* COLUMN 2: DIMENSIONAL PARAMETERS (THE Z-AXIS) */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
             <Layers size={18} className="text-zinc-500" />
             <label className={`text-[11px] font-black uppercase tracking-widest italic leading-none ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
               Dimensional Parameters
             </label>
          </div>

          <div className="space-y-4">
            {/* Conditional Depth for Concrete */}
            {category === 'Concrete' && (
              <div className="space-y-2.5 text-left">
                <div className="flex justify-between items-center ml-2">
                  <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Concrete Depth (m)</span>
                  <span className="text-[9px] font-mono text-amber-500 uppercase font-black tracking-widest">Output: m³</span>
                </div>
                <div className="relative group h-16">
                  <input 
                    type="number" step="0.001" value={depth}
                    onChange={(e) => setDepth(e.target.value)}
                    className={`w-full h-full pl-6 pr-24 rounded-2xl border-2 font-black text-xl outline-none focus:border-amber-500 transition-all shadow-inner
                      ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`} 
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[11px] font-black text-zinc-500 group-focus-within:text-amber-500 transition-colors uppercase tracking-widest">Thickness</div>
                </div>
              </div>
            )}

            {/* Conditional Height for Walling */}
            {category === 'Walling' && (
              <div className="space-y-2.5 text-left">
                <div className="flex justify-between items-center ml-2">
                  <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Wall Height (m)</span>
                  <span className="text-[9px] font-mono text-amber-500 uppercase font-black tracking-widest">Output: m²</span>
                </div>
                <div className="relative group h-16">
                  <input 
                    type="number" step="0.001" value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className={`w-full h-full pl-6 pr-24 rounded-2xl border-2 font-black text-xl outline-none focus:border-amber-500 transition-all shadow-inner
                      ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`} 
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[11px] font-black text-zinc-500 group-focus-within:text-amber-500 transition-colors uppercase tracking-widest">Height</div>
                </div>
              </div>
            )}

            {/* Universal Wastage Factor */}
            <div className="space-y-2.5 text-left">
              <div className="flex justify-between items-center ml-2">
                 <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Wastage Allowance</span>
              </div>
              <div className="relative group h-16">
                <input 
                  type="number" value={wasteFactor}
                  onChange={(e) => setWasteFactor(e.target.value)}
                  className={`w-full h-full pl-6 pr-24 rounded-2xl border-2 font-black text-xl outline-none focus:border-amber-500 transition-all shadow-inner
                    ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`} 
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[11px] font-black text-zinc-500 group-focus-within:text-amber-500 transition-colors uppercase tracking-widest">% Factor</div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 3: MEASUREMENT ACTION (POLARITY) */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
             <Activity size={18} className="text-zinc-500" />
             <label className={`text-[11px] font-black uppercase tracking-widest italic leading-none ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
               Measurement Action
             </label>
          </div>
          
          <div className="flex flex-col gap-4">
            <button 
              type="button" 
              onClick={() => setIsDeductionMode(false)}
              className={`flex items-center justify-between px-8 h-22 rounded-2xl border-2 transition-all active:scale-95
                ${!isDeductionMode 
                  ? 'bg-emerald-500 text-black border-emerald-500 shadow-xl shadow-emerald-500/20' 
                  : theme === 'dark' 
                    ? 'bg-zinc-950/50 border-zinc-800 text-zinc-500 hover:border-emerald-500/50 hover:text-emerald-500' 
                    : 'bg-white border-zinc-200 text-zinc-400 hover:border-emerald-500/50 hover:text-emerald-500 shadow-sm'}`}
            >
              <div className="flex items-center gap-4">
                <PlusCircle size={24} strokeWidth={2.5} className={!isDeductionMode ? 'fill-black/10' : ''} />
                <span className="text-sm font-black uppercase tracking-widest">Addition</span>
              </div>
              {!isDeductionMode && <div className="w-2 h-2 rounded-full bg-black animate-pulse" />}
            </button>

            <button 
              type="button" 
              onClick={() => setIsDeductionMode(true)}
              className={`flex items-center justify-between px-8 h-22 rounded-2xl border-2 transition-all active:scale-95
                ${isDeductionMode 
                  ? 'bg-rose-500 text-white border-rose-500 shadow-xl shadow-rose-500/20' 
                  : theme === 'dark' 
                    ? 'bg-zinc-950/50 border-zinc-800 text-zinc-500 hover:border-rose-500/50 hover:text-rose-500' 
                    : 'bg-white border-zinc-200 text-zinc-400 hover:border-rose-500/50 hover:text-rose-500 shadow-sm'}`}
            >
              <div className="flex items-center gap-4">
                <MinusCircle size={24} strokeWidth={2.5} className={isDeductionMode ? 'fill-black/20' : ''} />
                <span className="text-sm font-black uppercase tracking-widest">Deduction (Void)</span>
              </div>
              {isDeductionMode && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SMMTemplates;

