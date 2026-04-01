/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { 
  Target, 
  Compass, 
  CheckCircle2, 
  Ruler,
  Zap,
} from 'lucide-react';
import { useAuth } from "../../auth/AuthContext";

/** --- TYPES --- **/

interface CalibrationNodeProps {
  currentScale: number;
  onScaleChange: (newScale: number) => void;
  unit: 'm' | 'mm';
  onUnitToggle: (unit: 'm' | 'mm') => void;
}

/** --- MAIN COMPONENT: PRECISION CALIBRATOR --- **/

const CalibrationNode: React.FC<CalibrationNodeProps> = ({ 
  currentScale, 
  onScaleChange, 
  unit, 
  onUnitToggle 
}) => {
  const { theme } = useAuth();
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [knownDistance, setKnownDistance] = useState("5.00");

  /** * STANDARD ARCHITECTURAL SCALES
   * These are the standard ratios found on most Kenyan site drawings.
   */
  const standardScales = [
    { label: '1:1', value: 1, desc: 'Real Size' },
    { label: '1:50', value: 0.02, desc: 'Structural' },
    { label: '1:100', value: 0.01, desc: 'Architectural' },
    { label: '1:200', value: 0.005, desc: 'Site Plan' },
  ];

  return (
    <div className={`p-8 rounded-[3rem] border backdrop-blur-3xl transition-all duration-500 overflow-hidden
      ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-2xl' : 'bg-white border-zinc-200 shadow-xl'}`}>
      
      <div className="flex flex-col space-y-8">
        
        {/* 1. Header Information */}
        <div className="flex justify-between items-start">
          <div className="text-left space-y-1">
            <h4 className={`text-xl font-black uppercase italic tracking-tighter leading-none
              ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              Drawing Ratio
            </h4>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">
              Calibration Node • SMM-KE
            </p>
          </div>
          <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-zinc-950 border border-zinc-800' : 'bg-zinc-50 border border-zinc-100 shadow-inner'}`}>
            <Ruler size={18} className="text-amber-500" />
          </div>
        </div>

        {/* 2. Scale Selection Presets */}
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1 italic block text-left">
            Standard Preset Ratios
          </label>
          <div className="grid grid-cols-2 gap-3">
            {standardScales.map((s) => (
              <button
                key={s.label}
                onClick={() => onScaleChange(s.value)}
                className={`flex flex-col items-center gap-1 py-4 rounded-2xl border transition-all active:scale-95
                  ${currentScale === s.value 
                    ? 'bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/20' 
                    : theme === 'dark' 
                      ? 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300' 
                      : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:text-zinc-600'}`}
              >
                <span className="text-[11px] font-black uppercase tracking-widest leading-none">{s.label}</span>
                <span className={`text-[7px] font-bold uppercase opacity-60 ${currentScale === s.value ? 'text-black' : ''}`}>{s.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Manual Calibration Control (Point-to-Point) */}
        <div className={`p-6 rounded-[2.5rem] border transition-all relative overflow-hidden
          ${isCalibrating ? 'bg-amber-500/5 border-amber-500/40' : 'bg-zinc-950/20 border-zinc-800/40'}`}>
          
          {isCalibrating && (
            <div className="absolute top-0 right-0 p-3">
              <Zap size={12} className="text-amber-500 animate-pulse" />
            </div>
          )}

          <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 rounded-xl transition-all duration-500 ${isCalibrating ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'bg-zinc-800 text-zinc-600 shadow-inner'}`}>
              <Target size={16} className={isCalibrating ? 'animate-spin-slow' : ''} />
            </div>
            <div className="text-left">
              <p className={`text-[11px] font-black uppercase tracking-tight leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                Ruler Calibration
              </p>
              <p className="text-[8px] font-bold text-zinc-600 uppercase mt-1 leading-none text-left">Set known site dimension</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1 group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 font-mono text-[10px] group-focus-within:text-amber-500 transition-colors">LEN</span>
                <input 
                  type="number"
                  value={knownDistance}
                  onChange={(e) => setKnownDistance(e.target.value)}
                  placeholder="0.00"
                  className={`w-full p-4 pl-12 rounded-xl border font-black text-xs outline-none transition-all shadow-inner
                    ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200 text-zinc-900 focus:border-amber-500'}`}
                />
              </div>
              <button 
                onClick={() => onUnitToggle(unit === 'm' ? 'mm' : 'm')}
                className={`px-5 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all active:scale-90
                  ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-amber-500' : 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:text-amber-600 shadow-sm'}`}
              >
                {unit}
              </button>
            </div>

            <button 
              onClick={() => setIsCalibrating(!isCalibrating)}
              className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3 italic
                ${isCalibrating 
                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white' 
                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700'}`}
            >
              {isCalibrating ? 'Cancel Sync' : 'Start Point-to-Point'}
            </button>
          </div>
        </div>

        {/* 4. Accuracy Compliance Status */}
        <div className={`p-5 rounded-3xl border flex items-center justify-between opacity-50
          ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
          <div className="flex items-center gap-3">
            <Compass size={14} className="text-zinc-500" />
            <div className="text-left">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 leading-none">Precision Status</p>
              <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-[0.2em] mt-1 italic">SMM-KE Certified Node</p>
            </div>
          </div>
          <CheckCircle2 size={16} className="text-emerald-500/60" />
        </div>
      </div>

      <style>{`
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CalibrationNode;
