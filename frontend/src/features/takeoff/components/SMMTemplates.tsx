/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import {
    Box,
    Layers,
    Calculator,
    Info,
    MinusCircle,
    PlusCircle,

    Activity
} from 'lucide-react';

/* ======================================================
    MODULE RESOLUTION HANDLER (SANDBOX COMPATIBILITY)
   ====================================================== */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let useAuth: any = () => ({
    theme: 'dark',
});

const resolveModules = async () => {
    try {
        const authMod = await import("../../../features/auth/AuthContext");
        if (authMod.useAuth) useAuth = authMod.useAuth;
    } catch (e) {
        // Sandbox fallback
    }
};

resolveModules();

/** --- TYPES --- **/

export type SMMSection = 'Concrete' | 'Walling' | 'Finishes';

interface SMMTemplatesProps {
    activeSection: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onParameterChange: (params: any) => void;
    isDeductionMode: boolean;
    setIsDeductionMode: (val: boolean) => void;
}

/** --- MAIN COMPONENT --- **/

const SMMTemplates: React.FC<SMMTemplatesProps> = ({
    activeSection,
    onParameterChange,
    isDeductionMode,
    setIsDeductionMode
}) => {
    const { theme } = useAuth();

    // Internal state for "Invisible Dimensions"
    const [depth, setDepth] = useState("0.150");
    const [height, setHeight] = useState("3.000");
    const [wasteFactor, setWasteFactor] = useState("5");

    // Determine current SMM Category
    const category: SMMSection = activeSection.includes('Concrete')
        ? 'Concrete'
        : activeSection.includes('Walling')
            ? 'Walling'
            : 'Finishes';

    // Sync parameters whenever inputs change
    useEffect(() => {
        onParameterChange({
            depth: parseFloat(depth),
            height: parseFloat(height),
            waste: parseFloat(wasteFactor),
            mode: isDeductionMode ? 'DEDUCTION' : 'ADDITION'
        });
    }, [depth, height, wasteFactor, isDeductionMode, onParameterChange]);

    return (
        <div className={`p-8 rounded-[3rem] border backdrop-blur-3xl transition-all duration-500
      ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-xl'}`}>

            <div className="space-y-8">
                {/* 1. Logic Node Header */}
                <div className="flex justify-between items-start">
                    <div className="text-left space-y-1">
                        <h4 className={`text-xl font-black uppercase italic tracking-tighter leading-none
              ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                            Logic Template
                        </h4>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">
                            SMM-KE Measurement Rules
                        </p>
                    </div>
                    <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-zinc-950 border border-zinc-800' : 'bg-zinc-50 border border-zinc-100'}`}>
                        <Calculator size={18} className="text-amber-500" />
                    </div>
                </div>

                {/* 2. Active Section HUD */}
                <div className={`p-5 rounded-4xl border flex items-center gap-4
          ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800/60' : 'bg-zinc-50 border-zinc-200 shadow-inner'}`}>
                    <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        {category === 'Concrete' ? <Box size={20} /> : category === 'Walling' ? <Layers size={20} /> : <Activity size={20} />}
                    </div>
                    <div className="text-left">
                        <p className="text-[8px] font-black uppercase text-zinc-600 tracking-widest leading-none mb-1">Current Protocol</p>
                        <p className={`text-sm font-black uppercase tracking-tight ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>
                            {activeSection}
                        </p>
                    </div>
                </div>

                {/* 3. Parameter Input Node */}
                <div className="space-y-6">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1 italic block text-left">
                        Structural Parameters
                    </label>

                    <div className="space-y-4">
                        {category === 'Concrete' && (
                            <div className="space-y-2 text-left">
                                <div className="flex justify-between items-center ml-1">
                                    <span className="text-[9px] font-bold uppercase text-zinc-500">Slab/Base Depth (m)</span>
                                    <span className="text-[8px] font-mono text-zinc-700">RESULT: m³</span>
                                </div>
                                <input
                                    type="number"
                                    step="0.001"
                                    value={depth}
                                    onChange={(e) => setDepth(e.target.value)}
                                    className={`w-full p-4 rounded-xl border font-black text-xs outline-none focus:border-amber-500 transition-all
                    ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}
                                />
                            </div>
                        )}

                        {category === 'Walling' && (
                            <div className="space-y-2 text-left">
                                <div className="flex justify-between items-center ml-1">
                                    <span className="text-[9px] font-bold uppercase text-zinc-500">Course Height (m)</span>
                                    <span className="text-[8px] font-mono text-zinc-700">RESULT: m²</span>
                                </div>
                                <input
                                    type="number"
                                    step="0.001"
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value)}
                                    className={`w-full p-4 rounded-xl border font-black text-xs outline-none focus:border-amber-500 transition-all
                    ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}
                                />
                            </div>
                        )}

                        <div className="space-y-2 text-left">
                            <span className="text-[9px] font-bold uppercase text-zinc-500 ml-1">Waste Factor (%)</span>
                            <input
                                type="number"
                                value={wasteFactor}
                                onChange={(e) => setWasteFactor(e.target.value)}
                                className={`w-full p-4 rounded-xl border font-black text-xs outline-none focus:border-amber-500 transition-all
                  ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}
                            />
                        </div>
                    </div>
                </div>

                {/* 4. Arithmetic Mode Handshake (Addition vs Deduction) */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1 italic block text-left">
                        Arithmetic Mode
                    </label>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsDeductionMode(false)}
                            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border transition-all active:scale-95
                ${!isDeductionMode
                                    ? 'bg-emerald-500 text-black border-emerald-500 shadow-lg shadow-emerald-500/20'
                                    : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}
                        >
                            <PlusCircle size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Additive</span>
                        </button>
                        <button
                            onClick={() => setIsDeductionMode(true)}
                            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border transition-all active:scale-95
                ${isDeductionMode
                                    ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20'
                                    : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}
                        >
                            <MinusCircle size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Deductive</span>
                        </button>
                    </div>
                </div>

                {/* 5. Compliance Verification Footer */}
                <div className={`p-4 rounded-2xl border flex items-center gap-3 opacity-60
          ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                    <Info size={14} className="text-zinc-500" />
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 text-left leading-tight">
                        Quantification is governed by Section {category.charAt(0)} of the SMM-KE Standard Protocol.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SMMTemplates;


