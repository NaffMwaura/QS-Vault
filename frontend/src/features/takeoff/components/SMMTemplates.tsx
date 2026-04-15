import React, { useState, useEffect } from "react";
import {
  Box,
  Layers,
  Calculator,
  MinusCircle,
  PlusCircle,
  Activity,
  Zap,
} from "lucide-react";
import type { SmmParams } from "../types/takeoff";

export type SMMSection = "Concrete" | "Walling" | "Finishes";

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
  setIsDeductionMode,
}) => {
  const [depth, setDepth] = useState("0.150");
  const [height, setHeight] = useState("3.000");
  const [wasteFactor, setWasteFactor] = useState("5");

  const category: SMMSection = activeSection.includes("Concrete")
    ? "Concrete"
    : activeSection.includes("Walling")
      ? "Walling"
      : "Finishes";

  useEffect(() => {
    onParameterChange({
      depth: parseFloat(depth) || 0,
      height: parseFloat(height) || 0,
      waste: parseFloat(wasteFactor) || 0,
      mode: isDeductionMode ? "DEDUCTION" : "ADDITION",
    });
  }, [depth, height, wasteFactor, isDeductionMode, onParameterChange]);

  return (
    <div className="theme-panel p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] transition-all duration-500 shadow-2xl backdrop-blur-3xl border theme-border">
      <div className="space-y-8">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div className="text-left space-y-1">
            <h4 className="theme-heading text-xl font-black uppercase italic tracking-tighter leading-none">
              Measurement Rules<span className="theme-accent">.</span>
            </h4>
            <p className="theme-meta text-[9px] font-black uppercase tracking-[0.3em] opacity-60">
              SMM-KE Standard Templates
            </p>
          </div>
          <div className="theme-card p-3 rounded-2xl shadow-inner">
            <Calculator size={18} className="theme-accent" />
          </div>
        </div>

        {/* CONTEXT CHIP */}
        <div className="theme-card p-4 rounded-3xl flex items-center gap-4 transition-all duration-500 border theme-border shadow-xl">
          <div className="theme-panel p-3 rounded-xl text-amber-500 shadow-lg">
            {category === "Concrete" ? (
              <Box size={20} className="theme-accent" />
            ) : category === "Walling" ? (
              <Layers size={20} className="theme-accent" />
            ) : (
              <Activity size={20} className="theme-accent" />
            )}
          </div>
          <div className="text-left">
            <p className="theme-meta text-[8px] font-black uppercase tracking-[0.2em] mb-1 leading-none opacity-50">
              Contextual Ruleset
            </p>
            <p className="theme-body text-sm font-black uppercase tracking-tight leading-none">
              {activeSection} Works
            </p>
          </div>
        </div>

        {/* INPUTS SECTION */}
        <div className="space-y-6">
          <label className="theme-meta text-[10px] font-black uppercase tracking-widest ml-1 italic block text-left opacity-70">
            Vertical Specifications
          </label>

          <div className="space-y-4">
            {/* Conditional Depth for Concrete */}
            {category === "Concrete" && (
              <div className="space-y-2 text-left">
                <div className="flex justify-between items-center px-2">
                  <span className="theme-meta text-[9px] font-bold uppercase tracking-widest">
                    Slab / Footing Depth (m)
                  </span>
                  <span className="theme-accent text-[10px] font-black italic">
                    UNIT: m³
                  </span>
                </div>
                <div className="relative group">
                  <input
                    type="number"
                    step="0.001"
                    value={depth}
                    onChange={(e) => setDepth(e.target.value)}
                    className="theme-input w-full p-5 rounded-2xl font-black text-xl italic tracking-tighter outline-none focus:ring-2 ring-emerald-500/20 transition-all"
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] theme-meta font-black opacity-40 group-focus-within:opacity-100 uppercase italic transition-opacity">
                    Depth (m)
                  </div>
                </div>
              </div>
            )}

            {/* Conditional Height for Walling */}
            {category === "Walling" && (
              <div className="space-y-2 text-left">
                <div className="flex justify-between items-center px-2">
                  <span className="theme-meta text-[9px] font-bold uppercase tracking-widest">
                    Wall Height (m)
                  </span>
                  <span className="theme-accent text-[10px] font-black italic">
                    UNIT: m²
                  </span>
                </div>
                <div className="relative group">
                  <input
                    type="number"
                    step="0.001"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="theme-input w-full p-5 rounded-2xl font-black text-xl italic tracking-tighter outline-none focus:ring-2 ring-emerald-500/20 transition-all"
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] theme-meta font-black opacity-40 group-focus-within:opacity-100 uppercase italic transition-opacity">
                    Height (m)
                  </div>
                </div>
              </div>
            )}

            {/* Waste Factor */}
            <div className="space-y-2 text-left">
              <span className="theme-meta text-[9px] font-bold uppercase px-2 tracking-widest">
                Wastage Allowance (%)
              </span>
              <div className="relative group">
                <input
                  type="number"
                  value={wasteFactor}
                  onChange={(e) => setWasteFactor(e.target.value)}
                  className="theme-input w-full p-5 rounded-2xl font-black text-xl italic tracking-tighter outline-none focus:ring-2 ring-emerald-500/20 transition-all"
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] theme-meta font-black opacity-40 group-focus-within:opacity-100 uppercase italic transition-opacity">
                  % Factor
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BILLING POLARITY */}
        <div className="space-y-4">
          <label className="theme-meta text-[10px] font-black uppercase tracking-widest ml-1 italic block text-left opacity-70">
            Billing Polarity
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setIsDeductionMode(false)}
              className={`flex-1 flex items-center justify-between px-6 py-5 rounded-2xl border-2 transition-all active:scale-95
                ${
                  !isDeductionMode
                    ? "bg-emerald-500 text-black border-emerald-500 shadow-lg shadow-emerald-500/20"
                    : "theme-card border-transparent opacity-60"
                }`}
            >
              <div className="flex items-center gap-3">
                <PlusCircle size={20} strokeWidth={3} />
                <span className="text-xs font-black uppercase tracking-widest">
                  Addition
                </span>
              </div>
              {!isDeductionMode && (
                <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsDeductionMode(true)}
              className={`flex-1 flex items-center justify-between px-6 py-5 rounded-2xl border-2 transition-all active:scale-95
                ${
                  isDeductionMode
                    ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20"
                    : "theme-card border-transparent opacity-60"
                }`}
            >
              <div className="flex items-center gap-3">
                <MinusCircle size={20} strokeWidth={3} />
                <span className="text-xs font-black uppercase tracking-widest">
                  Deduction
                </span>
              </div>
              {isDeductionMode && (
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* LOGIC TRACE FOOTER */}
        <div className="theme-card p-5 rounded-2xl flex items-start gap-4 opacity-70 border theme-border bg-black/5">
          <div className="mt-0.5 shrink-0">
            <Zap size={14} className="theme-accent" />
          </div>
          <div className="text-left space-y-1">
            <p className="theme-meta text-[9px] font-black uppercase tracking-widest leading-none">
              Logic Trace
            </p>
            <p className="theme-body text-[9px] font-bold uppercase leading-relaxed tracking-tight">
              Measurements are governed by{" "}
              <span className="theme-accent italic">SMM-KE protocol</span> for{" "}
              {category} operations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMMTemplates;
