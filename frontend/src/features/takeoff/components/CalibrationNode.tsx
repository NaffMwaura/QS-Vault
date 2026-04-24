/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { 
  Target, 
  CheckCircle2, 
  Ruler, 
  Zap, 
  Info, 
  MousePointer2,
  RefreshCw,
  Scale,
  ShieldCheck,
  X
} from "lucide-react";

interface CalibrationNodeProps {
  currentScale: number;
  onScaleChange: (newScale: number) => void;
  unit: "m" | "mm";
  onUnitToggle: (unit: "m" | "mm") => void;
  theme?: 'light' | 'dark';
}

/** --- MAIN COMPONENT: DRAWING SCALE & CALIBRATION --- **/

const CalibrationNode: React.FC<CalibrationNodeProps> = ({
  currentScale,
  onScaleChange,
  unit,
  onUnitToggle,
  theme = 'dark'
}) => {
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [knownDistance, setKnownDistance] = useState("5.00");

  // Simplified scale labels for better understanding
  const standardScales = [
    { label: "1:1", value: 1, desc: "Life Size" },
    { label: "1:50", value: 0.02, desc: "Detailed Plan" },
    { label: "1:100", value: 0.01, desc: "Standard Plan" },
    { label: "1:200", value: 0.005, desc: "Large Site Plan" },
  ];

  const handlePresetClick = (val: number) => {
    setIsCalibrating(false);
    onScaleChange(val);
  };

  return (
    <div className={`p-6 sm:p-10 rounded-[3rem] border-2 transition-all duration-500 shadow-2xl backdrop-blur-3xl
      ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
      
      <div className="flex flex-col space-y-10">
        
        {/* 1. NEWBIE GUIDE */}
        <div className={`p-6 rounded-[2.5rem] border-2 shadow-inner
          ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
          <div className="flex items-start gap-5">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
              <Info size={20} strokeWidth={2.5} />
            </div>
            <div className="text-left space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic leading-none">Step 0: Calibration</p>
              <p className={`text-sm font-bold leading-snug ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                To get accurate measurements, we need to know the scale of the drawing. Pick a standard scale below or measure a line you know.
              </p>
            </div>
          </div>
        </div>

        {/* 2. HEADER */}
        <div className="flex justify-between items-center px-2">
          <div className="text-left space-y-2">
            <h4 className={`text-2xl font-black uppercase italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
              Drawing Scale<span className="text-amber-500">.</span>
            </h4>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
              Current: <span className="text-amber-500">1 unit = {currentScale.toFixed(4)} {unit}</span>
            </p>
          </div>
          <div className={`p-4 rounded-2xl border shadow-inner ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-600' : 'bg-zinc-50 border-zinc-100 text-zinc-400'}`}>
            <Ruler size={22} strokeWidth={2.5} />
          </div>
        </div>

        {/* 3. COMMON SCALES GRID */}
        <div className="space-y-5">
          <label className="text-[10px] font-black uppercase tracking-widest ml-4 text-zinc-500 italic block text-left">
            Common Drawing Ratios
          </label>
          <div className="grid grid-cols-2 gap-4">
            {standardScales.map((s) => {
              const isActive = currentScale === s.value && !isCalibrating;
              return (
                <button
                  key={s.label}
                  onClick={() => handlePresetClick(s.value)}
                  className={`flex flex-col items-center gap-2 py-6 rounded-[2rem] transition-all active:scale-95 border-2
                    ${isActive
                        ? "bg-amber-500 border-amber-600 text-black shadow-xl shadow-amber-500/20"
                        : theme === 'dark' ? "bg-zinc-950/40 border-zinc-800 text-zinc-500 hover:border-zinc-700" : "bg-white border-zinc-200 text-zinc-400 hover:border-amber-500"}`}
                >
                  <span className="text-2xl font-black uppercase tracking-tighter leading-none">
                    {s.label}
                  </span>
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${isActive ? "text-black/60" : "text-zinc-600"}`}>
                    {s.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. MANUAL CALIBRATION (SET BY HAND) */}
        <div className={`p-8 rounded-[3rem] transition-all relative overflow-hidden border-2
          ${isCalibrating 
            ? "bg-amber-500/5 border-amber-500 shadow-2xl shadow-amber-500/10" 
            : theme === 'dark' ? "bg-zinc-950/40 border-zinc-800" : "bg-zinc-50 border-zinc-100"}`}>
          
          <div className="flex items-center gap-5 mb-8 text-left">
            <div className={`p-4 rounded-2xl transition-all duration-500 shadow-lg
              ${isCalibrating ? "bg-amber-500 text-black" : "bg-zinc-900 border border-zinc-800 text-zinc-600"}`}>
              <Target size={22} className={isCalibrating ? "animate-pulse" : ""} />
            </div>
            <div className="text-left space-y-1">
              <p className={`text-sm font-black uppercase tracking-tight leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                Set Scale by Hand
              </p>
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                Use a line you already know the length of
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="relative flex-1 group">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-amber-500 font-black text-[10px] italic opacity-40">LEN</span>
                <input
                  type="number"
                  value={knownDistance}
                  onChange={(e) => setKnownDistance(e.target.value)}
                  placeholder="0.00"
                  className={`w-full p-6 pl-16 rounded-2xl font-black text-xl italic tracking-tighter outline-none border-2 transition-all shadow-inner
                    ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-zinc-200 text-zinc-950 focus:border-amber-500'}`}
                />
              </div>
              <button
                onClick={() => onUnitToggle(unit === "m" ? "mm" : "m")}
                className={`px-8 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all active:scale-95 shadow-lg
                  ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-amber-500 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600'}`}
              >
                {unit}
              </button>
            </div>

            <button
              onClick={() => setIsCalibrating(!isCalibrating)}
              className={`w-full py-6 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-4 italic shadow-2xl active:scale-95
                ${isCalibrating
                    ? "bg-rose-500 border-rose-600 text-white shadow-rose-500/20"
                    : "bg-amber-500 border-amber-600 text-black hover:bg-amber-400 shadow-amber-500/20"}`}
            >
              {isCalibrating ? <X size={18} strokeWidth={3} /> : <MousePointer2 size={18} strokeWidth={3} />}
              {isCalibrating ? "Cancel Calibration" : "Pick Two Points on Map"}
            </button>
            
            {isCalibrating && (
              <p className="text-[9px] font-black uppercase text-amber-500 animate-pulse tracking-widest text-center mt-4">
                System is waiting for you to click on the drawing...
              </p>
            )}
          </div>
        </div>

        {/* 5. FOOTER STATUS */}
        <div className={`flex items-center justify-between pt-8 border-t-2 opacity-60 ${theme === 'dark' ? 'border-zinc-800/40' : 'border-zinc-100'}`}>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 leading-none">Accuracy Status</p>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 text-emerald-500">
               <ShieldCheck size={16} />
               <span className="text-[10px] font-black uppercase tracking-widest italic">Precision Active</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalibrationNode;