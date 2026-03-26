/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  MousePointer2, 
  Play, 
  Upload,
  FileSearch,
  Loader2,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

/** * PDF ENGINE CONFIGURATION
 * We use a standardized worker for high-speed drawing interpretation.
 */
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/* ======================================================
    OFFICE MODULE RESOLUTION
   ====================================================== */

let useAuth: any = () => ({ theme: 'dark' });

const resolveModules = async () => {
  try {
    const authMod = await import("../../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;
  } catch (e) {
    // Sandbox fallback
  }
};

resolveModules();

/** --- TYPES --- **/

interface Point { x: number; y: number; }

interface BlueprintViewportProps {
  pdfDoc: any;
  setPdfDoc: (doc: any) => void;
  pageNum: number;
  scale: number;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  isMeasuring: boolean;
  setIsMeasuring: (val: boolean) => void;
  activeTool: 'length' | 'area' | 'count';
  currentPoints: Point[];
  setCurrentPoints: React.Dispatch<React.SetStateAction<Point[]>>;
  measurements: any[];
  onCanvasClick: (e: React.MouseEvent<HTMLCanvasElement>) => void;
}

/** --- MAIN COMPONENT: DRAWING VISUALIZER --- **/

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
  onCanvasClick
}) => {
  const { theme } = useAuth();
  const [isRendering, setIsRendering] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renderTaskRef = useRef<any>(null);

  /** * RENDERING ENGINE
   * Translates PDF vectors into a high-precision pixel canvas.
   * Includes cancellation logic to prevent "flicker" during rapid zooming.
   */
  const renderPage = useCallback(async (pdf: any, pNum: number, zoom: number) => {
    if (!canvasRef.current || !pdf) return;
    
    try {
      setIsRendering(true);
      
      // Stop any active rendering tasks (Performance Optimization)
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
          canvasContext: context,
          viewport: viewport
        };

        renderTaskRef.current = page.render(renderContext);
        await renderTaskRef.current.promise;
      }
      setIsRendering(false);
    } catch (err: any) {
      if (err.name !== 'RenderingCancelledException') {
        console.error("Viewport Engine: Render failure.", err);
      }
    }
  }, []);

  // Watch for zoom or page changes to trigger a redraw
  useEffect(() => {
    if (pdfDoc) {
      renderPage(pdfDoc, pageNum, scale);
    }
  }, [pdfDoc, pageNum, scale, renderPage]);

  /** * FILE INTAKE
   * Converts local site drawings into viewable project nodes.
   */
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
    // High-contrast sample drawing for tool testing
    const sampleUrl = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf';
    try {
      setIsRendering(true);
      const loadingTask = pdfjsLib.getDocument(sampleUrl);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
    } catch (err) {
      console.warn("Viewport: Sample drawing unreachable.");
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <section className={`flex-1 relative overflow-hidden flex flex-col items-center justify-center transition-colors duration-500
      ${theme === 'dark' ? 'bg-[#09090b]' : 'bg-zinc-200'}`}>
      
      {/* 1. VIEWPORT HUD (Floating Controls) */}
      <div className="absolute top-6 left-6 flex flex-col gap-2 z-30 bg-zinc-950/80 p-1.5 rounded-2xl border border-zinc-800 shadow-2xl backdrop-blur-xl">
        <button 
          onClick={() => setScale(s => Math.min(s + 0.25, 5))} 
          className="p-3 text-zinc-400 hover:text-amber-500 transition-all active:scale-90"
          title="Increase Scale"
        >
          <ZoomIn size={20}/>
        </button>
        <button 
          onClick={() => setScale(s => Math.max(s - 0.25, 0.25))} 
          className="p-3 text-zinc-400 hover:text-amber-500 transition-all active:scale-90"
          title="Decrease Scale"
        >
          <ZoomOut size={20}/>
        </button>
        <div className="h-px bg-zinc-800 mx-2 my-1" />
        <button 
          onClick={() => { setIsMeasuring(!isMeasuring); setCurrentPoints([]); }} 
          disabled={!pdfDoc}
          className={`p-3 rounded-xl transition-all shadow-xl active:scale-90 
            ${isMeasuring ? 'bg-amber-500 text-black shadow-amber-500/20' : 'text-zinc-500 hover:bg-zinc-800'} 
            ${!pdfDoc ? 'opacity-20 cursor-not-allowed' : ''}`}
          title={isMeasuring ? "Cancel Measurement" : "Initialize Tool"}
        >
          <MousePointer2 size={20}/>
        </button>
      </div>

      {/* 2. MAIN DRAWING WORKSPACE */}
      <div className="relative shadow-[0_0_80px_rgba(0,0,0,0.6)] bg-white rounded-sm overflow-auto max-h-full max-w-full custom-scrollbar scroll-smooth">
        {!pdfDoc ? (
          <div className="p-10 sm:p-24 text-center bg-zinc-950/50 backdrop-blur-md rounded-[3rem] border border-zinc-800 flex flex-col items-center gap-8 m-10">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
              <div className="p-12 rounded-full bg-zinc-900 border border-zinc-800 shadow-inner relative">
                <FileSearch size={64} className="text-zinc-700" />
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="font-black uppercase tracking-[0.5em] text-[10px] text-zinc-500 leading-none">
                  Blueprint Node Offline
                </p>
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">
                  Drawing Required for Takeoff
                </h3>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-10 py-5 bg-amber-500 text-black rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 hover:bg-amber-400 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <Upload size={16} className="stroke-[3px]" /> Load PDF Drawing
                </button>
                <button 
                  onClick={loadSampleBlueprint}
                  className="px-10 py-5 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <Play size={16} /> Use Practice Node
                </button>
              </div>
              <input type="file" ref={fileInputRef} onChange={onFileChange} accept=".pdf" className="hidden" />
            </div>
          </div>
        ) : (
          <div className="relative flex items-center justify-center">
            {/* The Precision Canvas Layer */}
            <canvas 
              ref={canvasRef} 
              onClick={onCanvasClick} 
              className={`cursor-crosshair transition-opacity duration-300 ${isRendering ? 'opacity-30' : 'opacity-100'}`} 
            />
            
            {/* The SVG Measurement Overlay Layer (Audit Trail) */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none z-10" 
              viewBox={`0 0 ${canvasRef.current?.width || 0} ${canvasRef.current?.height || 0}`}
            >
              {/* CURRENT ACTIVE PATH (The drawing line) */}
              {currentPoints.length > 0 && (
                <polyline 
                  points={currentPoints.map(p => `${p.x},${p.y}`).join(' ')} 
                  fill={activeTool === 'area' ? 'rgba(245,158,11,0.2)' : 'none'} 
                  stroke="#f59e0b" 
                  strokeWidth="3" 
                  strokeDasharray="8,4" 
                  strokeLinecap="round" 
                />
              )}

              {/* ARCHIVED MEASUREMENTS (Existing project data) */}
              {measurements.map(m => (
                <polyline 
                  key={m.id} 
                  points={m.points.map((p: any) => `${p.x},${p.y}`).join(' ')} 
                  fill={m.type === 'area' ? 'rgba(16,185,129,0.08)' : 'none'} 
                  stroke="#10b981" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="drop-shadow-sm opacity-50" 
                />
              ))}

              {/* ACTIVE NODES (Current points being clicked) */}
              {currentPoints.map((p, i) => (
                <circle 
                  key={i} 
                  cx={p.x} 
                  cy={p.y} 
                  r="6" 
                  fill="#f59e0b" 
                  className="shadow-2xl animate-in zoom-in duration-200 stroke-black stroke-2" 
                />
              ))}
            </svg>
          </div>
        )}
      </div>
      
      {/* 3. SYSTEM STATUS INDICATOR */}
      <div className="absolute bottom-8 right-8 z-30">
        <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-2xl">
          <div className="text-right">
            <p className="text-[8px] font-black uppercase text-zinc-500 tracking-[0.25em] leading-none mb-1.5">Precision Monitor</p>
            <div className="flex items-center gap-2 justify-end">
               {isRendering && <Loader2 size={10} className="animate-spin text-amber-500" />}
               <p className={`text-[10px] font-black italic uppercase tracking-widest leading-none ${isRendering ? 'text-amber-500' : 'text-zinc-200'}`}>
                 {isRendering ? 'Refining Vectors...' : pdfDoc ? 'Drawing Synchronized' : 'Standby Mode'}
               </p>
            </div>
          </div>
          <div className={`w-2.5 h-2.5 rounded-full ${isRendering ? 'bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]' : pdfDoc ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 20px; border: 2px solid transparent; background-clip: content-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
      `}</style>
    </section>
  );
};

export default BlueprintViewport;
