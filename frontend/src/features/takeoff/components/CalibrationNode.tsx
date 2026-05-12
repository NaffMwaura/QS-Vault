import React, { useState } from "react";
import { 
  Target, 
  Ruler, 
  Info, 
  MousePointer2,
  ShieldCheck,
  X,
  Zap
} from "lucide-react";

interface CalibrationNodeProps {
  currentScale: number;
  onScaleChange: (newScale: number) => void;
  unit: "m" | "mm";
  onUnitToggle: (unit: "m" | "mm") => void;
  theme?: 'light' | 'dark';
}

/** --- MAIN COMPONENT: THE PRECISION ENGINE --- **/
const CalibrationNode: React.FC<CalibrationNodeProps> = ({
  currentScale,
  onScaleChange,
  unit,
  onUnitToggle,
  theme = 'dark'
}) => {
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [knownDistance, setKnownDistance] = useState("5.00");

  // Standard Industry Ratios
  const standardScales = [
    { label: "1:50", value: 0.02, desc: "Detail Level" },
    { label: "1:100", value: 0.01, desc: "Standard Plan" },
    { label: "1:200", value: 0.005, desc: "Site Layout" },
    { label: "1:500", value: 0.002, desc: "Master Plan" },
  ];

  const handlePresetClick = (val: number) => {
    setIsCalibrating(false);
    onScaleChange(val);
  };

  return (
    <div className={`p-8 sm:p-10 rounded-[3rem] border-2 transition-all duration-500 shadow-2xl backdrop-blur-xl w-full
      ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200'}`}>
      
      <div className="flex flex-col space-y-10">
        
        {/* 1. ONBOARDING GUIDE */}
        <div className={`p-6 rounded-[2.5rem] border-2 shadow-inner
          ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
          <div className="flex items-start gap-4 text-left">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
              <Info size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic mb-1">System Calibration</p>
              <p className={`text-xs font-bold leading-relaxed ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                To calculate real volumes and areas, we must define the blueprint scale. Pick a preset or calibrate by hand.
              </p>
            </div>
          </div>
        </div>

        {/* 2. CURRENT STATUS HUD */}
        <div className="flex justify-between items-center px-2">
          <div className="text-left space-y-1">
            <h4 className={`text-2xl font-black uppercase italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
              Map Scale<span className="text-amber-500">.</span>
            </h4>
            <div className="flex items-center gap-2">
               <Zap size={12} className="text-amber-500 animate-pulse" />
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                 Ratio: <span className="text-amber-500">1px = {currentScale.toFixed(4)}{unit}</span>
               </p>
            </div>
          </div>
          <div className={`p-4 rounded-2xl border shadow-inner ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-600' : 'bg-zinc-50 border-zinc-100 text-zinc-400'}`}>
            <Ruler size={22} strokeWidth={2.5} />
          </div>
        </div>

        {/* 3. PRESET SELECTOR */}
        <div className="space-y-5">
          <label className="text-[10px] font-black uppercase tracking-[0.3em] ml-4 text-zinc-600 italic block text-left">
            Standard Presets
          </label>
          <div className="grid grid-cols-2 gap-4">
            {standardScales.map((s) => {
              const isActive = Math.abs(currentScale - s.value) < 0.0001 && !isCalibrating;
              return (
                <button
                  key={s.label}
                  onClick={() => handlePresetClick(s.value)}
                  className={`flex flex-col items-center gap-1 py-6 rounded-4xl transition-all active:scale-95 border-2
                    ${isActive
                        ? "bg-amber-500 border-amber-600 text-black shadow-xl shadow-amber-500/20"
                        : theme === 'dark' ? "bg-zinc-950/40 border-zinc-800 text-zinc-500 hover:border-zinc-700" : "bg-white border-zinc-200 text-zinc-400"}`}
                >
                  <span className="text-2xl font-black uppercase tracking-tighter leading-none">
                    {s.label}
                  </span>
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? "text-black/60" : "text-zinc-700"}`}>
                    {s.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. MANUAL CALIBRATION (BY HAND) */}
        <div className={`p-8 rounded-[3rem] transition-all relative overflow-hidden border-2
          ${isCalibrating 
            ? "bg-amber-500/5 border-amber-500 shadow-2xl" 
            : theme === 'dark' ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-100"}`}>
          
          <div className="flex items-center gap-4 mb-8 text-left">
            <div className={`p-4 rounded-2xl transition-all duration-500 shadow-lg
              ${isCalibrating ? "bg-amber-500 text-black" : "bg-zinc-900 border border-zinc-800 text-zinc-600"}`}>
              <Target size={20} className={isCalibrating ? "animate-pulse" : ""} />
            </div>
            <div>
              <p className={`text-sm font-black uppercase tracking-tight leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                Calibrate by Hand
              </p>
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mt-1">
                Define a line with known length
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-amber-500 font-black text-[9px] italic opacity-50">VALUE</span>
                <input
                  type="number"
                  value={knownDistance}
                  onChange={(e) => setKnownDistance(e.target.value)}
                  className={`w-full p-6 pl-16 rounded-2xl font-black text-xl italic tracking-tighter outline-none border-2 transition-all
                    ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200 text-zinc-950'}`}
                />
              </div>
              <button
                onClick={() => onUnitToggle(unit === "m" ? "mm" : "m")}
                className={`px-8 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all active:scale-90
                  ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-amber-500 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600'}`}
              >
                {unit}
              </button>
            </div>

            <button
              onClick={() => setIsCalibrating(!isCalibrating)}
              className={`w-full py-6 rounded-4xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 italic active:scale-95 shadow-2xl
                ${isCalibrating
                    ? "bg-rose-600 border-rose-700 text-white"
                    : "bg-amber-500 border-amber-600 text-black hover:bg-amber-400"}`}
            >
              {isCalibrating ? <X size={18} strokeWidth={3} /> : <MousePointer2 size={18} strokeWidth={3} />}
              {isCalibrating ? "Cancel Setup" : "Measure Reference Line"}
            </button>
            
            {isCalibrating && (
              <div className="flex flex-col items-center gap-3 mt-4">
                 <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                 <p className="text-[9px] font-black uppercase text-amber-500 tracking-widest text-center">
                   Awaiting blueprint interaction...
                 </p>
              </div>
            )}
          </div>
        </div>

        {/* 5. ACCURACY FOOTER */}
        <div className={`flex items-center justify-between pt-8 border-t-2 ${theme === 'dark' ? 'border-zinc-900' : 'border-zinc-100'}`}>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 leading-none">Security Status</p>
          <div className="flex items-center gap-2 text-emerald-500">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest italic">Node Synchronized</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalibrationNode;
