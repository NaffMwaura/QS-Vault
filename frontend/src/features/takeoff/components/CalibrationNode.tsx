import React, { useState } from "react";
import { Target, CheckCircle2, Ruler, Zap, Info } from "lucide-react";

interface CalibrationNodeProps {
  currentScale: number;
  onScaleChange: (newScale: number) => void;
  unit: "m" | "mm";
  onUnitToggle: (unit: "m" | "mm") => void;
}

const CalibrationNode: React.FC<CalibrationNodeProps> = ({
  currentScale,
  onScaleChange,
  unit,
  onUnitToggle,
}) => {
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [knownDistance, setKnownDistance] = useState("5.00");

  const standardScales = [
    { label: "1:1", value: 1, desc: "Real Size" },
    { label: "1:50", value: 0.02, desc: "Structural" },
    { label: "1:100", value: 0.01, desc: "Architectural" },
    { label: "1:200", value: 0.005, desc: "Site Plan" },
  ];

  const handlePresetClick = (val: number) => {
    setIsCalibrating(false);
    onScaleChange(val);
  };

  return (
    <div className="theme-panel p-6 sm:p-8 rounded-[3rem] transition-all duration-500 shadow-2xl backdrop-blur-3xl border theme-border">
      <div className="flex flex-col space-y-8">
        {/* 1. CALIBRATION GUIDE */}
        <div className="theme-card rounded-[2rem] p-5 text-left border theme-border shadow-inner">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-xl bg-emerald-500/10 shrink-0">
              <Info size={16} className="text-emerald-500" />
            </div>
            <div>
              <p className="theme-meta text-[10px] font-black uppercase tracking-[0.28em] mb-1 opacity-70">
                Calibration Guide
              </p>
              <p className="theme-body text-xs font-semibold leading-relaxed">
                Choose a common drawing ratio for speed, or use point-to-point
                when the sheet has a known dimension you can trust on site.
              </p>
            </div>
          </div>
        </div>

        {/* 2. HEADER */}
        <div className="flex justify-between items-start">
          <div className="text-left space-y-1">
            <h4 className="theme-heading text-xl font-black uppercase italic tracking-tighter leading-none">
              Drawing Ratio<span className="theme-accent">.</span>
            </h4>
            <p className="theme-meta text-[9px] font-black uppercase tracking-[0.3em] opacity-60">
              Calibration Node • SMM-KE
            </p>
          </div>
          <div className="theme-card p-3 rounded-2xl shadow-inner border theme-border">
            <Ruler size={18} className="theme-accent" />
          </div>
        </div>

        {/* 3. PRESET GRID */}
        <div className="space-y-4">
          <label className="theme-meta text-[10px] font-black uppercase tracking-widest ml-1 italic block text-left opacity-70">
            Standard Preset Ratios
          </label>
          <div className="grid grid-cols-2 gap-3">
            {standardScales.map((s) => {
              const isActive = currentScale === s.value && !isCalibrating;
              return (
                <button
                  key={s.label}
                  onClick={() => handlePresetClick(s.value)}
                  className={`flex flex-col items-center gap-1 py-4 rounded-2xl transition-all active:scale-95 border-2
                    ${
                      isActive
                        ? "bg-emerald-500 border-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                        : "theme-card border-transparent hover:theme-border"
                    }`}
                >
                  <span className="text-xl font-black uppercase tracking-tighter leading-none">
                    {s.label}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-widest opacity-60 ${isActive ? "text-black/70" : ""}`}
                  >
                    {s.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. CUSTOM CALIBRATION CARD */}
        <div
          className={`theme-card p-6 rounded-[2.5rem] transition-all relative overflow-hidden border-2
          ${isCalibrating ? "border-amber-500/50 bg-amber-500/5" : "border-transparent"}`}
        >
          {isCalibrating && (
            <div className="absolute top-0 right-0 p-4">
              <Zap size={14} className="text-amber-500 animate-pulse" />
            </div>
          )}

          <div className="flex items-center gap-4 mb-6">
            <div
              className={`p-3 rounded-xl transition-all duration-500 
              ${isCalibrating ? "bg-amber-500 text-black shadow-lg" : "theme-panel border theme-border"}`}
            >
              <Target
                size={18}
                className={isCalibrating ? "animate-spin-slow" : "theme-icon"}
              />
            </div>
            <div className="text-left">
              <p className="theme-heading text-xs font-black uppercase tracking-tight leading-none">
                Manual Calibration
              </p>
              <p className="theme-meta text-[8px] font-bold uppercase mt-1.5 opacity-60">
                Set custom site dimension
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1 group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 theme-meta font-mono text-[9px] group-focus-within:theme-accent transition-colors">
                  VAL
                </span>
                <input
                  type="number"
                  value={knownDistance}
                  onChange={(e) => setKnownDistance(e.target.value)}
                  placeholder="0.00"
                  className="theme-input w-full p-4 pl-12 rounded-xl font-black text-sm outline-none transition-all shadow-inner focus:theme-border"
                />
              </div>
              <button
                onClick={() => onUnitToggle(unit === "m" ? "mm" : "m")}
                className="theme-button-secondary px-5 rounded-xl font-black text-[10px] uppercase tracking-widest border theme-border"
              >
                {unit}
              </button>
            </div>

            <button
              onClick={() => setIsCalibrating(!isCalibrating)}
              className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3 italic
                ${
                  isCalibrating
                    ? "bg-rose-500 text-white shadow-lg"
                    : "theme-button-secondary border theme-border"
                }`}
            >
              {isCalibrating ? "Cancel Calibration" : "Pick Points on Map"}
            </button>
          </div>
        </div>

        {/* 5. FOOTER STATUS */}
        <div className="flex items-center justify-between pt-6 border-t theme-border opacity-60">
          <p className="theme-meta text-[9px] font-black uppercase tracking-widest">
            Accuracy Status
          </p>
          <div className="flex items-center gap-2 text-emerald-500">
            <CheckCircle2 size={14} />
            <span className="text-[9px] font-bold uppercase tracking-widest italic leading-none">
              SMM-KE Compliant
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalibrationNode;
