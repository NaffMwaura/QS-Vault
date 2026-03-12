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
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Standard PDF.js configuration for construction drawings
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/* ======================================================
    MODULE RESOLUTION HANDLER
   ====================================================== */

// Default mock for stability in the Canvas environment
let useAuth: any = () => ({
  theme: 'dark',
});

const resolveModules = async () => {
  try {
    const authMod = await import("../../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;
  } catch (e) {
    // Sandbox fallback active
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

/** --- MAIN COMPONENT: BLUEPRINT DRAWING VIEW --- **/

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
  useAuth();
  const [isRendering, setIsRendering] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renderTaskRef = useRef<any>(null);

  /** * DRAWING RENDER ENGINE
   * Renders the PDF drawing onto the HTML canvas with high resolution.
   */
  const renderPage = useCallback(async (pdf: any, pNum: number, zoom: number) => {
    if (!canvasRef.current || !pdf) return;
    
    try {
      setIsRendering(true);
      
      // Cancel existing render tasks to avoid ghosting/flicker
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
        console.error("Blueprint View Error:", err);
      }
    }
  }, []);

  // Update view when zoom or page changes
  useEffect(() => {
    if (pdfDoc) {
      renderPage(pdfDoc, pageNum, scale);
    }
  }, [pdfDoc, pageNum, scale, renderPage]);

  /** * FILE HANDSHAKE
   * Converts a local file upload into a viewable PDF document.
   */
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsRendering(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const typedarray = new Uint8Array(reader.result as ArrayBuffer);
        const loadingTask = pdfjsLib.getDocument(typedarray);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error("File Upload Failed:", err);
    } finally {
      setIsRendering(false);
    }
  };

  const loadSampleBlueprint = async () => {
    // Standard Mozilla demo PDF for previewing takeoff tools
    const sampleUrl = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf';
    try {
      setIsRendering(true);
      const loadingTask = pdfjsLib.getDocument(sampleUrl);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
    } catch (err) {
      console.error("Failed to load sample:", err);
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <section className="flex-1 relative bg-[#09090b] overflow-hidden flex flex-col items-center justify-center border-l border-zinc-800/40">
      
      {/* 1. Viewport Controls (Floating) */}
      <div className="absolute top-6 left-6 flex flex-col gap-2 z-10 bg-zinc-950/90 p-1 rounded-2xl border border-zinc-800 shadow-2xl backdrop-blur-md">
        <button 
          onClick={() => setScale(s => Math.min(s + 0.2, 4))} 
          className="p-3 text-zinc-400 hover:text-amber-500 transition-all active:scale-90"
          title="Zoom In"
        >
          <ZoomIn size={18}/>
        </button>
        <button 
          onClick={() => setScale(s => Math.max(s - 0.2, 0.5))} 
          className="p-3 text-zinc-400 hover:text-amber-500 transition-all active:scale-90"
          title="Zoom Out"
        >
          <ZoomOut size={18}/>
        </button>
        <div className="h-px bg-zinc-800 mx-2 my-1" />
        <button 
          onClick={() => { setIsMeasuring(!isMeasuring); setCurrentPoints([]); }} 
          disabled={!pdfDoc}
          className={`p-3 rounded-xl transition-all shadow-xl active:scale-90 
            ${isMeasuring ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:bg-zinc-800'} 
            ${!pdfDoc ? 'opacity-20 cursor-not-allowed' : ''}`}
          title={isMeasuring ? "Cancel Measurement" : "Start Measurement"}
        >
          <MousePointer2 size={18}/>
        </button>
      </div>

      {/* 2. Drawing Drawing Workspace */}
      <div className="relative shadow-[0_0_100px_rgba(0,0,0,1)] bg-white rounded-sm overflow-auto max-h-full max-w-full custom-scrollbar scroll-smooth">
        {!pdfDoc && (
          <div className="p-10 sm:p-32 text-center bg-zinc-950/50 backdrop-blur-sm rounded-[3rem] border border-zinc-800 flex flex-col items-center gap-8 m-6">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-2xl animate-pulse" />
              <div className="p-10 rounded-full bg-zinc-900 border border-zinc-800 shadow-inner relative">
                <FileSearch size={72} className="text-zinc-700" />
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="font-black uppercase tracking-[0.5em] text-xs text-zinc-500 leading-none">
                  No Drawing Loaded
                </p>
                <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest leading-none">
                  Upload a PDF blueprint to start measuring
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-10 py-5 bg-amber-500 text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-amber-500/20 hover:bg-amber-400 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <Upload size={16} className="stroke-[3px]" /> Upload PDF
                </button>
                <button 
                  onClick={loadSampleBlueprint}
                  className="px-10 py-5 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <Play size={16} /> View Sample
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={onFileChange} 
                accept=".pdf" 
                className="hidden" 
              />
            </div>
          </div>
        )}

        {/* The PDF layer */}
        <canvas 
          ref={canvasRef} 
          onClick={onCanvasClick} 
          className={`cursor-crosshair transition-opacity duration-500 ${isRendering ? 'opacity-40' : 'opacity-100'}`} 
        />
        
        {/* The Measurement Overlay Layer */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none" 
          viewBox={`0 0 ${canvasRef.current?.width || 0} ${canvasRef.current?.height || 0}`}
        >
          {/* Active measurement path (In progress) */}
          {currentPoints.length > 0 && (
            <polyline 
              points={currentPoints.map(p => `${p.x},${p.y}`).join(' ')} 
              fill={activeTool === 'area' ? 'rgba(245,158,11,0.2)' : 'none'} 
              stroke="#f59e0b" 
              strokeWidth="4" 
              strokeDasharray="10,5" 
              strokeLinecap="round" 
            />
          )}

          {/* Past measurements trail (Audit trail) */}
          {measurements.map(m => (
            <polyline 
              key={m.id} 
              points={m.points.map((p: any) => `${p.x},${p.y}`).join(' ')} 
              fill={m.type === 'area' ? 'rgba(16,185,129,0.1)' : 'none'} 
              stroke="#10b981" 
              strokeWidth="4" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="drop-shadow-lg opacity-60" 
            />
          ))}

          {/* Individual Point Markers */}
          {currentPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="5" fill="#f59e0b" className="shadow-lg animate-in zoom-in duration-300" />
          ))}
        </svg>
      </div>
      
      {/* 3. System Status Indicator */}
      <div className="absolute bottom-6 right-6 flex items-center gap-4">
        <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 p-4 rounded-2xl flex items-center gap-4 shadow-2xl">
          <div className="text-right">
            <p className="text-[8px] font-black uppercase text-zinc-500 tracking-widest leading-none mb-1 text-right">System Status</p>
            <p className="text-[10px] font-black text-white italic uppercase tracking-tighter text-right">
              {isRendering ? 'Rendering Drawing...' : pdfDoc ? 'Drawing Ready' : 'Waiting for PDF'}
            </p>
          </div>
          <div className={`w-2 h-2 rounded-full ${isRendering ? 'bg-amber-500 animate-pulse' : pdfDoc ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
        </div>
      </div>
    </section>
  );
};

export default BlueprintViewport;
