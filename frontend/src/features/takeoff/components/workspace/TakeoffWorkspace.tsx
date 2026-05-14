/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from "react";
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
  MousePointer2
} from "lucide-react";

// Direct Infrastructure Imports (Lighter & Faster)
import { useAuth } from "../../../auth/AuthContext";
import { db, syncEngine } from "../../../../lib/database/database";

// Child Components
import BlueprintViewport from "../BlueprintViewport";
import CalibrationNode from "../CalibrationNode";
import TakeoffLedger from "../TakeoffLedger";
import SMMTemplates from "../SMMTemplates";
import SMMWorkSections from "../SMMWorkSections";

// Master Types
import type {
  Measurement,
  MeasurementTool,
  Point,
  SmmParams,
} from "../../types/takeoff";

interface TakeoffWorkspaceProps {
  projectId: string;
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

/** --- UI: STATUS SUMMARY CARD --- **/
const WorkspaceSummaryCard = ({ activeSection, activeTool, theme }: any) => (
  <div className={`rounded-[2.5rem] border p-8 sm:p-10 shadow-2xl relative overflow-hidden transition-all duration-500
    ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-sm'}`}>
    <div className="absolute top-0 right-0 p-8 opacity-5"><Ruler size={80} className="text-amber-500" /></div>
    <div className="flex items-start gap-6 relative z-10">
      <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-500 shadow-inner">
        <MousePointer2 size={24} strokeWidth={2.5} />
      </div>
      <div className="text-left space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">Technical Takeoff Active</p>
        <p className={`text-base sm:text-xl font-bold leading-snug ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>
          Map out quantities on the blueprint. Your records are secured to the project vault automatically.
        </p>
      </div>
    </div>
    <div className="mt-8 flex flex-wrap gap-4 relative z-10">
      <div className={`px-5 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-widest flex items-center gap-3
        ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600'}`}>
        <Layers size={14} className="text-amber-500" /> {activeSection}
      </div>
      <div className={`px-5 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-widest flex items-center gap-3
        ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600'}`}>
        <Target size={14} className="text-blue-500" /> Tool: {activeTool}
      </div>
    </div>
  </div>
);

/** --- MAIN WORKSPACE COMPONENT --- **/
const TakeoffWorkspace = (props: TakeoffWorkspaceProps) => {
  const { theme, user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  // Local "Session Memory" for instant UI updates before DB fetch cycles
  const [sessionMeasurements, setSessionMeasurements] = useState<Measurement[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessionMeasurements([]);
  }, [props.projectId]);

  // Filter global measurements strictly by the current project to prevent data leakage
  const projectSpecificMeasurements = useMemo(() => {
    return props.measurements.filter(m => m.project_id === props.projectId);
  }, [props.measurements, props.projectId]);

  // Combine saved vault data with active session data, deduping by ID to prevent overlapping records
  const displayMeasurements = useMemo(() => {
    const seenIds = new Set(projectSpecificMeasurements.map((m) => m.id));
    return [
      ...projectSpecificMeasurements,
      ...sessionMeasurements.filter((m) => !seenIds.has(m.id))
    ];
  }, [projectSpecificMeasurements, sessionMeasurements]);

  const triggerPurge = () => {
    setIsPurging(true);
    props.setCurrentPoints([]);
    setTimeout(() => setIsPurging(false), 600);
  };

  /** * ACTION: SECURE MEASUREMENT TO VAULT 
   * This is the "Heart" of the machine. It calculates and saves.
   */
  const handleRecordMeasurement = async () => {
    if (props.currentPoints.length < 1 || !user || !db) {
      props.setCurrentPoints([]);
      return;
    }

    let baseValue = 0;

    // 1. GEOMETRY ENGINE
    if (props.activeTool === 'length') {
      for (let i = 1; i < props.currentPoints.length; i++) {
        const p1 = props.currentPoints[i - 1];
        const p2 = props.currentPoints[i];
        baseValue += Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      }
      baseValue = baseValue * props.scaleFactor;
    } else if (props.activeTool === 'area' && props.currentPoints.length > 2) {
      let area = 0;
      const pts = props.currentPoints;
      for (let i = 0; i < pts.length; i++) {
        const j = (i + 1) % pts.length;
        area += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
      }
      baseValue = Math.abs(area / 2) * (props.scaleFactor * props.scaleFactor);
    } else if (props.activeTool === 'count') {
      baseValue = props.currentPoints.length;
    }

    let finalValue = baseValue;
    let finalUnit = props.activeTool === 'area' ? 'm²' : props.activeTool === 'count' ? 'nr' : 'm';

    // 2. SMM-KE (KENYA) ENGINEERING RULES
    // Area of concrete * Depth = m3
    if (props.activeTool === 'area' && props.activeSection.toLowerCase().includes('concrete')) {
      finalValue = baseValue * (props.smmParams?.depth || 0.150);
      finalUnit = 'm³';
    }
    // Length of wall * Height = m2
    else if (props.activeTool === 'length' && props.activeSection.toLowerCase().includes('walling')) {
      finalValue = baseValue * (props.smmParams?.height || 3.000);
      finalUnit = 'm²';
    }

    // Apply waste percentage
    if (props.smmParams?.waste) {
      finalValue = finalValue * (1 + (props.smmParams.waste / 100));
    }

    // Handle Deductions (e.g., windows/doors)
    if (props.isDeductionMode) {
      finalValue = -Math.abs(finalValue);
    }

    // 3. CONSTRUCT RECORD (Aligned with Master database.ts)
    const newRecord: Measurement = {
      id: crypto.randomUUID(),
      project_id: props.projectId,
      bill_item_id: null,
      label: `${props.activeSection} Node #${displayMeasurements.length + 1}`,
      type: props.activeTool,
      value: finalValue,
      unit: finalUnit,
      sectionCode: props.activeSection,
      points: props.currentPoints,
      timestamp: new Date().toISOString()
    };

    try {
      // Step A: Immediate Local Vault Save
      await db.measurements.add(newRecord);

      // Step B: Queue Cloud Bridge Sync
      if (syncEngine) {
        await syncEngine.queueChange("measurements", newRecord.id, "INSERT", newRecord);
      }

      // Step C: Update Local UI Session
      setSessionMeasurements(prev => [newRecord, ...prev]);
      props.setCurrentPoints([]);
    } catch (err) {
      console.error("Vault Error: Failed to secure node.");
    }
  };

  const handleLocalDelete = (id: string) => {
    props.onDeleteMeasurement(id);
    setSessionMeasurements(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className={`flex-1 flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar p-4 sm:p-10 space-y-12 pb-40 transition-colors
      ${theme === 'dark' ? 'bg-[#050505]' : 'bg-zinc-50'}`}>

      {!isExpanded && (
        <div className="max-w-6xl mx-auto w-full animate-in slide-in-from-top-4 duration-500">
          <WorkspaceSummaryCard
            activeSection={props.activeSection}
            activeTool={props.activeTool}
            theme={theme}
          />
        </div>
      )}

      {/* STEP 01: THE DRAWING CANVAS */}
      <div className={`${isExpanded ? `fixed inset-0 z-200] p-4 flex flex-col ${theme === 'dark' ? 'bg-black' : 'bg-zinc-100'}` : 'max-w-6xl mx-auto w-full space-y-8'} transition-all duration-500`}>

        {!isExpanded && (
          <div className="flex items-center justify-between px-6 border-l-4 border-amber-500">
            <div className="text-left">
              <h4 className={`text-2xl font-black uppercase tracking-tighter italic ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>01. Blueprint View</h4>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mt-1 italic">Precision Canvas</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={triggerPurge} className={`p-3 rounded-xl border transition-all active:scale-90 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-rose-500' : 'bg-white border-zinc-200 text-zinc-400'}`}>
                <RefreshCw size={18} className={isPurging ? 'animate-spin' : ''} />
              </button>
              <button onClick={() => setIsExpanded(true)} className={`p-3 rounded-xl border transition-all active:scale-90 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-amber-500' : 'bg-white border-zinc-200 text-zinc-400'}`}>
                <Maximize2 size={18} />
              </button>
            </div>
          </div>
        )}

        <div className={`relative overflow-auto transition-all duration-500
          ${isExpanded ? 'flex-1 rounded-4xl border-2' : 'h-[75vh] rounded-[3.5rem] border-2'}
          ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200 shadow-xl'}`}>

          {isExpanded && (
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-6 right-6 z-210] px-6 py-4 bg-amber-500 text-black rounded-2xl shadow-2xl hover:bg-amber-400 active:scale-90 transition-all flex items-center gap-3 font-black uppercase text-[10px] italic"
            >
              <Minimize2 size={20} strokeWidth={3} /> Exit Fullscreen
            </button>
          )}

          <BlueprintViewport
            {...props}
            measurements={displayMeasurements}
            pageNum={1}
            onCompleteMeasurement={handleRecordMeasurement}
            hideSavedMeasurements={true}
          />
        </div>
      </div>

      {/* STEPS 02 & 03: CONTROLS */}
      {!isExpanded && (
        <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-10 animate-in fade-in duration-700">
          <div className="space-y-6">
            <h4 className={`text-lg font-black uppercase tracking-widest italic px-6 border-l-4 border-zinc-700 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>02. Tooling</h4>
            <div className={`rounded-[2.5rem] border p-8 shadow-lg ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <SMMWorkSections
                activeSection={props.activeSection}
                setActiveSection={props.setActiveSection}
                activeTool={props.activeTool}
                setActiveTool={props.setActiveTool}
              />
            </div>
          </div>
          <div className="space-y-6">
            <h4 className={`text-lg font-black uppercase tracking-widest italic px-6 border-l-4 border-zinc-700 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>03. Calibration</h4>
            <div className={`rounded-[2.5rem] border p-8 shadow-lg flex items-center justify-center min-h-300px] ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200'}`}>
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

      {/* STEP 04: THE LEDGER */}
      {!isExpanded && (
        <div className="max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-700">
          <div className="flex items-center justify-between px-6 border-l-4 border-emerald-500">
            <div className="text-left">
              <h4 className={`text-2xl font-black uppercase tracking-tighter leading-none italic ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>04. Project Ledger</h4>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mt-1 italic">Records for {props.projectName}</p>
            </div>
            <ClipboardList size={24} className="text-zinc-700 opacity-30" />
          </div>

          <div className={`rounded-[3.5rem] border overflow-hidden shadow-2xl flex flex-col
              ${theme === 'dark' ? 'bg-zinc-950/20 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <TakeoffLedger
              projectId={props.projectId}
              measurements={displayMeasurements}
              onDelete={handleLocalDelete}
              activeSection={props.activeSection}
            />
            <div className={`p-10 border-t ${theme === 'dark' ? 'bg-zinc-900/10 border-zinc-800/40' : 'bg-zinc-50 border-zinc-100 shadow-inner'}`}>
              <div className="flex items-center gap-4 mb-6 opacity-30 text-left">
                <Settings2 size={16} className="text-amber-500" />
                <h5 className={`text-[10px] font-black uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-900'}`}>Engineering Specifications</h5>
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

      <footer className="pt-24 pb-20 text-center opacity-10 select-none flex flex-col items-center gap-6">
        <div className="flex items-center justify-center gap-8">
          <div className={`h-px w-40 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-300'}`} />
          <Database size={24} className="text-zinc-500" />
          <div className={`h-px w-40 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-300'}`} />
        </div>
        <p className="text-[12px] font-black uppercase tracking-[1.5em] italic">QS VAULT • OS V2.7</p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${theme === 'dark' ? '#27272a' : '#d4d4d8'}; border-radius: 20px; }
      `}</style>
    </div>
  );
};

export default TakeoffWorkspace;

