/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ZoomIn, 
  ZoomOut, 
  MousePointer2, 
  Play, 
  Upload,
  FileSearch,
  Loader2,
  BadgeCheck,
  Ruler,
  Hand,
  CheckCircle2,
  ClipboardList
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
  activeSection: string;
  scaleFactor: number;
  unit: "m" | "mm";
  onCanvasClick: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  
  // Exposing hooks for Double Click and PWA Button
  onCanvasDoubleClick?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onCompleteMeasurement?: () => void;
}

const BlueprintViewport: React.FC<BlueprintViewportProps> = ({
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
  const [isRendering, setIsRendering] = useState(false);
  
  // Drag / Pan State
  const [isDragging, setIsDragging] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);

  /** * PANNING (DRAG) ENGINE - FIXED FOR FLAWLESS MOVEMENT */
  const handleMouseDown = () => {
    if (isMeasuring || !scrollContainerRef.current) return;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isMeasuring || !scrollContainerRef.current) return;
    e.preventDefault(); 
    // Uses native movement velocity for buttery smooth drag
    scrollContainerRef.current.scrollLeft -= e.movementX;
    scrollContainerRef.current.scrollTop -= e.movementY;
  };

  const handleMouseUp = () => setIsDragging(false);

  /** * RENDERING ENGINE */
  const renderPage = useCallback(async (pdf: PDFDocumentProxy, pNum: number, zoom: number) => {
    if (!canvasRef.current || !pdf) return;
    
    try {
      setIsRendering(true);
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
    } catch (err: unknown) {
      if (
        !(typeof err === "object" && err !== null && "name" in err && err.name === "RenderingCancelledException")
      ) {
        console.error("Viewport Engine: Render failure.", err);
      }
      setIsRendering(false);
    }
  }, []);

  useEffect(() => {
    if (pdfDoc) {
      renderPage(pdfDoc, pageNum, scale);
    }
  }, [pdfDoc, pageNum, scale, renderPage]);

  /** * FILE INTAKE */
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
      console.error("File Node: Handshake failed.", err);
    } finally {
      setIsRendering(false);
    }
  };

  const loadSampleBlueprint = async () => {
    const sampleUrl = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf';
    try {
      setIsRendering(true);
      const loadingTask = pdfjsLib.getDocument(sampleUrl);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
    } catch (err) {
      console.warn("Viewport: Sample drawing unreachable.");
      setIsRendering(false);
    } 
  };

  return (
    <section className={`flex-1 relative overflow-hidden flex flex-col items-center justify-center transition-colors duration-500 bg-[var(--app-bg)]`}>
      
      {/* 1. VIEWPORT HUD (Floating Controls) */}
      <div className={`absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-col gap-2 z-40 p-1.5 rounded-2xl border shadow-2xl backdrop-blur-xl transition-colors
        ${theme === 'dark' ? 'bg-zinc-950/80 border-zinc-800' : 'bg-white/90 border-zinc-200'}`}>
        
        <button onClick={() => setScale(s => Math.min(s + 0.25, 5))} className={`p-3 transition-all active:scale-90 rounded-xl ${theme === 'dark' ? 'text-zinc-400 hover:text-amber-500 hover:bg-zinc-900' : 'text-zinc-500 hover:text-amber-500 hover:bg-zinc-50'}`} title="Increase Scale">
          <ZoomIn size={20}/>
        </button>
        
        <button onClick={() => setScale(s => Math.max(s - 0.25, 0.25))} className={`p-3 transition-all active:scale-90 rounded-xl ${theme === 'dark' ? 'text-zinc-400 hover:text-amber-500 hover:bg-zinc-900' : 'text-zinc-500 hover:text-amber-500 hover:bg-zinc-50'}`} title="Decrease Scale">
          <ZoomOut size={20}/>
        </button>

        <div className={`h-px mx-2 my-1 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
        
        {/* PAN / DRAG TOOL */}
        <button 
          onClick={() => setIsMeasuring(false)} 
          disabled={!pdfDoc}
          className={`p-3 rounded-xl transition-all shadow-xl active:scale-90 
            ${!isMeasuring ? 'bg-amber-500 text-black shadow-amber-500/20' : theme === 'dark' ? 'text-zinc-500 hover:bg-zinc-800 hover:text-white' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'} 
            ${!pdfDoc ? 'opacity-20 cursor-not-allowed' : ''}`}
          title="Pan Document (Hand Tool)"
        >
          <Hand size={20}/>
        </button>

        {/* MEASURE TOOL */}
        <button 
          onClick={() => { setIsMeasuring(true); setCurrentPoints([]); }} 
          disabled={!pdfDoc}
          className={`p-3 rounded-xl transition-all shadow-xl active:scale-90 mt-1
            ${isMeasuring ? 'bg-amber-500 text-black shadow-amber-500/20' : theme === 'dark' ? 'text-zinc-500 hover:bg-zinc-800 hover:text-white' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'} 
            ${!pdfDoc ? 'opacity-20 cursor-not-allowed' : ''}`}
          title="Measure Tool"
        >
          <MousePointer2 size={20}/>
        </button>
      </div>

      {/* PWA FLOATING FINISH BUTTON (Top Center - Extreme Visibility) */}
      {isMeasuring && currentPoints.length > 0 && activeTool !== 'count' && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-60] animate-in slide-in-from-top-4">
           <button 
             onClick={(e) => {
               e.preventDefault();
               e.stopPropagation(); 
               if (onCompleteMeasurement) {
                   onCompleteMeasurement(); 
               } else {
                   setCurrentPoints([]); 
               }
             }}
             className="px-8 py-4 bg-emerald-500 text-black rounded-full font-black uppercase tracking-widest text-[11px] sm:text-xs shadow-[0_0_40px_rgba(16,185,129,0.5)] hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 border-2 border-emerald-300"
           >
              <CheckCircle2 size={18} strokeWidth={3} /> Record {activeTool} to Ledger
           </button>
        </div>
      )}

      {/* WORKFLOW SUMMARY WIDGET (Top Right) */}
      <div className="absolute top-6 right-6 z-40 max-w-[min(22rem,calc(100%-2rem))] hidden md:block">
        <div className={`border-2 rounded-[1.75rem] p-4 sm:p-5 shadow-2xl backdrop-blur-xl transition-colors
          ${theme === 'dark' ? 'bg-zinc-950/85 border-zinc-800' : 'bg-white/90 border-zinc-200'}`}>
          <div className="flex items-center gap-3 mb-3">
            <Ruler size={16} className="text-amber-500" />
            <p className="text-[9px] font-black uppercase tracking-[0.28em] text-zinc-500">
              Active Context
            </p>
          </div>
          <p className={`text-sm font-semibold leading-snug ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
            Upload the drawing, confirm the ratio, then capture measurements.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className={`px-3 py-2 rounded-full border text-[9px] font-black uppercase tracking-[0.2em]
              ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'}`}>
              Section: <span className="text-amber-500">{activeSection}</span>
            </span>
            <span className={`px-3 py-2 rounded-full border text-[9px] font-black uppercase tracking-[0.2em]
              ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'}`}>
              Scale: <span className="text-amber-500">{scaleFactor.toFixed(3)} {unit}</span>
            </span>
          </div>
        </div>
      </div>

      {/* MEASURING HUD */}
      {isMeasuring && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 px-8 py-3 bg-amber-500 text-black rounded-4xl border-4 border-black/10 shadow-[0_0_60px_rgba(245,158,11,0.4)] z-40 flex items-center gap-4 animate-in slide-in-from-top-6 pointer-events-none">
           <div className="w-3 h-3 bg-black rounded-full animate-ping" />
           <p className="text-[11px] sm:text-xs font-black uppercase tracking-[0.2em] italic mt-0.5 leading-none text-white">
             Define <span className="underline decoration-2">{activeTool}</span>
           </p>
        </div>
      )}

      {/* 2. MAIN DRAWING WORKSPACE (WITH FULL 360 PANNING) */}
      <div 
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`w-full h-full relative overflow-auto custom-scrollbar transition-all
          ${isMeasuring ? 'cursor-crosshair touch-none' : isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        {!pdfDoc ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className={`p-8 sm:p-24 text-center backdrop-blur-md rounded-[3rem] border-2 flex flex-col items-center gap-8 m-4 max-w-2xl transition-colors
              ${theme === 'dark' ? 'bg-zinc-950/50 border-zinc-800' : 'bg-white/80 border-zinc-200 shadow-xl'}`}>
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
                <div className={`p-12 rounded-full border-2 shadow-inner relative transition-colors
                  ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                  <FileSearch size={64} className={theme === 'dark' ? 'text-zinc-700' : 'text-zinc-400'} />
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="font-black uppercase tracking-[0.5em] text-[10px] text-zinc-500 leading-none italic">
                    Node Offline
                  </p>
                  <h3 className={`text-2xl font-black italic uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                    Blueprint Required
                  </h3>
                  <p className="text-sm text-zinc-500 max-w-lg mx-auto font-medium">
                    Start with a PDF drawing, verify the scale ratio, then begin placing measurements.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button onClick={() => fileInputRef.current?.click()} className="px-10 py-5 bg-amber-500 text-black rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 hover:bg-amber-400 transition-all flex items-center justify-center gap-3 active:scale-95">
                    <Upload size={16} className="stroke-[3px]" /> Load PDF Drawing
                  </button>
                  <button onClick={loadSampleBlueprint} className={`px-10 py-5 border-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95 ${theme === 'dark' ? 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white' : 'bg-white text-zinc-600 border-zinc-200 hover:text-zinc-900 shadow-sm'}`}>
                    <Play size={16} /> Use Practice Node
                  </button>
                </div>
                <input type="file" ref={fileInputRef} onChange={onFileChange} accept=".pdf" className="hidden" />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-max h-max min-w-full min-h-full flex items-center justify-center p-12 sm:p-24">
            <div className="relative shadow-[0_0_80px_rgba(0,0,0,0.5)]">
              <canvas 
                ref={canvasRef} 
                onClick={isMeasuring ? onCanvasClick : undefined} 
                onDoubleClick={isMeasuring ? (e) => { 
                    e.stopPropagation(); 
                    if (onCanvasDoubleClick) onCanvasDoubleClick(e); 
                    if (onCompleteMeasurement) onCompleteMeasurement();
                } : undefined}
                className={`transition-opacity duration-300 bg-white ${isRendering ? 'opacity-30' : 'opacity-100'}`} 
              />
              
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox={`0 0 ${canvasRef.current?.width || 0} ${canvasRef.current?.height || 0}`}>
                {currentPoints.length > 0 && (
                  <polyline points={currentPoints.map(p => `${p.x},${p.y}`).join(' ')} fill={activeTool === 'area' ? 'rgba(245,158,11,0.2)' : 'none'} stroke="#f59e0b" strokeWidth="3" strokeDasharray="8,4" strokeLinecap="round" />
                )}
                {measurements.map(m => (
                  <polyline key={m.id} points={(m.points ?? []).map((p) => `${p.x},${p.y}`).join(' ')} fill={m.type === 'area' ? 'rgba(16,185,129,0.08)' : 'none'} stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm opacity-50" />
                ))}
                {currentPoints.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="6" fill="#f59e0b" className="shadow-2xl animate-in zoom-in duration-200 stroke-black stroke-2" />
                ))}
              </svg>
            </div>
          </div>
        )}
      </div>
      
      {/* 3. DISTINCT BOTTOM INDICATORS */}
      
      {/* BOTTOM LEFT: ENGINE STATUS */}
      <div className="absolute bottom-6 left-6 z-40 pointer-events-none">
        <div className={`backdrop-blur-xl border px-6 py-4 rounded-3xl flex items-center gap-4 shadow-2xl transition-colors
          ${theme === 'dark' ? 'bg-zinc-950/90 border-zinc-800' : 'bg-white/90 border-zinc-200'}`}>
          <div className={`w-3 h-3 rounded-full ${isRendering ? 'bg-amber-500 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.6)]' : pdfDoc ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'bg-zinc-800'}`} />
          <div className="text-left">
            <p className="text-[8px] font-black uppercase text-zinc-500 tracking-[0.3em] leading-none mb-1.5">Engine Status</p>
            <div className="flex items-center gap-2">
               {isRendering && <Loader2 size={12} className="animate-spin text-amber-500" />}
               <p className={`text-[11px] font-black italic uppercase tracking-widest leading-none ${isRendering ? 'text-amber-500' : theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>
                 {isRendering ? 'Refining Vectors...' : pdfDoc ? 'Plan Synchronized' : 'Standby Mode'}
               </p>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM RIGHT: SAVED RECORDS LEDGER */}
      {pdfDoc && (
        <div className="absolute bottom-6 right-6 z-40 pointer-events-none hidden sm:block">
          <div className={`backdrop-blur-xl border px-6 py-4 rounded-3xl flex items-center gap-4 shadow-2xl transition-colors
            ${theme === 'dark' ? 'bg-zinc-950/90 border-zinc-800' : 'bg-white/90 border-zinc-200'}`}>
            <div className="text-right">
              <p className="text-[8px] font-black uppercase text-zinc-500 tracking-[0.3em] leading-none mb-1.5">Vault Ledger</p>
              <div className="flex items-center justify-end gap-2">
                <BadgeCheck size={12} className="text-emerald-500" />
                <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>
                  {measurements.length} Record{measurements.length === 1 ? "" : "s"} Saved
                </span>
              </div>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-full text-emerald-500">
               <ClipboardList size={16} />
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${theme === 'dark' ? '#27272a' : '#d4d4d8'}; border-radius: 20px; border: 2px solid transparent; background-clip: content-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
      `}</style>
    </section>
  );
};

export default BlueprintViewport;