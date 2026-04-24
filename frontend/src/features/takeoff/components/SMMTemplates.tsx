/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Box,
  Layers,
  Calculator,
  MinusCircle,
  PlusCircle,
  Activity,
  Zap,
  Info,
  Ruler
} from "lucide-react";
import type { SmmParams } from "../types/takeoff";

export type SMMSection = "Concrete" | "Walling" | "Finishes";

interface SMMTemplatesProps {
  activeSection: string;
  onParameterChange: (params: SmmParams) => void;
  isDeductionMode: boolean;
  setIsDeductionMode: (val: boolean) => void;
  theme?: string;
}

/** --- MAIN COMPONENT: MEASUREMENT SETTINGS --- **/

const SMMTemplates: React.FC<SMMTemplatesProps> = ({
  activeSection,
  onParameterChange,
  isDeductionMode,
  setIsDeductionMode,
  theme = 'dark'
}) => {
  const [depth, setDepth] = useState("0.150");
  const [height, setHeight] = useState("3.000");
  const [wasteFactor, setWasteFactor] = useState("5");

  const category: SMMSection = activeSection.includes("Concrete")
    ? "Concrete"
    : activeSection.includes("Walling")
      ? "Walling"
      : "Finishes";

  // Handshake: Update the "Brain" whenever these numbers change
  useEffect(() => {
    onParameterChange({
      depth: parseFloat(depth) || 0,
      height: parseFloat(height) || 0,
      waste: parseFloat(wasteFactor) || 0,
      mode: isDeductionMode ? "DEDUCTION" : "ADDITION",
    });
  }, [depth, height, wasteFactor, isDeductionMode, onParameterChange]);

  return (
    <div className={`p-6 sm:p-10 rounded-[2.5rem] border-2 transition-all duration-500 shadow-2xl backdrop-blur-3xl
      ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
      
      <div className="space-y-10">
        {/* 1. HEADER: SETTINGS TITLE */}
        <div className="flex justify-between items-center">
          <div className="text-left space-y-2">
            <h4 className={`text-2xl font-black uppercase italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
              Measurement Rules<span className="text-amber-500">.</span>
            </h4>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">
              Simple settings for {category} works
            </p>
          </div>
          <div className={`p-4 rounded-2xl border shadow-inner ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-600' : 'bg-zinc-50 border-zinc-100 text-zinc-400'}`}>
            <Calculator size={20} strokeWidth={2.5} />
          </div>
        </div>

        {/* 2. CURRENT WORK AREA CHIP */}
        <div className={`p-5 rounded-[2rem] border-2 flex items-center gap-5 transition-all shadow-xl
          ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
          <div className="p-3 rounded-xl bg-amber-500 text-black shadow-lg">
            {category === "Concrete" ? <Box size={22} /> : category === "Walling" ? <Layers size={22} /> : <Activity size={22} />}
          </div>
          <div className="text-left">
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1 leading-none italic">Active Work Type</p>
            <p className={`text-sm font-black uppercase tracking-tight leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              {activeSection}
            </p>
          </div>
        </div>

        {/* 3. MEASUREMENT SPECS (simplified for newbies) */}
        <div className="space-y-8">
          <div className="flex items-center gap-3 ml-2 opacity-60">
             <Ruler size={14} className="text-amber-500" />
             <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">How deep or high is this?</label>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Conditional Input: Depth for Concrete */}
            {category === "Concrete" && (
              <div className="space-y-3 text-left">
                <div className="flex justify-between items-center px-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Concrete Thickness (m)</span>
                  <span className="text-emerald-500 text-[10px] font-black italic">VOLUME: m³</span>
                </div>
                <div className="relative group">
                  <input
                    type="number"
                    step="0.001"
                    value={depth}
                    onChange={(e) => setDepth(e.target.value)}
                    className={`w-full p-6 rounded-3xl font-black text-2xl italic tracking-tighter outline-none border-2 transition-all shadow-inner
                      ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200 text-zinc-950 focus:border-amber-500'}`}
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-700 uppercase italic">Meters</div>
                </div>
              </div>
            )}

            {/* Conditional Input: Height for Walling */}
            {category === "Walling" && (
              <div className="space-y-3 text-left">
                <div className="flex justify-between items-center px-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">How tall is the wall? (m)</span>
                  <span className="text-emerald-500 text-[10px] font-black italic">AREA: m²</span>
                </div>
                <div className="relative group">
                  <input
                    type="number"
                    step="0.001"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className={`w-full p-6 rounded-3xl font-black text-2xl italic tracking-tighter outline-none border-2 transition-all shadow-inner
                      ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200 text-zinc-950 focus:border-amber-500'}`}
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-700 uppercase italic">Meters</div>
                </div>
              </div>
            )}

            {/* General Input: Waste Factor */}
            <div className="space-y-3 text-left">
              <span className="text-[10px] font-bold uppercase px-4 tracking-widest text-zinc-500">Extra material (Waste %)</span>
              <div className="relative group">
                <input
                  type="number"
                  value={wasteFactor}
                  onChange={(e) => setWasteFactor(e.target.value)}
                  className={`w-full p-6 rounded-3xl font-black text-2xl italic tracking-tighter outline-none border-2 transition-all shadow-inner
                    ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200 text-zinc-950 focus:border-amber-500'}`}
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-700 uppercase italic">% Added</div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. CALCULATION MODE: ADD OR SUBTRACT */}
        <div className="space-y-5">
          <div className="flex items-center gap-3 ml-2 opacity-60">
             <Info size={14} className="text-amber-500" />
             <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Add or Subtract from bill?</label>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setIsDeductionMode(false)}
              className={`flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all active:scale-95 shadow-xl
                ${!isDeductionMode
                    ? "bg-emerald-500 border-emerald-600 text-black shadow-emerald-500/20"
                    : "bg-zinc-950/20 border-zinc-800 text-zinc-600 opacity-60"}`}
            >
              <div className="flex items-center gap-4">
                <PlusCircle size={22} strokeWidth={3} />
                <span className="text-xs font-black uppercase tracking-widest">Normal Addition</span>
              </div>
              {!isDeductionMode && <div className="w-2 h-2 rounded-full bg-black animate-pulse" />}
            </button>

            <button
              type="button"
              onClick={() => setIsDeductionMode(true)}
              className={`flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all active:scale-95 shadow-xl
                ${isDeductionMode
                    ? "bg-rose-500 border-rose-600 text-white shadow-rose-500/20"
                    : "bg-zinc-950/20 border-zinc-800 text-zinc-600 opacity-60"}`}
            >
              <div className="flex items-center gap-4">
                <MinusCircle size={22} strokeWidth={3} />
                <span className="text-xs font-black uppercase tracking-widest">Subtract (Deduction)</span>
              </div>
              {isDeductionMode && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
            </button>
          </div>
        </div>

        {/* 5. LOGIC TRACE: SIMPLIFIED FOOTER */}
        <div className={`p-6 rounded-3xl border-2 flex items-start gap-4 transition-all
          ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-100 shadow-inner'}`}>
          <div className="mt-1 shrink-0">
            <Zap size={16} className="text-amber-500" />
          </div>
          <div className="text-left space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest leading-none text-zinc-500">Standard Rule Applied</p>
            <p className={`text-[10px] font-bold uppercase leading-relaxed tracking-tight ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Using <span className="text-amber-500 italic">SMM-Kenya guidelines</span> to calculate {category} totals accurately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMMTemplates;