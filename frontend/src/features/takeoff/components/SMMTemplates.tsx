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
  theme?: "light" | "dark";
}

/** --- THE CALCULATION BRAIN: SMM-KE SETTINGS --- **/
const SMMTemplates: React.FC<SMMTemplatesProps> = ({
  activeSection,
  onParameterChange,
  isDeductionMode,
  setIsDeductionMode,
  theme = 'dark'
}) => {
  // 1. LOCAL STATE: User inputs for the current trade
  const [depth, setDepth] = useState("0.150");
  const [height, setHeight] = useState("3.000");
  const [wasteFactor, setWasteFactor] = useState("5");

  // Determine the trade category based on the active section name
  const category: SMMSection = activeSection.toLowerCase().includes("concrete")
    ? "Concrete"
    : activeSection.toLowerCase().includes("walling")
      ? "Walling"
      : "Finishes";

  /** * 2. THE HANDSHAKE
   * This sends the settings back to the Workspace Hook.
   * Every time a number changes, the "Machine" re-calibrates.
   */
  useEffect(() => {
    onParameterChange({
      depth: parseFloat(depth) || 0.150,
      height: parseFloat(height) || 3.000,
      waste: parseFloat(wasteFactor) || 0,
      mode: isDeductionMode ? "DEDUCTION" : "ADDITION",
    });
  }, [depth, height, wasteFactor, isDeductionMode, onParameterChange]);

  return (
    <div className={`p-8 sm:p-10 rounded-[3rem] border-2 transition-all duration-500 shadow-2xl backdrop-blur-xl
      ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200'}`}>
      
      <div className="space-y-10">
        {/* HEADER: SECTION IDENTITY */}
        <div className="flex justify-between items-center border-b-2 border-zinc-800/40 pb-8">
          <div className="text-left space-y-2">
            <h4 className={`text-2xl font-black uppercase italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
              Calculation Rules<span className="text-amber-500">.</span>
            </h4>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">
              Standard Specs for {category}
            </p>
          </div>
          <div className={`p-4 rounded-2xl border shadow-inner ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-600' : 'bg-zinc-50 border-zinc-200 text-zinc-400'}`}>
            <Calculator size={20} />
          </div>
        </div>

        {/* ACTIVE TRADE CHIP */}
        <div className={`p-6 rounded-[2rem] border-2 flex items-center gap-5 shadow-lg
          ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
          <div className="p-3 rounded-xl bg-amber-500 text-black shadow-lg">
            {category === "Concrete" ? <Box size={20} /> : category === "Walling" ? <Layers size={20} /> : <Activity size={20} />}
          </div>
          <div className="text-left">
            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-1 leading-none italic">Active Workflow</p>
            <p className={`text-sm font-black uppercase tracking-tight leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              {activeSection}
            </p>
          </div>
        </div>

        {/* DYNAMIC INPUTS: DEPTH, HEIGHT, WASTE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {category === "Concrete" && (
            <div className="space-y-4 text-left">
              <label className="text-[10px] font-black uppercase px-4 tracking-widest text-zinc-500 italic flex items-center gap-2">
                <Ruler size={12} className="text-amber-500" /> Slab Depth (m)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  value={depth}
                  onChange={(e) => setDepth(e.target.value)}
                  className={`w-full p-6 rounded-3xl font-black text-2xl italic tracking-tighter outline-none border-2 transition-all shadow-inner
                    ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200 text-zinc-950'}`}
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-700 uppercase italic">m³ Volume</span>
              </div>
            </div>
          )}

          {category === "Walling" && (
            <div className="space-y-4 text-left">
              <label className="text-[10px] font-black uppercase px-4 tracking-widest text-zinc-500 italic flex items-center gap-2">
                <Ruler size={12} className="text-amber-500" /> Wall Height (m)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className={`w-full p-6 rounded-3xl font-black text-2xl italic tracking-tighter outline-none border-2 transition-all shadow-inner
                    ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200 text-zinc-950'}`}
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-700 uppercase italic">m² Area</span>
              </div>
            </div>
          )}

          <div className="space-y-4 text-left">
            <label className="text-[10px] font-black uppercase px-4 tracking-widest text-zinc-500 italic flex items-center gap-2">
              <Zap size={12} className="text-amber-500" /> Waste Allowance (%)
            </label>
            <div className="relative">
              <input
                type="number"
                value={wasteFactor}
                onChange={(e) => setWasteFactor(e.target.value)}
                className={`w-full p-6 rounded-3xl font-black text-2xl italic tracking-tighter outline-none border-2 transition-all shadow-inner
                  ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200 text-zinc-950'}`}
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-700 uppercase italic">% Extra</span>
            </div>
          </div>
        </div>

        {/* CALCULATION MODE: ADD OR SUBTRACT */}
        <div className="space-y-6">
          <label className="text-[10px] font-black uppercase px-4 tracking-widest text-zinc-500 italic block text-left">
            Mode of Entry
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setIsDeductionMode(false)}
              className={`flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all active:scale-95
                ${!isDeductionMode
                    ? "bg-emerald-500 border-emerald-600 text-black shadow-[0_10px_30px_rgba(16,185,129,0.2)]"
                    : "bg-zinc-950/20 border-zinc-800 text-zinc-600"}`}
            >
              <div className="flex items-center gap-4">
                <PlusCircle size={20} strokeWidth={3} />
                <span className="text-xs font-black uppercase tracking-widest italic">Addition</span>
              </div>
              {!isDeductionMode && <div className="w-2 h-2 rounded-full bg-black animate-pulse" />}
            </button>

            <button
              onClick={() => setIsDeductionMode(true)}
              className={`flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all active:scale-95
                ${isDeductionMode
                    ? "bg-rose-500 border-rose-600 text-white shadow-[0_10px_30px_rgba(244,63,94,0.2)]"
                    : "bg-zinc-950/20 border-zinc-800 text-zinc-600"}`}
            >
              <div className="flex items-center gap-4">
                <MinusCircle size={20} strokeWidth={3} />
                <span className="text-xs font-black uppercase tracking-widest italic">Deduction</span>
              </div>
              {isDeductionMode && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
            </button>
          </div>
        </div>

        {/* LOGIC TRACE FOOTER */}
        <div className={`p-6 rounded-[2rem] border-2 flex items-start gap-4 transition-all
          ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-100 shadow-inner'}`}>
          <Info size={16} className="text-amber-500 shrink-0 mt-1" />
          <div className="text-left">
            <p className="text-[9px] font-black uppercase tracking-widest leading-none text-zinc-500 mb-2">Audit Compliance</p>
            <p className={`text-[10px] font-bold uppercase leading-relaxed tracking-tight ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-700'}`}>
              Values are processed using <span className="text-amber-500 italic">SMM-KE V.1</span> logic. 
              Measurements are converted to <span className="text-amber-500 italic">Project Base Units</span> for reporting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMMTemplates;

