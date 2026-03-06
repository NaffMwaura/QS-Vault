/* eslint-disable prefer-const */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Ruler, Calculator, Save, 
  FileText, ZoomIn, ZoomOut, Trash2, 
  ChevronRight, Download, Settings, 
  ChevronLeft, Upload, MousePointer2,
  Table as Layers, Info, CheckSquare,
  Maximize2, Loader2
} from 'lucide-react';

// Use standard PDF.js ESM distribution
import * as pdfjsLib from 'pdfjs-dist';
// Set up the worker for PDF.js performance
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/** --- TYPES & INTERFACES (Aligned with QS 001 Manual) --- **/

interface Point { x: number; y: number; }

type MeasurementType = 'length' | 'area' | 'count';

interface Measurement {
  id: string;
  label: string;
  type: MeasurementType;
  value: number; // Stored in real-world units (meters, m2, or nr)
  points: Point[]; // Stored in PDF document coordinate space
  sectionCode: string; // e.g., 'C20'
}

interface BoQItem {
  id: string;
  code: string;
  section: string; // e.g., 'C - Excavations'
  description: string;
  unit: 'm' | 'm2' | 'm3' | 'nr' | 'kg';
  qty: number;
  rate: number;
}

/* ============================================================== */
/* MODULE RESOLUTION HANDLERS (SANDBOX COMPATIBILITY)            */
/* ============================================================== */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let useAuth: any = () => ({ theme: 'dark', isOnline: true });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any = { projects: { get: async (id: string) => ({ id, name: "New Project Node", location: "Nairobi, KE" }) } };

const resolveModules = async () => {
  try {
    const authMod = await import("../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;
    const dbMod = await import("../../lib/database/database");
    if (dbMod.db) db = dbMod.db;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    console.warn("Vault Takeoff: Service handshake pending...");
  }
};

resolveModules();

/** --- MAIN PROJECT DETAIL / TAKEOFF ENGINE --- **/

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useAuth();
  
  // --- State: Project & Navigation ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [project, setProject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'takeoff' | 'boq' | 'docs'>('takeoff');
  const [activeSection, setActiveSection] = useState('C - Excavations');
  const [activeTool, setActiveTool] = useState<MeasurementType>('length');
  
  // --- State: PDF Rendering ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [isRendering, setIsRendering] = useState(false);
  
  // --- State: Measurement & BoQ ---
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [isMeasuring, setIsMeasuring] = useState(false);
  
  // BoQ Items initialized based on common SMM sections (Manual Annexure A)
  const [boqItems, setBoqItems] = useState<BoQItem[]>([
    { id: '1', code: 'C10', section: 'C - Excavations', description: 'Excavation to reduce levels not exceeding 2.0m deep', unit: 'm3', qty: 0, rate: 450 },
    { id: '2', code: 'D20', section: 'D - Concrete Work', description: 'In-situ concrete grade 25/20 in foundations', unit: 'm3', qty: 0, rate: 12500 },
    { id: '3', code: 'F10', section: 'F - Walling', description: '200mm Thick natural stone walling in cement sand mortar', unit: 'm2', qty: 0, rate: 1850 },
  ]);

  // Calibration: Pixels per meter (Standard 1:100 scale simulation)
  const [calibrationFactor] = useState(28.35); 
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTaskRef = useRef<any>(null);

  // --- PDF Rendering Logic ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderPage = useCallback(async (pdf: any, pNum: number, zoom: number) => {
    if (!canvasRef.current || !pdf) return;

    try {
      setIsRendering(true);
      if (renderTaskRef.current) renderTaskRef.current.cancel();

      const page = await pdf.getPage(pNum);
      const viewport = page.getViewport({ scale: zoom });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const renderContext = { canvasContext: context, viewport: viewport };
        renderTaskRef.current = page.render(renderContext);
        await renderTaskRef.current.promise;
      }
      setIsRendering(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.name !== 'RenderingCancelledException') console.error("PDF Render Error:", err);
    }
  }, []);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const typedarray = new Uint8Array(reader.result as ArrayBuffer);
      const loadingTask = pdfjsLib.getDocument(typedarray);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
      setPageNum(1);
    };
    reader.readAsArrayBuffer(file);
  };

  useEffect(() => {
    if (pdfDoc) renderPage(pdfDoc, pageNum, scale);
  }, [pdfDoc, pageNum, scale, renderPage]);

  // --- Takeoff Computation Logic ---
  const calculateMeasurementValue = (points: Point[]): number => {
    if (points.length < 2) return 0;

    if (activeTool === 'length') {
      const p1 = points[0];
      const p2 = points[points.length - 1];
      const pixelDist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      return (pixelDist / scale) / calibrationFactor;
    }

    if (activeTool === 'area' && points.length > 2) {
      // Shoelace formula for polygon area
      let area = 0;
      for (let i = 0; i < points.length; i++) {
        let j = (i + 1) % points.length;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
      }
      const pixelArea = Math.abs(area) / 2;
      return (pixelArea / Math.pow(scale, 2)) / Math.pow(calibrationFactor, 2);
    }

    if (activeTool === 'count') return points.length;
    
    return 0;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMeasuring || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentPoints([...currentPoints, { x, y }]);
  };

  const completeMeasurement = () => {
    const val = calculateMeasurementValue(currentPoints);
    const newM: Measurement = {
      id: window.crypto?.randomUUID() || Math.random().toString(36).substr(2, 9),
      label: `${activeSection.split(' - ')[1]} (${activeTool})`,
      type: activeTool,
      value: parseFloat(val.toFixed(2)),
      points: currentPoints,
      sectionCode: activeSection
    };

    setMeasurements([...measurements, newM]);
    
    // Auto-update BoQ Item Quantity (Simulating link between Takeoff and Bill)
    const targetCode = activeSection.includes('Excavations') ? 'C10' : activeSection.includes('Concrete') ? 'D20' : 'F10';
    setBoqItems(items => items.map(item => 
      item.code === targetCode ? { ...item, qty: item.qty + val } : item
    ));

    setCurrentPoints([]);
    setIsMeasuring(false);
  };

  // --- Analytics ---
  const boqTotal = useMemo(() => 
    boqItems.reduce((acc, cur) => acc + (cur.qty * cur.rate), 0),
  [boqItems]);

  useEffect(() => {
    const fetchProject = async () => {
      const data = await db.projects.get(id);
      setProject(data);
    };
    if (id) fetchProject();
  }, [id]);

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500
      ${theme === 'dark' ? 'bg-[#09090b] text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
      
      {/* 1. ARCHITECTURAL HEADER */}
      <header className={`p-4 border-b flex items-center justify-between backdrop-blur-md sticky top-0 z-50
        ${theme === 'dark' ? 'bg-zinc-950/80 border-zinc-800/40' : 'bg-white/80 border-zinc-200'}`}>
        
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/dashboard')} className="p-3 hover:bg-amber-500/10 rounded-2xl transition-colors text-amber-500 group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tighter italic leading-none flex items-center gap-2">
              {project?.name || 'Initializing Vault Node'}
              {isRendering && <Loader2 size={12} className="animate-spin text-amber-500" />}
            </h1>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mt-1">
              {project?.location || 'Coordinate Sync Pending'} / REF: {id?.slice(0,8)}
            </p>
          </div>
        </div>

        <nav className="hidden lg:flex bg-zinc-500/5 p-1 rounded-2xl border border-zinc-500/10">
          {(['takeoff', 'boq', 'docs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                ${activeTab === tab ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-500 hover:text-amber-500'}`}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-500/5 border border-zinc-500/10 text-zinc-500 font-black uppercase text-[10px] tracking-widest hover:border-amber-500/30 cursor-pointer transition-all">
            <Upload size={14} /> Upload Blueprint
            <input type="file" accept=".pdf" className="hidden" onChange={onFileChange} />
          </label>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black font-black uppercase text-[10px] tracking-widest shadow-xl shadow-amber-500/20 hover:bg-amber-400 transition-all">
            <Save size={14} /> Commit Changes
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* LEFT: WORK SECTION CONTROL (Manual Section 12) */}
        <aside className={`w-80 border-r hidden lg:flex flex-col p-6 space-y-6 overflow-y-auto
          ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800/40' : 'bg-white border-zinc-200'}`}>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">SMM Work Section</label>
              <div className="relative group">
                <select 
                  value={activeSection}
                  onChange={(e) => setActiveSection(e.target.value)}
                  className={`w-full p-4 rounded-2xl border outline-none font-bold text-xs appearance-none transition-all cursor-pointer
                  ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                  <option>A - Preliminaries</option>
                  <option>C - Excavations</option>
                  <option>D - Concrete Work</option>
                  <option>F - Walling</option>
                </select>
                <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            {/* Measurement Tools */}
            <div className="grid grid-cols-3 gap-2">
               {(['length', 'area', 'count'] as const).map(tool => (
                 <button 
                  key={tool}
                  onClick={() => setActiveTool(tool)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all
                    ${activeTool === tool ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-zinc-500/5 border-zinc-500/10 text-zinc-500 hover:border-amber-500/30'}`}
                 >
                   {tool === 'length' && <Ruler size={14} />}
                   {tool === 'area' && <Maximize2 size={14} />}
                   {tool === 'count' && <CheckSquare size={14} />}
                   <span className="text-[8px] font-black uppercase tracking-widest">{tool}</span>
                 </button>
               ))}
            </div>
          </div>

          <div className="flex-1 space-y-4 pt-4 border-t border-zinc-800/20">
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center justify-between">
                Registry Stream
                <span className="bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded text-[8px]">{measurements.length}</span>
             </h3>
             <div className="space-y-2">
                {measurements.map(m => (
                  <div key={m.id} className={`p-4 rounded-2xl border flex justify-between items-center group animate-in slide-in-from-left-4
                    ${theme === 'dark' ? 'bg-white/5 border-zinc-800/40' : 'bg-zinc-100 border-zinc-200'}`}>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-tight text-zinc-500 leading-none mb-1">{m.label}</p>
                      <p className="text-lg font-black text-amber-500 leading-none">
                        {m.value}{m.type === 'length' ? 'm' : m.type === 'area' ? 'm²' : 'nr'}
                      </p>
                    </div>
                    <button onClick={() => setMeasurements(prev => prev.filter(x => x.id !== m.id))} className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-500 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {measurements.length === 0 && (
                  <div className="py-12 text-center opacity-20 border-2 border-dashed border-zinc-500/20 rounded-4xl">
                    <Layers size={32} className="mx-auto mb-2" />
                    <p className="text-[8px] font-black uppercase tracking-widest">Awaiting Input</p>
                  </div>
                )}
             </div>
          </div>
        </aside>

        {/* CENTER: THE TECHNICAL CANVAS (Manual Section 10) */}
        <section className="flex-1 relative bg-zinc-200 dark:bg-[#050505] overflow-hidden flex flex-col">
          
          {/* HUD Overlay */}
          <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
            <div className="bg-zinc-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-zinc-800/40 p-1 flex flex-col">
                <button onClick={() => setScale(s => Math.min(s + 0.25, 4))} className="p-3 text-zinc-400 hover:text-amber-500 transition-all rounded-xl"><ZoomIn size={18}/></button>
                <div className="h-px w-full bg-zinc-800/40" />
                <button onClick={() => setScale(s => Math.max(s - 0.25, 0.5))} className="p-3 text-zinc-400 hover:text-amber-500 transition-all rounded-xl"><ZoomOut size={18}/></button>
            </div>

            <div className="bg-zinc-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-zinc-800/40 p-1 mt-2">
                <button 
                  onClick={() => { setIsMeasuring(!isMeasuring); setCurrentPoints([]); }}
                  className={`p-3 rounded-xl transition-all
                    ${isMeasuring ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-400 hover:text-amber-500'}`}
                >
                  <MousePointer2 size={18}/>
                </button>
            </div>
          </div>

          {/* Navigation Overlay */}
          {numPages > 0 && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 p-2 rounded-2xl flex items-center gap-4">
                <button onClick={() => setPageNum(p => Math.max(1, p - 1))} className="p-2 text-zinc-400 hover:text-amber-500 disabled:opacity-20" disabled={pageNum <= 1}><ChevronLeft size={16}/></button>
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Page {pageNum} <span className="opacity-40">/ {numPages}</span></span>
                <button onClick={() => setPageNum(p => Math.min(numPages, p + 1))} className="p-2 text-zinc-400 hover:text-amber-500 disabled:opacity-20" disabled={pageNum >= numPages}><ChevronRight size={16}/></button>
            </div>
          )}

          {/* THE ENGINE VIEWPORT */}
          <div className="flex-1 overflow-auto p-12 flex justify-center custom-scrollbar">
            <div className="relative shadow-[0_0_100px_rgba(0,0,0,0.6)] bg-white rounded-sm h-fit">
              {!pdfDoc && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-zinc-700 gap-6 p-20 text-center">
                    <FileText size={80} className="opacity-10 animate-pulse" />
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-amber-500/50">QS VAULT CORE</p>
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 leading-relaxed">Load architectural blueprint<br/>to initialize measurement node</p>
                    </div>
                 </div>
              )}
              
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className={`cursor-crosshair transition-opacity duration-300 ${isRendering ? 'opacity-30' : 'opacity-100'}`}
              />

              {/* High-Fidelity SVG Trace Overlay */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none"
                // eslint-disable-next-line react-hooks/refs
                viewBox={`0 0 ${canvasRef.current?.width || 0} ${canvasRef.current?.height || 0}`}
              >
                {/* Active Trace */}
                {currentPoints.length > 0 && (
                  <>
                    <polyline
                      points={currentPoints.map(p => `${p.x},${p.y}`).join(' ')}
                      fill={activeTool === 'area' ? 'rgba(245,158,11,0.2)' : 'none'}
                      stroke="#f59e0b"
                      strokeWidth="3"
                      strokeDasharray="8,4"
                    />
                    {currentPoints.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r="4" fill="#f59e0b" />
                    ))}
                  </>
                )}
                
                {/* Committed Measurements */}
                {measurements.map(m => (
                   <polyline
                    key={m.id}
                    points={m.points.map(p => `${p.x},${p.y}`).join(' ')}
                    fill={m.type === 'area' ? 'rgba(16,185,129,0.1)' : 'none'}
                    stroke="#10b981"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </svg>

              {isMeasuring && currentPoints.length > 0 && (
                 <button 
                  onClick={(e) => { e.stopPropagation(); completeMeasurement(); }}
                  className="absolute z-40 bg-amber-500 text-black px-10 py-4 rounded-full font-black text-[11px] uppercase tracking-widest shadow-2xl bottom-12 left-1/2 -translate-x-1/2 hover:bg-amber-400 active:scale-95 transition-all flex items-center gap-3"
                 >
                   <Calculator size={16} /> Confirm Dimension
                 </button>
              )}
            </div>
          </div>

          {/* Telemetry Bar (Manual Section 15 Data Points) */}
          <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex justify-between items-center px-10">
             <div className="flex items-center gap-8">
                <div>
                   <p className="text-[8px] font-black uppercase text-zinc-600 tracking-widest">Scale Context</p>
                   <p className="text-[10px] font-black text-zinc-300 italic uppercase">1:100 @ A3 SMM-Kenya</p>
                </div>
                <div className="h-6 w-px bg-zinc-800" />
                <div>
                   <p className="text-[8px] font-black uppercase text-zinc-600 tracking-widest">Active Tool</p>
                   <p className="text-[10px] font-black text-amber-500 italic uppercase leading-none">{activeTool} Capture Mode</p>
                </div>
             </div>
             <div className="flex items-center gap-6 text-zinc-600">
                <Info size={14} className="hover:text-amber-500 transition-colors cursor-help" />
                <Settings size={14} className="hover:text-amber-500 transition-colors cursor-pointer" />
             </div>
          </div>
        </section>

        {/* RIGHT: ELEMENTAL SUMMARY PANEL (Manual Annexure A) */}
        <aside className={`w-112.5 border-l hidden xl:flex flex-col p-8 space-y-8
          ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800/40' : 'bg-white border-zinc-200'}`}>
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Bill Summary<span className="text-amber-500">.</span></h3>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500 mt-2">Precision Valuation Node</p>
            </div>
            <button className="p-3 bg-amber-500/10 rounded-xl text-amber-500 hover:bg-amber-500 hover:text-black transition-all">
              <Download size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
             {boqItems.map(item => (
               <div key={item.id} className={`p-6 rounded-4xl border transition-all hover:border-amber-500/30 group
                 ${theme === 'dark' ? 'bg-zinc-900/30 border-zinc-800/60 shadow-black/20' : 'bg-zinc-50 border-zinc-100 shadow-sm'}`}>
                 <div className="flex justify-between mb-4">
                   <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[9px] font-black text-amber-500 uppercase tracking-widest">{item.code}</span>
                   <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{item.unit}</span>
                 </div>
                 <h4 className="text-xs font-black leading-relaxed mb-6 uppercase tracking-tight text-zinc-400 group-hover:text-zinc-100 transition-colors">{item.description}</h4>
                 
                 <div className="flex justify-between items-end border-t border-zinc-800/40 pt-4">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black uppercase text-zinc-600 tracking-[0.2em]">Quantity</p>
                      <p className="text-2xl font-black tracking-tighter">{item.qty.toFixed(3)}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[8px] font-black uppercase text-zinc-600 tracking-[0.2em]">Net Amount</p>
                      <p className="text-sm font-black text-amber-500 uppercase tracking-tighter">KES {(item.qty * item.rate).toLocaleString()}</p>
                    </div>
                 </div>
               </div>
             ))}
          </div>

          {/* TOTAL CARRIED TO FORM OF OFFER (Manual Section 12.1.5) */}
          <div className={`p-8 rounded-[2.5rem] border bg-amber-500 text-black border-amber-400 shadow-[0_20px_50px_rgba(245,158,11,0.15)] relative overflow-hidden`}>
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Calculator size={80} />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-1">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Elemental Estimate Total</p>
              </div>
              <p className="text-4xl font-black tracking-tighter italic">KES {boqTotal.toLocaleString()}</p>
              <div className="mt-4 pt-4 border-t border-black/10 flex justify-between">
                <span className="text-[8px] font-black uppercase tracking-widest opacity-60 italic">Manual QS 001 Compliant</span>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-60">GMI Systems</span>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
      `}</style>
    </div>
  );
};

export default ProjectDetailPage;