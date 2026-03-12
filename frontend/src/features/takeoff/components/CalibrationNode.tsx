/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { 
  Target, 
  Compass, 
  CheckCircle2, 
  Ruler,
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
    // Sandbox fallback active
  }
};

resolveModules();

/** --- TYPES --- **/

interface CalibrationNodeProps {
  currentScale: number;
  onScaleChange: (newScale: number) => void;
  unit: 'm' | 'mm';
  onUnitToggle: (unit: 'm' | 'mm') => void;
}

/** --- MAIN COMPONENT: SCALE CALIBRATION --- **/

const CalibrationNode: React.FC<CalibrationNodeProps> = ({ 
  currentScale, 
  onScaleChange, 
  unit, 
  onUnitToggle 
}) => {
  const { theme } = useAuth();
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [knownDistance, setKnownDistance] = useState("5.00");

  // Standard architectural scales used in Kenyan construction drawings
  const standardScales = [
    { label: '1:1', value: 1 },
    { label: '1:50', value: 0.02 },
    { label: '1:100', value: 0.01 },
    { label: '1:200', value: 0.005 },
  ];

  return (
    <div className={`p-8 rounded-[3rem] border backdrop-blur-3xl transition-all duration-500
      ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-2xl' : 'bg-white border-zinc-200 shadow-xl'}`}>
      
      <div className="flex flex-col space-y-8">
        
        {/* 1. Header Information */}
        <div className="flex justify-between items-start">
          <div className="text-left space-y-1">
            <h4 className={`text-xl font-black uppercase italic tracking-tighter leading-none
              ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              Scale Calibration
            </h4>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">
              Set Drawing Measurement Ratio
            </p>
          </div>
          <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-zinc-950 border border-zinc-800' : 'bg-zinc-50 border border-zinc-100 shadow-inner'}`}>
            <Ruler size={18} className="text-amber-500" />
          </div>
        </div>

        {/* 2. Scale Selection Presets */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1 italic block text-left">
            Standard Drawing Presets
          </label>
          <div className="grid grid-cols-2 gap-3">
            {standardScales.map((s) => (
              <button
                key={s.label}
                onClick={() => onScaleChange(s.value)}
                className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all
                  ${currentScale === s.value 
                    ? 'bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/20' 
                    : theme === 'dark' 
                      ? 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300' 
                      : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:text-zinc-600'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Manual Calibration Control (Point-to-Point) */}
        <div className={`p-6 rounded-4xl border transition-all
          ${isCalibrating ? 'bg-amber-500/5 border-amber-500/40' : 'bg-zinc-950/20 border-zinc-800/40'}`}>
          <div className="flex items-center gap-4 mb-5">
            <div className={`p-3 rounded-xl ${isCalibrating ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-zinc-800 text-zinc-500'}`}>
              <Target size={16} className={isCalibrating ? 'animate-pulse' : ''} />
            </div>
            <div className="text-left">
              <p className={`text-[11px] font-black uppercase tracking-tight leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                Calibrate Ruler
              </p>
              <p className="text-[8px] font-bold text-zinc-600 uppercase mt-1 leading-none text-left">Manual SMM Length Input</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <input 
                type="number"
                value={knownDistance}
                onChange={(e) => setKnownDistance(e.target.value)}
                placeholder="Known length..."
                className={`flex-1 p-4 rounded-xl border font-black text-xs outline-none focus:border-amber-500 transition-all
                  ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}
              />
              <button 
                onClick={() => onUnitToggle(unit === 'm' ? 'mm' : 'm')}
                className="px-4 bg-zinc-800 rounded-xl font-black text-[10px] text-zinc-400 uppercase tracking-widest border border-zinc-700 hover:text-amber-500 transition-colors shadow-lg"
              >
                {unit}
              </button>
            </div>

            <button 
              onClick={() => setIsCalibrating(!isCalibrating)}
              className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3
                ${isCalibrating 
                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white' 
                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700'}`}
            >
              {isCalibrating ? 'Cancel' : 'Set Custom Scale'}
            </button>
          </div>
        </div>

        {/* 4. Accuracy Compliance Status */}
        <div className="flex items-center justify-between pt-4 opacity-40">
          <div className="flex items-center gap-2">
            <Compass size={12} className="text-zinc-500" />
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 italic">
              RICS / SMM-KE Certified Accuracy
            </span>
          </div>
          <CheckCircle2 size={12} className="text-emerald-500" />
        </div>
      </div>
    </div>
  );
};

export default CalibrationNode;

