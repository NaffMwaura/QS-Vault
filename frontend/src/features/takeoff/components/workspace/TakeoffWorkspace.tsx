import React from "react";
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Ruler,
  Settings2,
  Zap,
} from "lucide-react";
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

const WorkspaceSummaryCard = ({
  activeSection,
  activeTool,
  measurementCount,
}: {
  activeSection: string;
  activeTool: MeasurementTool;
  measurementCount: number;
}) => (
  <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-5 shadow-xl">
    <div className="flex items-start gap-3">
      <Ruler size={18} className="text-amber-500 mt-0.5 shrink-0" />
      <div className="text-left">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500 mb-2">
          Takeoff workflow
        </p>
        <p className="text-sm font-semibold text-zinc-200 leading-snug">
          Create quantities from the drawing, keep calibration visible, and validate each section as you move.
        </p>
      </div>
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
      <span className="px-3 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
        Section: {activeSection}
      </span>
      <span className="px-3 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
        Tool: {activeTool}
      </span>
      <span className="px-3 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
        Saved: {measurementCount}
      </span>
    </div>
  </div>
);

const TakeoffWorkspace = ({
  pdfDoc,
  setPdfDoc,
  scale,
  setScale,
  scaleFactor,
  setScaleFactor,
  unit,
  setUnit,
  activeSection,
  setActiveSection,
  activeTool,
  setActiveTool,
  isMeasuring,
  setIsMeasuring,
  isDeductionMode,
  setIsDeductionMode,
  currentPoints,
  setCurrentPoints,
  measurements,
  setSmmParams,
  leftOpen,
  setLeftOpen,
  rightOpen,
  setRightOpen,
  onCanvasClick,
  onDeleteMeasurement,
}: TakeoffWorkspaceProps) => {
  return (
    <>
      <div className="hidden lg:flex flex-1 overflow-hidden">
        <div
          className={`relative transition-all duration-500 border-r z-30 ${
            leftOpen ? "w-80" : "w-0"
          } bg-zinc-950/60 backdrop-blur-3xl`}
        >
        <div
          className={`w-80 h-full flex flex-col overflow-y-auto custom-scrollbar ${
            !leftOpen && "invisible opacity-0"
          }`}
        >
            <SMMWorkSections
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              activeTool={activeTool}
              setActiveTool={setActiveTool}
            />
          <div className="p-8 border-t border-zinc-800/40 bg-white/1 mt-8">
            <CalibrationNode
              currentScale={scaleFactor}
              onScaleChange={setScaleFactor}
              unit={unit}
                onUnitToggle={setUnit}
              />
            </div>
          </div>
          <button
            onClick={() => setLeftOpen((current) => !current)}
            className="absolute top-1/2 -right-3.5 -translate-y-1/2 w-7 h-7 rounded-full border bg-zinc-950 border-zinc-800 text-zinc-500 z-50 flex items-center justify-center hover:text-amber-500 shadow-2xl"
          >
            {leftOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>

        <main className="flex-1 relative bg-black overflow-hidden flex flex-col">
          <BlueprintViewport
            pdfDoc={pdfDoc}
            setPdfDoc={setPdfDoc}
            pageNum={1}
            scale={scale}
            setScale={setScale}
            isMeasuring={isMeasuring}
            setIsMeasuring={setIsMeasuring}
            activeTool={activeTool}
            currentPoints={currentPoints}
            setCurrentPoints={setCurrentPoints}
          measurements={measurements}
          activeSection={activeSection}
          scaleFactor={scaleFactor}
          unit={unit}
          onCanvasClick={onCanvasClick}
        />
          {isMeasuring && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 px-8 py-4 bg-amber-500 rounded-2xl border-2 border-amber-600 shadow-2xl animate-in slide-in-from-top-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-black flex items-center gap-3">
                <Zap size={16} className="fill-current animate-pulse" /> Define{" "}
                {activeTool} on drawing
              </p>
            </div>
          )}
        </main>

        <div
          className={`relative transition-all duration-500 border-l z-30 ${
            rightOpen ? "w-96" : "w-0"
          } bg-zinc-950/60 backdrop-blur-3xl`}
        >
          <div
            className={`w-96 h-full flex flex-col overflow-hidden ${
              !rightOpen && "invisible opacity-0"
            }`}
          >
            <div className="flex-1 overflow-hidden">
              <TakeoffLedger
                measurements={measurements}
                onDelete={onDeleteMeasurement}
                activeSection={activeSection}
              />
            </div>
            <div className="p-8 border-t border-zinc-800/40 bg-white/1">
              <SMMTemplates
                activeSection={activeSection}
                isDeductionMode={isDeductionMode}
                setIsDeductionMode={setIsDeductionMode}
                onParameterChange={setSmmParams}
              />
            </div>
          </div>
          <button
            onClick={() => setRightOpen((current) => !current)}
            className="absolute top-1/2 -left-3.5 -translate-y-1/2 w-7 h-7 rounded-full border bg-zinc-950 border-zinc-800 text-zinc-500 z-50 flex items-center justify-center hover:text-amber-500 shadow-2xl"
          >
            {rightOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      </div>

      <div className="lg:hidden flex-1 overflow-y-auto bg-[#050505] custom-scrollbar">
        <div className="p-4 space-y-4">
          <WorkspaceSummaryCard
            activeSection={activeSection}
            activeTool={activeTool}
            measurementCount={measurements.length}
          />

          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Settings2 size={16} className="text-amber-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">
                Measure Setup
              </p>
            </div>
            <SMMWorkSections
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              activeTool={activeTool}
              setActiveTool={setActiveTool}
            />
          </div>

          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-2 overflow-hidden">
            <BlueprintViewport
              pdfDoc={pdfDoc}
              setPdfDoc={setPdfDoc}
              pageNum={1}
              scale={scale}
              setScale={setScale}
              isMeasuring={isMeasuring}
              setIsMeasuring={setIsMeasuring}
              activeTool={activeTool}
              currentPoints={currentPoints}
              setCurrentPoints={setCurrentPoints}
              measurements={measurements}
              activeSection={activeSection}
              scaleFactor={scaleFactor}
              unit={unit}
              onCanvasClick={onCanvasClick}
            />
          </div>

          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Ruler size={16} className="text-amber-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">
                Calibration
              </p>
            </div>
            <CalibrationNode
              currentScale={scaleFactor}
              onScaleChange={setScaleFactor}
              unit={unit}
              onUnitToggle={setUnit}
            />
          </div>

          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-4">
            <div className="flex items-center gap-3 mb-3">
              <ClipboardList size={16} className="text-amber-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">
                Ledger
              </p>
            </div>
            <TakeoffLedger
              measurements={measurements}
              onDelete={onDeleteMeasurement}
              activeSection={activeSection}
            />
          </div>

          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Settings2 size={16} className="text-amber-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">
                Rules
              </p>
            </div>
            <SMMTemplates
              activeSection={activeSection}
              isDeductionMode={isDeductionMode}
              setIsDeductionMode={setIsDeductionMode}
              onParameterChange={setSmmParams}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default TakeoffWorkspace;
