/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useMemo } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import {
  ClipboardList,
  Ruler,
  Settings2,
  Maximize2,
  Minimize2,
  RefreshCw,
  Layers,
  Target,
  Database,
  ShieldCheck,
  MousePointer2,
  Loader2
} from "lucide-react";

/* ======================================================
    OFFICE MODULE RESOLUTION (STABILIZED)
   ====================================================== */

let useAuth: any = () => ({ theme: 'dark', user: null });
let db: any = null;
let syncEngine: any = null;

const resolveModules = async () => {
  try {
    const authMod = await import("../../../auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const dbMod = await import("../../../../lib/database/database");
    if (dbMod.db) db = dbMod.db;
    if (dbMod.syncEngine) syncEngine = dbMod.syncEngine;
  } catch (e) {
    console.warn("Takeoff Engine: Infrastructure standby.");
  }
};

resolveModules();

/** --- TYPES --- **/

import BlueprintViewport from "../BlueprintViewport";
import CalibrationNode from "../CalibrationNode";
import TakeoffLedger from "../TakeoffLedger";
import SMMTemplates from "../SMMTemplates";
import SMMWorkSections from "../SMMWorkSections";
import type {
  Measurement,
  MeasurementTool,
  Point,
  SmmParams,
} from "../../types/takeoff";

interface TakeoffWorkspaceProps {
  projectId: string; // CRITICAL: Used to prevent data leakage
  projectName: string;
  pdfDoc: PDFDocumentProxy | null;
  setPdfDoc: React.Dispatch<React.SetStateAction<PDFDocumentProxy | null>>;
  scale: number;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  scaleFactor: number;
  setScaleFactor: React.Dispatch<React.SetStateAction<number>>;
  unit: "m" | "mm";
  setUnit: React.Dispatch<React.SetStateAction<"m" | "mm">>;
  activeSection: string;
  setActiveSection: React.Dispatch<React.SetStateAction<string>>;
  activeTool: MeasurementTool;
  setActiveTool: React.Dispatch<React.SetStateAction<MeasurementTool>>;
  isMeasuring: boolean;
  setIsMeasuring: React.Dispatch<React.SetStateAction<boolean>>;
  isDeductionMode: boolean;
  setIsDeductionMode: React.Dispatch<React.SetStateAction<boolean>>;
  currentPoints: Point[];
  setCurrentPoints: React.Dispatch<React.SetStateAction<Point[]>>;
  measurements: Measurement[];
  smmParams: SmmParams;
  setSmmParams: React.Dispatch<React.SetStateAction<SmmParams>>;
  leftOpen: boolean;
  setLeftOpen: React.Dispatch<React.SetStateAction<boolean>>;
  rightOpen: boolean;
  setRightOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onCanvasClick: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onDeleteMeasurement: (id: string) => void;
}

/** --- UI: WORKSPACE SUMMARY (Simplified Language) --- **/

const WorkspaceSummaryCard = ({
  activeSection,
  activeTool,
  measurementCount,
  theme
}: {
  activeSection: string;
  activeTool: MeasurementTool;
  measurementCount: number;
  theme: "light" | "dark";
}) => (
  <div className={`rounded-[2.5rem] border p-8 sm:p-10 shadow-2xl relative overflow-hidden transition-all duration-500 hover:border-amber-500/30
    ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
    <div className="absolute top-0 right-0 p-8 opacity-5">
       <Ruler size={80} className="text-amber-500" />
    </div>
    <div className="flex items-start gap-6 relative z-10">
      <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-500 shadow-inner">
        <MousePointer2 size={24} strokeWidth={2.5} />
      </div>
      <div className="text-left space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 italic leading-none">Ready for Takeoff</p>
        <p className={`text-base sm:text-xl font-bold leading-snug ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>
          Click on the drawing to start measuring. Your work is automatically saved and sorted into the correct project vault.
        </p>
      </div>
    </div>
    <div className="mt-8 flex flex-wrap gap-4 relative z-10">
      <div className={`px-6 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-colors
        ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600'}`}>
        <Layers size={14} className="text-amber-500" /> Current Section: <span className={`${theme === 'dark' ? 'text-white' : 'text-zinc-900'} italic ml-1`}>{activeSection}</span>
      </div>
      <div className={`px-6 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-colors
        ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600'}`}>
        <Target size={14} className="text-blue-500" /> Tool: <span className={`${theme === 'dark' ? 'text-white' : 'text-zinc-900'} italic ml-1`}>{activeTool}</span>
      </div>
    </div>
  </div>
);

/** --- MAIN WORKSPACE ENGINE --- **/

const TakeoffWorkspace = (props: TakeoffWorkspaceProps) => {
  const { theme, user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  
  // Instant Session Memory
  const [sessionMeasurements, setSessionMeasurements] = useState<Measurement[]>([]);

  // Filter props.measurements strictly by the active projectId to prevent data leakage
  const projectSpecificMeasurements = useMemo(() => {
    return props.measurements.filter(m => m.project_id === props.projectId);
  }, [props.measurements, props.projectId]);

  const displayMeasurements = [...projectSpecificMeasurements, ...sessionMeasurements];

  const triggerPurge = () => {
    setIsPurging(true);
    props.setCurrentPoints([]);
    setTimeout(() => setIsPurging(false), 600);
  };

  /** * DATA ENGINE: SECURE MEASUREMENT TO VAULT */
  const handleRecordMeasurement = async () => {
    if (props.currentPoints.length < 2 || !user || !db) {
      props.setCurrentPoints([]);
      return;
    }

    let baseValue = 0;
    
    // 1. Geometry Calculation
    if (props.activeTool === 'length') {
      for (let i = 1; i < props.currentPoints.length; i++) {
        const p1 = props.currentPoints[i - 1];
        const p2 = props.currentPoints[i];
        baseValue += Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      }
      baseValue = baseValue * props.scaleFactor;
    } else if (props.activeTool === 'area') {
      let area = 0;
      const pts = props.currentPoints;
      for (let i = 0; i < pts.length; i++) {
        const j = (i + 1) % pts.length;
        area += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
      }
      baseValue = Math.abs(area / 2);
      baseValue = baseValue * (props.scaleFactor * props.scaleFactor);
    }

    let finalValue = baseValue;
    let finalUnit = props.activeTool === 'area' ? 'm²' : 'm';

    // 2. Apply SMM Rules (Kenya Standard)
    if (props.activeTool === 'area' && props.activeSection.includes('Concrete')) {
          finalValue = baseValue * (props.smmParams?.depth || 0.150); 
          finalUnit = 'm³';
    } else if (props.activeTool === 'length' && props.activeSection.includes('Walling')) {
          finalValue = baseValue * (props.smmParams?.height || 3.000); 
          finalUnit = 'm²';
    }

    if (props.smmParams?.waste) {
          finalValue = finalValue * (1 + (props.smmParams.waste / 100));
    }
    
    if (props.smmParams?.mode === 'DEDUCTION' || props.isDeductionMode) {
          finalValue = -Math.abs(finalValue);
    }

    // 3. Construct Secure Node Record
    const newMeasurement = {
        id: crypto.randomUUID(),
        project_id: props.projectId, // LINKED TO PROJECT
        user_id: user.id,            // LINKED TO OWNER
        timestamp: new Date().toISOString(),
        bill_item_id: "", 
        type: props.activeTool,
        points: props.currentPoints,
        value: finalValue,
        unit: finalUnit,
        sectionCode: props.activeSection,
        label: `${props.activeSection} Node`
    } as any; 

    try {
        // Atomic local save
        await db.measurements.add(newMeasurement);
        
        // Queue for Cloud Sync
        if (syncEngine) {
            await syncEngine.queueChange("measurements", newMeasurement.id, "INSERT", newMeasurement);
        }

        // Instant UI Update
        setSessionMeasurements(prev => [...prev, newMeasurement]);
        props.setCurrentPoints([]);
    } catch (err) {
        console.error("Vault Committal Failure:", err);
    }
  };

  const handleLocalDelete = (id: string) => {
    props.onDeleteMeasurement(id);
    setSessionMeasurements(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className={`flex-1 flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar p-4 sm:p-12 space-y-12 sm:space-y-24 animate-in fade-in duration-700 pb-40 text-left transition-colors
      ${theme === 'dark' ? 'bg-[#050505]' : 'bg-zinc-50'}`}>
      
      {!isExpanded && (
        <div className="max-w-6xl mx-auto w-full animate-in slide-in-from-top-4">
          <WorkspaceSummaryCard 
            activeSection={props.activeSection} 
            activeTool={props.activeTool} 
            measurementCount={displayMeasurements.length}
            theme={theme as "light" | "dark"}
          />
        </div>
      )}

      {/* STEP 01: THE DRAWING CANVAS */}
      <div className={`${isExpanded ? `fixed inset-0 z-[200] p-4 sm:p-8 flex flex-col m-0 ${theme === 'dark' ? 'bg-[#050505]' : 'bg-zinc-100'}` : 'max-w-6xl mx-auto w-full space-y-10'} transition-all duration-500`}>
        
        {!isExpanded && (
          <div className="flex items-center justify-between px-8 border-l-4 border-amber-500">
             <div className="flex items-center gap-6">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[10px] font-black text-amber-500 shadow-lg">01</div>
                <div className="text-left">
                   <h4 className={`text-2xl font-black uppercase tracking-tighter leading-none italic ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Blueprints</h4>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mt-2 italic">Interactive Site Drawing</p>
                </div>
             </div>
             <div className="flex items-center gap-4">
                <button 
                  onClick={triggerPurge} 
                  className={`p-3.5 rounded-xl border transition-all active:scale-90 shadow-xl
                    ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-rose-500' : 'bg-white border-zinc-200 text-zinc-400 hover:text-rose-500 shadow-sm'}`}
                  title="Clear lines"
                >
                  <RefreshCw size={20} className={isPurging ? 'animate-spin' : ''} />
                </button>
                <button 
                  onClick={() => setIsExpanded(true)} 
                  className={`p-3.5 rounded-xl border transition-all active:scale-90 shadow-xl
                    ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-amber-500' : 'bg-white border-zinc-200 text-zinc-400 hover:text-amber-500 shadow-sm'}`}
                  title="Fullscreen"
                >
                  <Maximize2 size={20} />
                </button>
             </div>
          </div>
        )}
        
        <div className={`relative overflow-hidden transition-all duration-500 shadow-2xl
          ${isExpanded ? 'flex-1 rounded-[3rem] border-2' : 'h-[80vh] rounded-[4rem] border-2'}
          ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 shadow-black' : 'bg-white border-zinc-300 shadow-zinc-300'}`}>
          
          {isExpanded && (
              <button 
                onClick={() => setIsExpanded(false)} 
                className="absolute top-8 right-8 z-[210] px-8 py-5 bg-amber-500 text-black rounded-3xl shadow-2xl hover:bg-amber-400 active:scale-90 transition-all flex items-center gap-4 font-black uppercase text-xs tracking-widest italic shadow-amber-500/20"
              >
                 <Minimize2 size={24} strokeWidth={3} /> Back to Hub
              </button>
          )}

          <BlueprintViewport 
            {...props} 
            measurements={displayMeasurements} 
            pageNum={1} 
            onCompleteMeasurement={handleRecordMeasurement}
          />
        </div>
      </div>

      {/* STEP 02 & 03: TOOL SETUP & CALIBRATION */}
      {!isExpanded && (
        <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-12 animate-in fade-in duration-500">
           <div className="space-y-8">
              <div className="flex items-center gap-6 px-8 border-l-4 border-zinc-700">
                 <div className={`w-10 h-10 rounded-full border flex items-center justify-center text-[10px] font-black text-zinc-500 shadow-inner ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>02</div>
                 <h4 className={`text-xl font-black uppercase tracking-widest italic ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>Choose Tool</h4>
              </div>
              <div className={`rounded-[3.5rem] border p-8 shadow-xl transition-colors duration-500
                  ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200'}`}>
                  <SMMWorkSections
                    activeSection={props.activeSection}
                    setActiveSection={props.setActiveSection}
                    activeTool={props.activeTool}
                    setActiveTool={props.setActiveTool}
                  />
              </div>
           </div>
           <div className="space-y-8">
              <div className="flex items-center gap-6 px-8 border-l-4 border-zinc-700">
                 <div className={`w-10 h-10 rounded-full border flex items-center justify-center text-[10px] font-black text-zinc-500 shadow-inner ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>03</div>
                 <h4 className={`text-xl font-black uppercase tracking-widest italic ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>Set Scale</h4>
              </div>
              <div className={`rounded-[3.5rem] border p-10 flex items-center justify-center min-h-[350px] shadow-inner transition-colors duration-500
                  ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800 shadow-black' : 'bg-zinc-100 border-zinc-200 shadow-inner'}`}>
                  <CalibrationNode
                    currentScale={props.scaleFactor}
                    onScaleChange={props.setScaleFactor}
                    unit={props.unit}
                    onUnitToggle={props.setUnit}
                  />
              </div>
           </div>
        </div>
      )}

      {/* STEP 04: THE PROJECT LEDGER */}
      {!isExpanded && (
        <div className="max-w-6xl mx-auto w-full space-y-10 animate-in fade-in duration-500">
          <div className="flex items-center justify-between px-8 border-l-4 border-emerald-500">
             <div className="flex items-center gap-6 text-left">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px] font-black text-emerald-500 shadow-lg">04</div>
                <div>
                  <h4 className={`text-2xl font-black uppercase tracking-tighter leading-none italic ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Record List</h4>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mt-2 italic">Secured Quantities for {props.projectName}</p>
                </div>
             </div>
             <ClipboardList size={28} className="text-zinc-700 opacity-30" />
          </div>
          
          <div className={`rounded-[4rem] border overflow-hidden shadow-2xl flex flex-col transition-colors duration-500
              ${theme === 'dark' ? 'bg-zinc-950/20 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200'}`}>
              <div className="flex-1">
                <TakeoffLedger
                  measurements={displayMeasurements}
                  onDelete={handleLocalDelete}
                  activeSection={props.activeSection}
                />
              </div>
              <div className={`p-12 border-t transition-colors duration-500 ${theme === 'dark' ? 'bg-zinc-900/10 border-zinc-800/40' : 'bg-zinc-50 border-zinc-100 shadow-inner'}`}>
                 <div className="flex items-center gap-5 mb-8 opacity-40 text-left">
                    <Settings2 size={18} className="text-amber-500" />
                    <h5 className={`text-[11px] font-black uppercase tracking-[0.4em] ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-900'}`}>Project Rules</h5>
                 </div>
                 <SMMTemplates
                   activeSection={props.activeSection}
                   isDeductionMode={props.isDeductionMode}
                   setIsDeductionMode={props.setIsDeductionMode}
                   onParameterChange={props.setSmmParams}
                 />
              </div>
          </div>
        </div>
      )}

      <footer className="pt-32 pb-24 text-center opacity-10 select-none flex flex-col items-center gap-10">
        <div className="flex items-center justify-center gap-12 mb-4">
           <div className={`h-px w-60 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-300'}`} />
           <Database size={40} className={theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'} />
           <div className={`h-px w-60 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-300'}`} />
        </div>
        <p className={`text-[14px] font-black uppercase tracking-[2em] italic leading-none ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>PROJECT VAULT SECURED</p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${theme === 'dark' ? '#27272a' : '#d4d4d8'}; border-radius: 20px; }
      `}</style>
    </div>
  );
};

export default TakeoffWorkspace;
