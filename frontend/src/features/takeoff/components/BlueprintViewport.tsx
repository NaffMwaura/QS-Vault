/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  MousePointer2, Upload,
  FileSearch, BadgeCheck,
  Ruler,
  Hand,
  CheckCircle2,
  Target,
  Layers
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type {
  PDFDocumentProxy,
  RenderTask,
} from 'pdfjs-dist/types/src/display/api';
import type { Measurement, MeasurementTool, Point } from "../types/takeoff";

/** * PDF ENGINE CONFIGURATION */
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface BlueprintViewportProps {
  pdfDoc: PDFDocumentProxy | null;
  setPdfDoc: (doc: PDFDocumentProxy | null) => void;
  pageNum: number;
  scale: number;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  isMeasuring: boolean;
  setIsMeasuring: (val: boolean) => void;
  activeTool: MeasurementTool;
  currentPoints: Point[];
  setCurrentPoints: React.Dispatch<React.SetStateAction<Point[]>>;
  measurements: Measurement[];
  projectId: string;
  hideSavedMeasurements?: boolean;
  activeSection: string;
  scaleFactor: number;
  unit: "m" | "mm";
  onCanvasClick: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onCanvasDoubleClick?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onCompleteMeasurement?: () => void;
}

const BlueprintViewport: React.FC<BlueprintViewportProps> = ({
  projectId,
  hideSavedMeasurements = false,
  pdfDoc,
  setPdfDoc,
  pageNum,
  scale,
  setScale,
  isMeasuring,
  setIsMeasuring,
  activeTool,
  currentPoints,
  setCurrentPoints,
  measurements,
  activeSection,
  scaleFactor,
  unit,
  onCanvasClick,
  onCanvasDoubleClick,
  onCompleteMeasurement
}) => {
  const filteredMeasurements = measurements.filter((measurement) => measurement.project_id === projectId);
  const [isRendering, setIsRendering] = useState(false);

  // Navigation State
  const [isDragging, setIsDragging] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);

  /** * 1. PAN ENGINE (Smooth Site Navigation) */
  const handleMouseDown = () => {
    if (isMeasuring || !scrollContainerRef.current) return;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isMeasuring || !scrollContainerRef.current) return;
    e.preventDefault();
    scrollContainerRef.current.scrollLeft -= e.movementX;
    scrollContainerRef.current.scrollTop -= e.movementY;
  };

  const handleMouseUp = () => setIsDragging(false);

  /** * 2. RENDERING ENGINE (Fixed for Stability) */
  const renderPage = useCallback(async (pdf: PDFDocumentProxy, pNum: number, zoom: number) => {
    if (!canvasRef.current || !pdf) return;

    try {
      setIsRendering(true);
      // Cancel previous task to prevent memory leaks or "blank screen" crashes
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const page = await pdf.getPage(pNum);
      const viewport = page.getViewport({ scale: zoom });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvas,
          canvasContext: context,
          viewport: viewport
        };

        renderTaskRef.current = page.render(renderContext);
        await renderTaskRef.current.promise;
      }
      setIsRendering(false);
    } catch (err: any) {
      if (err.name !== "RenderingCancelledException") {
        console.error("Plan View: Render failed.", err);
      }
      setIsRendering(false);
    }
  }, []);

  useEffect(() => {
    if (pdfDoc) {
      renderPage(pdfDoc, pageNum, scale);
    }
  }, [pdfDoc, pageNum, scale, renderPage]);

  /** * 3. FILE UPLOADER */
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsRendering(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const typedarray = new Uint8Array(reader.result as ArrayBuffer);
        const loadingTask = pdfjsLib.getDocument({ data: typedarray, verbosity: 0 });
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error("Drawing Upload Failed.");
    } finally {
      setIsRendering(false);
    }
  };

  const loadSample = async () => {
    const sampleUrl = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf';
    try {
      setIsRendering(true);
      const loadingTask = pdfjsLib.getDocument(sampleUrl);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
    } catch (err) {
      setIsRendering(false);
    }
  };

  return (
    <section className="flex-1 relative overflow-hidden flex flex-col items-center justify-center w-full h-full transition-colors duration-500 bg-zinc-950/20">

      {/* TOOLBAR HUD */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-col gap-2 z-40 p-2 rounded-2xl border-2 border-zinc-800 bg-zinc-900/80 shadow-2xl backdrop-blur-xl">
        <button onClick={() => setScale(s => Math.min(s + 0.25, 5))} className="p-3 transition-all active:scale-90 rounded-xl hover:text-amber-500 text-zinc-400" title="Zoom In">
          <ZoomIn size={20} />
        </button>
        <button onClick={() => setScale(s => Math.max(s - 0.25, 0.25))} className="p-3 transition-all active:scale-90 rounded-xl hover:text-amber-500 text-zinc-400" title="Zoom Out">
          <ZoomOut size={20} />
        </button>

        <div className="h-px mx-2 my-1 border-t border-zinc-800" />

        <button
          onClick={() => setIsMeasuring(false)}
          disabled={!pdfDoc}
          className={`p-3 rounded-xl transition-all active:scale-90 
            ${!isMeasuring ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:bg-zinc-800'} 
            ${!pdfDoc ? 'opacity-20 cursor-not-allowed' : ''}`}
          title="Pan (Hand Tool)"
        >
          <Hand size={20} />
        </button>

        <button
          onClick={() => { setIsMeasuring(true); setCurrentPoints([]); }}
          disabled={!pdfDoc}
          className={`p-3 rounded-xl transition-all active:scale-90
            ${isMeasuring ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:bg-zinc-800'} 
            ${!pdfDoc ? 'opacity-20 cursor-not-allowed' : ''}`}
          title="Measure"
        >
          <MousePointer2 size={20} />
        </button>
      </div>

      {/* QUICK FINISH BUTTON */}
      {isMeasuring && currentPoints.length > 0 && activeTool !== 'count' && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-60 animate-in slide-in-from-top-4">
          <button
            onClick={(e) => {
              e.preventDefault(); e.stopPropagation();
              if (onCompleteMeasurement) onCompleteMeasurement();
              else setCurrentPoints([]);
            }}
            className="px-8 py-4 bg-emerald-500 text-black rounded-full font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-emerald-400 active:scale-95 transition-all flex items-center gap-3 border-2 border-emerald-300"
          >
            <CheckCircle2 size={18} strokeWidth={3} /> Save {activeTool}
          </button>
        </div>
      )}

      {/* DRAWING CONTEXT WIDGET */}
      <div className="absolute top-6 right-6 z-40 hidden md:block w-72">
        <div className="bg-zinc-900/80 border-2 border-zinc-800 rounded-4xl p-6 shadow-2xl backdrop-blur-xl text-left">
          <div className="flex items-center gap-3 mb-4">
            <Ruler size={16} className="text-amber-500" />
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Current Settings</p>
          </div>
          <p className="text-white text-sm font-semibold leading-relaxed mb-6">
            Upload your plan, check the scale, then start measuring.
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-[9px] font-black uppercase text-zinc-400 tracking-widest">
              <Layers size={12} className="text-amber-500" /> {activeSection}
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-[9px] font-black uppercase text-zinc-400 tracking-widest">
              <Target size={12} className="text-blue-500" /> {scaleFactor.toFixed(3)} {unit}
            </div>
          </div>
        </div>
      </div>

      {/* MEASUREMENT SPACE */}
      <div
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`w-full h-full relative overflow-x-auto overflow-y-auto custom-scrollbar
          ${isMeasuring ? 'cursor-crosshair' : isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        {!pdfDoc ? (
          <div className="w-full h-full flex items-center justify-center p-10">
            <div className="bg-zinc-900/40 border-2 border-zinc-800 p-12 sm:p-24 rounded-[3.5rem] text-center backdrop-blur-md max-w-2xl animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-10 border-2 border-amber-500/20">
                <FileSearch size={40} className="text-amber-500 opacity-60" />
              </div>
              <div className="space-y-8">
                <div className="space-y-2">
                  <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">No Drawing Uploaded</h3>
                  <p className="text-zinc-500 text-sm font-medium">Select a PDF drawing to begin the technical takeoff.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button onClick={() => fileInputRef.current?.click()} className="px-10 py-5 bg-amber-500 text-black rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-3 italic">
                    <Upload size={18} strokeWidth={3} /> Upload PDF
                  </button>
                  <button onClick={loadSample} className="px-10 py-5 bg-zinc-800 text-zinc-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:text-white transition-all">
                    Practice Mode
                  </button>
                </div>
                <input type="file" ref={fileInputRef} onChange={onFileChange} accept=".pdf" className="hidden" />
              </div>
            </div>
          </div>
        ) : (
          <div className="inline-flex items-start justify-start p-20">
            <div className="relative shadow-[0_0_100px_rgba(0,0,0,0.8)] border-4 border-zinc-800">
              <canvas
                ref={canvasRef}
                onClick={isMeasuring ? onCanvasClick : undefined}
                onDoubleClick={isMeasuring ? (e) => {
                  e.stopPropagation();
                  if (onCanvasDoubleClick) onCanvasDoubleClick(e);
                  if (onCompleteMeasurement) onCompleteMeasurement();
                } : undefined}
                className={`transition-opacity duration-500 bg-white ${isRendering ? 'opacity-30' : 'opacity-100'}`}
              />

              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox={`0 0 ${canvasRef.current?.width || 0} ${canvasRef.current?.height || 0}`}>
                {currentPoints.length > 0 && (
                  <polyline points={currentPoints.map(p => `${p.x},${p.y}`).join(' ')} fill={activeTool === 'area' ? 'rgba(245,158,11,0.2)' : 'none'} stroke="#f59e0b" strokeWidth="3" strokeDasharray="8,4" strokeLinecap="round" />
                )}
                {!hideSavedMeasurements && filteredMeasurements.map(m => (
                  <polyline key={m.id} points={(m.points ?? []).map((p: any) => `${p.x},${p.y}`).join(' ')} fill={m.type === 'area' ? 'rgba(16,185,129,0.08)' : 'none'} stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-60" />
                ))}
                {currentPoints.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="6" fill="#f59e0b" className="stroke-black stroke-2" />
                ))}
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* STATUS INDICATORS */}
      <div className="absolute bottom-6 left-6 z-40 pointer-events-none">
        <div className="bg-zinc-900/80 border-2 border-zinc-800 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-2xl backdrop-blur-xl">
          <div className={`w-2.5 h-2.5 rounded-full ${isRendering ? 'bg-amber-500 animate-pulse' : pdfDoc ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
          <div className="text-left">
            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-1 leading-none">Drawing Status</p>
            <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${isRendering ? 'text-amber-500' : 'text-white'}`}>
              {isRendering ? 'Reading Drawing...' : pdfDoc ? 'Plan Ready' : 'Standby'}
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-40 pointer-events-none hidden sm:block">
        <div className="bg-zinc-900/80 border-2 border-zinc-800 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-2xl backdrop-blur-xl">
          <div className="text-right">
            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-1 leading-none">Vault Ledger</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-white leading-none">
              {measurements.length} Measurements Saved
            </p>
          </div>
          <BadgeCheck size={18} className="text-emerald-500" />
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 20px; border: 1px solid transparent; background-clip: content-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
      `}</style>
    </section>
  );
};

export default BlueprintViewport; 