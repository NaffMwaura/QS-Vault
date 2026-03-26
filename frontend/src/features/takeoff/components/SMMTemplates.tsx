/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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

/* ======================================================
    OFFICE MODULE RESOLUTION (PRO-DEV SETUP)
   ====================================================== */

let useAuth: any = () => ({
  theme: 'dark',
});

const resolveModules = async () => {
  try {
    const authMod = await import("../../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;
  } catch (e) {
    // Sandbox shims active for workspace initialization
  }
};

resolveModules();

/** --- TYPES --- **/

export type SMMSection = 'Concrete' | 'Walling' | 'Finishes';

interface SMMTemplatesProps {
  activeSection: string;
  onParameterChange: (params: any) => void;
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

  /** * VERTICAL PARAMETERS
   * These states handle dimensions not visible on a 2D drawing (The Z-Axis).
   * Default values are set to regional standards (e.g., 150mm slab).
   */
  const [depth, setDepth] = useState("0.150");
  const [height, setHeight] = useState("3.000");
  const [wasteFactor, setWasteFactor] = useState("5");

  /** * CATEGORY HANDSHAKE
   * Automatically maps the UI to the correct SMM-KE work section rules.
   */
  const category: SMMSection = activeSection.includes('Concrete') 
    ? 'Concrete' 
    : activeSection.includes('Walling') 
      ? 'Walling' 
      : 'Finishes';

  /** * CALCULATION SYNC
   * Pushes manual parameters back to the main Takeoff Engine for quantity processing.
   */
  useEffect(() => {
    onParameterChange({
      depth: parseFloat(depth) || 0,
      height: parseFloat(height) || 0,
      waste: parseFloat(wasteFactor) || 0,
      mode: isDeductionMode ? 'DEDUCTION' : 'ADDITION'
    });
  }, [depth, height, wasteFactor, isDeductionMode, onParameterChange]);

  return (
    <div className={`p-8 rounded-[3rem] border backdrop-blur-3xl transition-all duration-500 overflow-hidden
      ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-2xl shadow-black' : 'bg-white border-zinc-200 shadow-xl'}`}>
      
      <div className="space-y-8">
        {/* 1. MODULE HEADER */}
        <div className="flex justify-between items-start">
          <div className="text-left space-y-1">
            <h4 className={`text-xl font-black uppercase italic tracking-tighter leading-none
              ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              Measurement Rules
            </h4>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">
              SMM-KE Standard Templates
            </p>
          </div>
          <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-zinc-950 border border-zinc-800 shadow-inner' : 'bg-zinc-50 border border-zinc-100 shadow-inner'}`}>
            <Calculator size={18} className="text-amber-500" />
          </div>
        </div>

        {/* 2. ACTIVE SECTION IDENTITY */}
        <div className={`p-5 rounded-4xl border flex items-center gap-5 transition-all duration-500
          ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
          <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-lg">
            {category === 'Concrete' ? <Box size={20} /> : category === 'Walling' ? <Layers size={20} /> : <Activity size={20} />}
          </div>
          <div className="text-left">
            <p className="text-[8px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-1.5 leading-none">Contextual Ruleset</p>
            <p className={`text-sm font-black uppercase tracking-tight leading-none ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>
              {activeSection} Works
            </p>
          </div>
        </div>

        {/* 3. DYNAMIC PARAMETER INPUTS */}
        <div className="space-y-6">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1 italic block text-left">
            Vertical Specifications
          </label>

          <div className="space-y-5">
            {category === 'Concrete' && (
              <div className="space-y-3 text-left">
                <div className="flex justify-between items-center ml-2">
                  <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-widest">Slab / Footing Depth (m)</span>
                  <span className="text-[8px] font-mono text-amber-500/40 uppercase font-black">Result: m³</span>
                </div>
                <div className="relative group">
                  <input 
                    type="number" step="0.001" value={depth}
                    onChange={(e) => setDepth(e.target.value)}
                    className={`w-full p-5 rounded-2xl border font-black text-xl italic tracking-tighter outline-none focus:border-amber-500 transition-all shadow-inner
                      ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`} 
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-600 group-focus-within:text-amber-500 transition-colors uppercase italic">Depth</div>
                </div>
              </div>
            )}

            {category === 'Walling' && (
              <div className="space-y-3 text-left">
                <div className="flex justify-between items-center ml-2">
                  <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-widest">Wall Height (m)</span>
                  <span className="text-[8px] font-mono text-amber-500/40 uppercase font-black">Result: m²</span>
                </div>
                <div className="relative group">
                  <input 
                    type="number" step="0.001" value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className={`w-full p-5 rounded-2xl border font-black text-xl italic tracking-tighter outline-none focus:border-amber-500 transition-all shadow-inner
                      ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`} 
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-600 group-focus-within:text-amber-500 transition-colors uppercase italic">Height</div>
                </div>
              </div>
            )}

            <div className="space-y-3 text-left">
              <span className="text-[9px] font-bold uppercase text-zinc-500 ml-2 tracking-widest">Wastage Allowance (%)</span>
              <div className="relative group">
                <input 
                  type="number" value={wasteFactor}
                  onChange={(e) => setWasteFactor(e.target.value)}
                  className={`w-full p-5 rounded-2xl border font-black text-xl italic tracking-tighter outline-none focus:border-amber-500 transition-all shadow-inner
                    ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`} 
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-600 group-focus-within:text-amber-500 transition-colors uppercase italic">% Factor</div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. CALCULATION POLARITY (Addition vs Deduction) */}
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1 italic block text-left">
            Billing Polarity
          </label>
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={() => setIsDeductionMode(false)}
              className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl border transition-all active:scale-95 shadow-lg
                ${!isDeductionMode 
                  ? 'bg-emerald-500 text-black border-emerald-500 shadow-emerald-500/20' 
                  : 'bg-zinc-950/40 border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}
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
                  : 'bg-zinc-950/40 border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}
            >
              <MinusCircle size={14} className={isDeductionMode ? 'fill-current' : ''} />
              <span className="text-[10px] font-black uppercase tracking-widest">Deduction</span>
            </button>
          </div>
        </div>

        {/* 5. AUDIT & COMPLIANCE FOOTER */}
        <div className={`p-5 rounded-2xl border flex items-start gap-4 opacity-60
          ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100 shadow-inner'}`}>
          <div className="mt-0.5"><Zap size={14} className="text-amber-500" /></div>
          <div className="text-left space-y-1">
             <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 leading-none">Logic Trace</p>
             <p className="text-[8px] font-bold text-zinc-600 uppercase leading-relaxed tracking-tight">
               Measurements are governed by the <span className="text-amber-500/80 italic">SMM-KE Standard Protocol</span> for {category} operations.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMMTemplates;

