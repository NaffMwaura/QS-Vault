import React, { useState } from 'react';
import { 
  Target, 
  CheckCircle2, 
  Ruler,
  Zap,
  Info,
  Settings2,
  X
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

  /** * STANDARD ARCHITECTURAL SCALES */
  const standardScales = [
    { label: '1:1', value: 1, desc: 'Real Size' },
    { label: '1:50', value: 0.02, desc: 'Structural' },
    { label: '1:100', value: 0.01, desc: 'Architectural' },
    { label: '1:200', value: 0.005, desc: 'Site Plan' },
  ];

  // Automatically deselect custom mode if a preset is clicked
  const handlePresetClick = (val: number) => {
    setIsCalibrating(false);
    onScaleChange(val);
  };

  return (
    <div className="w-full h-full flex flex-col justify-between space-y-10 animate-in fade-in duration-500">
      
      {/* 1. GUIDANCE HEADER */}
      <div className={`p-6 rounded-3xl] border transition-colors duration-500
        ${theme === 'dark' ? 'bg-zinc-950/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200 shadow-sm'}`}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 shrink-0">
             <Info size={20} strokeWidth={2.5} />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-1.5 italic">
              Scale Configuration
            </p>
            <p className={`text-sm font-bold leading-snug ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
              Select a standard drawing ratio, or measure a known line on the blueprint to set a custom scale.
            </p>
          </div>
        </div>
      </div>
      
      {/* 2. STANDARD SCALES GRID */}
      <div className="space-y-5">
        <div className="flex items-center gap-3">
           <Ruler size={16} className="text-zinc-500" />
           <label className={`text-[11px] font-black uppercase tracking-widest italic leading-none
              ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
             Standard Preset Ratios
           </label>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {standardScales.map((s) => {
            // MAGIC FIX: If we are actively calibrating manually, remove the yellow highlight from presets
            const isSelected = currentScale === s.value && !isCalibrating;
            
            return (
              <button
                key={s.label}
                onClick={() => handlePresetClick(s.value)}
                className={`flex flex-col items-center justify-center gap-2 h-24 rounded-3xl border-2 transition-all active:scale-95
                  ${isSelected 
                    ? 'bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20' 
                    : theme === 'dark' 
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white' 
                      : 'bg-white border-zinc-200 text-zinc-500 hover:border-amber-500/50 hover:text-zinc-900 shadow-sm'}`}
              >
                <span className="text-xl font-black uppercase tracking-tighter leading-none">{s.label}</span>
                <span className={`text-[9px] font-bold uppercase tracking-widest opacity-80 ${isSelected ? 'text-black/70' : ''}`}>{s.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. CUSTOM MANUAL CALIBRATION */}
      <div className="space-y-5 pt-4 border-t border-zinc-800/30">
        <div className="flex items-center gap-3">
           <Settings2 size={16} className="text-zinc-500" />
           <label className={`text-[11px] font-black uppercase tracking-widest italic leading-none
              ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
             Custom Length Calibration
           </label>
        </div>

        <div className={`p-6 rounded-4xl] border-2 transition-all relative overflow-hidden flex flex-col gap-5
          ${isCalibrating 
            ? 'bg-amber-500/5 border-amber-500/50' 
            : theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
          
          {isCalibrating && (
            <div className="absolute top-0 right-0 p-4">
              <Zap size={16} className="text-amber-500 animate-pulse" />
            </div>
          )}

          <div className="flex gap-3 h-16">
            <div className="relative flex-1 group h-full">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 font-black text-[10px] uppercase tracking-widest group-focus-within:text-amber-500 transition-colors">
                Length
              </span>
              <input 
                type="number"
                value={knownDistance}
                onChange={(e) => setKnownDistance(e.target.value)}
                placeholder="0.00"
                className={`w-full h-full pl-24 pr-6 rounded-2xl border-2 font-black text-lg outline-none transition-all shadow-inner
                  ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-amber-500'}`}
              />
            </div>
            
            {/* Unit Toggle Button */}
            <button 
              onClick={() => onUnitToggle(unit === 'm' ? 'mm' : 'm')}
              className={`w-20 h-full rounded-2xl font-black text-sm uppercase tracking-widest border-2 transition-all active:scale-90
                ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-amber-500 hover:text-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-amber-500 hover:text-amber-600 shadow-sm'}`}
            >
              {unit}
            </button>
          </div>

          <button 
            onClick={() => setIsCalibrating(!isCalibrating)}
            className={`w-full h-16 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-4 italic active:scale-95
              ${isCalibrating 
                ? 'bg-rose-500/10 text-rose-500 border-2 border-rose-500/20 hover:bg-rose-500 hover:text-white' 
                : 'bg-zinc-800 text-zinc-300 border-2 border-zinc-700 hover:bg-zinc-700 hover:text-white'}`}
          >
            {isCalibrating ? <><X size={18} strokeWidth={3} /> Cancel Measurement</> : <><Target size={18} strokeWidth={3} /> Measure Known Line</>}
          </button>
        </div>
      </div>

      {/* 4. COMPLIANCE FOOTER */}
      <div className="flex items-center justify-between pt-6 border-t border-zinc-800/30 opacity-60">
         <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 leading-none">
           Accuracy Status
         </p>
         <div className="flex items-center gap-2 text-emerald-500">
            <CheckCircle2 size={14} />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] italic leading-none">SMM-KE Compliant</span>
         </div>
      </div>

    </div>
  );
};

export default CalibrationNode;
