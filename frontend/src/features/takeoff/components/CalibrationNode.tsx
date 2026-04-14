import React, { useState } from 'react';
import { Target, Compass, CheckCircle2, Ruler, Zap, Info } from 'lucide-react';

interface CalibrationNodeProps {
  currentScale: number;
  onScaleChange: (newScale: number) => void;
  unit: 'm' | 'mm';
  onUnitToggle: (unit: 'm' | 'mm') => void;
}

const CalibrationNode: React.FC<CalibrationNodeProps> = ({ 
  currentScale, 
  onScaleChange, 
  unit, 
  onUnitToggle 
}) => {
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [knownDistance, setKnownDistance] = useState("5.00");

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
    <div className="theme-panel p-8 rounded-[3rem] transition-all duration-500 overflow-hidden shadow-2xl backdrop-blur-3xl">
      <div className="flex flex-col space-y-8">
        <div className="theme-card rounded-[2rem] p-5 text-left">
          <div className="flex items-start gap-3">
            <Info size={16} className="theme-accent mt-0.5 shrink-0" />
            <div>
              <p className="theme-meta text-[10px] font-black uppercase tracking-[0.28em] mb-2">
                Calibration Guide
              </p>
              <p className="theme-body text-sm font-semibold leading-snug">
                Choose a common drawing ratio for speed, or use point-to-point when the sheet has a known dimension you can trust on site.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-start">
          <div className="text-left space-y-1">
            <h4 className="theme-heading text-xl font-black uppercase italic tracking-tighter leading-none">
              Drawing Ratio
            </h4>
            <p className="theme-meta text-[9px] font-black uppercase tracking-[0.3em]">
              Calibration Node • SMM-KE
            </p>
          </div>
          <div className="theme-card p-3 rounded-2xl shadow-inner">
            <Ruler size={18} className="theme-accent" />
          </div>
        </div>

        <div className="space-y-4">
          <label className="theme-meta text-[10px] font-black uppercase tracking-widest ml-1 italic block text-left">
            Standard Preset Ratios
          </label>
          <div className="grid grid-cols-2 gap-3">
            {standardScales.map((s) => (
              <button
                key={s.label}
                onClick={() => onScaleChange(s.value)}
                className={`flex flex-col items-center gap-1 py-4 rounded-2xl transition-all active:scale-95 shadow-inner
                  ${currentScale === s.value 
                    ? 'theme-button-primary' 
                    : 'theme-card hover:theme-border'}`}
              >
                <span className="text-xl font-black uppercase tracking-tighter leading-none">{s.label}</span>
                <span className={`text-[9px] font-bold uppercase tracking-widest opacity-80 ${isSelected ? 'text-black/70' : ''}`}>{s.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

        <div className={`theme-card p-6 rounded-[2.5rem] transition-all relative overflow-hidden
          ${isCalibrating ? 'theme-accent-surface' : ''}`}>
          
          {isCalibrating && (
            <div className="absolute top-0 right-0 p-3">
              <Zap size={12} className="theme-accent animate-pulse" />
            </div>
          )}

          <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 rounded-xl transition-all duration-500 ${isCalibrating ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'theme-panel shadow-inner'}`}>
              <Target size={16} className={isCalibrating ? 'animate-spin-slow' : 'theme-icon'} />
            </div>
            <div className="text-left">
              <p className="theme-heading text-[11px] font-black uppercase tracking-tight leading-none">
                Ruler Calibration
              </p>
              <p className="theme-meta text-[8px] font-bold uppercase mt-1 leading-none text-left">Set known site dimension</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1 group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 theme-meta font-mono text-[10px] group-focus-within:theme-accent transition-colors">LEN</span>
                <input 
                  type="number"
                  value={knownDistance}
                  onChange={(e) => setKnownDistance(e.target.value)}
                  placeholder="0.00"
                  className="theme-input w-full p-4 pl-12 rounded-xl font-black text-xs outline-none transition-all shadow-inner focus:theme-border"
                />
              </div>
              <button 
                onClick={() => onUnitToggle(unit === 'm' ? 'mm' : 'm')}
                className="theme-button-secondary px-5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-90"
              >
                {unit}
              </button>
            </div>
            
            {/* Unit Toggle Button */}
            <button 
              onClick={() => setIsCalibrating(!isCalibrating)}
              className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3 italic
                ${isCalibrating 
                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white' 
                  : 'theme-button-secondary'}`}
            >
              {unit}
            </button>
          </div>

        <div className="theme-panel p-5 rounded-3xl flex items-center justify-between opacity-50 shadow-inner">
          <div className="flex items-center gap-3">
            <Compass size={14} className="theme-icon" />
            <div className="text-left">
              <p className="theme-meta text-[9px] font-black uppercase tracking-widest leading-none">Precision Status</p>
              <p className="theme-body text-[8px] font-bold uppercase tracking-[0.2em] mt-1 italic">SMM-KE Certified Node</p>
            </div>
          </div>
          <CheckCircle2 size={16} className="text-emerald-500/60" />
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
