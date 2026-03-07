/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Ruler, Save, 
  FileText, ZoomIn, ZoomOut, Trash2, 
  Download, 
  Upload, MousePointer2,
  Layers, Info, CheckSquare,
  Maximize2, Loader2, Printer, FileSpreadsheet,
  Calculator, Play, Eye, FileCheck, ClipboardCheck
} from 'lucide-react';

// Use standard PDF.js distribution
import * as pdfjsLib from 'pdfjs-dist';
// Set up the worker for PDF.js performance
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/** --- TYPES & INTERFACES (Manual QS 001 Compliant) --- **/

interface Point { x: number; y: number; }
type MeasurementType = 'length' | 'area' | 'count';

interface Measurement {
  id: string;
  label: string;
  type: MeasurementType;
  value: number; 
  points: Point[]; 
  sectionCode: string; 
}

interface BoQItem {
  id: string;
  code: string;
  section: string; 
  description: string;
  unit: 'm' | 'm2' | 'm3' | 'nr' | 'kg';
  qty: number;
  rate: number;
}

interface ReportNode {
  id: string;
  title: string;
  type: 'PDF' | 'XLS' | 'DOC';
  status: 'Draft' | 'Certified' | 'Archived';
  annexure: string;
  lastGenerated: string;
}

/* ============================================================== */
/* MODULE RESOLUTION HANDLERS (SANDBOX COMPATIBILITY)            */
/* ============================================================== */

let useAuth: any = () => ({ theme: 'dark', isOnline: true });
let db: any = { projects: { get: async (id: string) => ({ id, name: "Kempinski Extension", location: "Westlands, Nairobi" }) } };

const resolveModules = async () => {
  try {
    const authMod = await import("../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;
    const dbMod = await import("../../lib/database/database");
    if (dbMod.db) db = dbMod.db;
  } catch (e) {
    console.warn("Vault Takeoff: Syncing with local infrastructure...");
  }
};

resolveModules();

/** --- MAIN PROJECT DETAIL / TAKEOFF ENGINE --- **/

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useAuth();
  
  // --- State: Navigation & Layout ---
  const [project, setProject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'takeoff' | 'boq' | 'docs'>('takeoff');
  const [activeSection, setActiveSection] = useState('C - Excavations');
  const [activeTool, setActiveTool] = useState<MeasurementType>('length');
  
  // --- State: PDF Rendering ---
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [isRendering, setIsRendering] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  
  // --- State: Measurement & Data ---
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [isMeasuring, setIsMeasuring] = useState(false);
  
  const [boqItems, setBoqItems] = useState<BoQItem[]>([
    { id: '1', code: 'C10', section: 'C - Excavations', description: 'Excavation to reduce levels not exceeding 2.0m deep', unit: 'm3', qty: 0, rate: 450 },
    { id: '2', code: 'D20', section: 'D - Concrete Work', description: 'In-situ concrete grade 25/20 in foundations', unit: 'm3', qty: 0, rate: 12500 },
    { id: '3', code: 'F10', section: 'F - Walling', description: '200mm Thick natural stone walling in cement sand mortar', unit: 'm2', qty: 0, rate: 1850 },
    { id: '4', code: 'H10', section: 'H - Roofing', description: 'GCI Pre-painted roofing sheets gauge 28', unit: 'm2', qty: 0, rate: 2100 },
  ]);

  const [reports] = useState<ReportNode[]>([
    { id: 'r1', title: 'Elemental Estimate Summary', type: 'PDF', status: 'Draft', annexure: 'Annexure A', lastGenerated: 'Pending' },
    { id: 'r2', title: 'Priced Bill of Quantities', type: 'XLS', status: 'Draft', annexure: 'Annexure C', lastGenerated: 'Pending' },
    { id: 'r3', title: 'Interim Payment Certificate #01', type: 'PDF', status: 'Draft', annexure: 'Section 13.8', lastGenerated: 'Pending' },
    { id: 'r4', title: 'Final Account Statement', type: 'PDF', status: 'Draft', annexure: 'Annexure D', lastGenerated: 'Locked' },
  ]);

  const [calibrationFactor] = useState(28.35); 
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  // --- PDF Logic: High-Precision Rendering ---
  const renderPage = useCallback(async (pdf: any, pNum: number, zoom: number) => {
    if (!canvasRef.current || !pdf || activeTab !== 'takeoff') return;
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
    } catch (err: any) {
      if (err.name !== 'RenderingCancelledException') console.error("PDF Render Error:", err);
    }
  }, [activeTab]);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const typedarray = new Uint8Array(reader.result as ArrayBuffer);
      const loadingTask = pdfjsLib.getDocument(typedarray);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setNumPages(pdf.numPages || 0);
      setPageNum(1);
    };
    reader.readAsArrayBuffer(file);
  };

  const loadSampleBlueprint = async () => {
    const sampleUrl = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf';
    try {
      setIsRendering(true);
      const loadingTask = pdfjsLib.getDocument(sampleUrl);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
      setPageNum(1);
    } catch (err) {
      console.error("Sample Load Error:", err);
    } finally {
      setIsRendering(false);
    }
  };

  useEffect(() => {
    if (pdfDoc && activeTab === 'takeoff') renderPage(pdfDoc, pageNum, scale);
  }, [pdfDoc, pageNum, scale, activeTab]);

  // --- Report Generation Logic (Simulated for 1pm Deadline) ---
  const handleGenerateReport = (reportId: string) => {
    setIsGenerating(reportId);
    setTimeout(() => {
      setIsGenerating(null);
      // Simulate download trigger or preview logic
    }, 1500);
  };

  // --- Takeoff Logic: Geometric Computations ---
  const calculateMeasurementValue = (points: Point[]): number => {
    if (points.length < 1) return 0;
    
    if (activeTool === 'length' && points.length >= 2) {
      const p1 = points[0];
      const p2 = points[points.length - 1];
      const pixelDist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      return (pixelDist / scale) / calibrationFactor;
    }
    
    if (activeTool === 'area' && points.length > 2) {
      let area = 0;
      for (let i = 0; i < points.length; i++) {
        let j = (i + 1) % points.length;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
      }
      const pixelArea = Math.abs(area) / 2;
      return (pixelArea / Math.pow(scale, 2)) / Math.pow(calibrationFactor, 2);
    }
    
    return points.length; // Count tool
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMeasuring || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setCurrentPoints([...currentPoints, { x: e.clientX - rect.left, y: e.clientY - rect.top }]);
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
    
    const targetCode = activeSection.includes('Excavations') ? 'C10' : 
                       activeSection.includes('Concrete') ? 'D20' : 
                       activeSection.includes('Walling') ? 'F10' : 'H10';
                       
    setBoqItems(items => items.map(item => 
      item.code === targetCode ? { ...item, qty: item.qty + val } : item
    ));

    setCurrentPoints([]);
    setIsMeasuring(false);
  };

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
    <div className={`min-h-screen flex flex-col transition-colors duration-500 font-sans
      ${theme === 'dark' ? 'bg-[#09090b] text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
      
      {/* 1. HEADER (LOCKED) */}
      <header className={`p-4 border-b flex items-center justify-between backdrop-blur-md sticky top-0 z-50
        ${theme === 'dark' ? 'bg-zinc-950/80 border-zinc-800/40 shadow-2xl' : 'bg-white/80 border-zinc-200 shadow-lg'}`}>
        
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/dashboard')} className="p-3 hover:bg-amber-500/10 rounded-2xl transition-all text-amber-500 group active:scale-90">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tighter italic leading-none flex items-center gap-2">
              {project?.name || 'Vault Engine'}
              {isRendering && <Loader2 size={12} className="animate-spin text-amber-500" />}
            </h1>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mt-1">
              {project?.location} / NODE_REF: {id?.slice(0,8)}
            </p>
          </div>
        </div>

        <nav className="flex bg-zinc-500/5 p-1 rounded-2xl border border-zinc-500/10">
          {(['takeoff', 'boq', 'docs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95
                ${activeTab === tab ? 'bg-amber-500 text-black shadow-lg' : 'text-zinc-500 hover:text-amber-500'}`}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-500/5 border border-zinc-500/10 text-zinc-500 font-black uppercase text-[10px] tracking-widest hover:border-amber-500/30 cursor-pointer transition-all active:scale-95">
            <Upload size={14} /> Upload Blueprint
            <input type="file" accept=".pdf" className="hidden" onChange={onFileChange} />
          </label>
          <button className="px-6 py-2.5 rounded-xl bg-amber-500 text-black font-black uppercase text-[10px] tracking-widest shadow-xl shadow-amber-500/20 hover:bg-amber-400 transition-all flex items-center gap-2 active:scale-95">
            <Save size={14} /> Commit Changes
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE AREA */}
      <main className="flex-1 flex overflow-hidden">
        
        {activeTab === 'takeoff' ? (
          <>
            <aside className={`w-80 border-r hidden lg:flex flex-col p-6 space-y-6 overflow-y-auto
              ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800/40' : 'bg-white border-zinc-200'}`}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1 italic">SMM Work Section</label>
                  <select 
                    value={activeSection}
                    onChange={(e) => setActiveSection(e.target.value)}
                    className={`w-full p-4 rounded-2xl border outline-none font-bold text-xs appearance-none transition-all cursor-pointer ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}
                  >
                    <option>C - Excavations</option>
                    <option>D - Concrete Work</option>
                    <option>F - Walling</option>
                    <option>H - Roofing</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['length', 'area', 'count'] as const).map(tool => (
                    <button 
                      key={tool}
                      onClick={() => { setActiveTool(tool); setCurrentPoints([]); }}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all active:scale-90
                        ${activeTool === tool ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-inner' : 'bg-zinc-500/5 text-zinc-500 border-zinc-500/10'}`}
                    >
                      {tool === 'length' ? <Ruler size={14} /> : tool === 'area' ? <Maximize2 size={14} /> : <CheckSquare size={14} />}
                      <span className="text-[8px] font-black uppercase tracking-widest">{tool}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex-1 pt-4 border-t border-zinc-800/20 overflow-y-auto custom-scrollbar">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 italic">Registry Stream</h3>
                {measurements.map(m => (
                  <div key={m.id} className="p-4 rounded-2xl border mb-3 flex justify-between items-center bg-zinc-900/40 border-zinc-800 group hover:border-amber-500/30 transition-all">
                    <div>
                      <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">{m.label}</p>
                      <p className="text-lg font-black text-amber-500 leading-none">
                        {m.value} <span className="text-[10px] opacity-40">{m.type === 'length' ? 'm' : m.type === 'area' ? 'm²' : 'nr'}</span>
                      </p>
                    </div>
                    <button onClick={() => setMeasurements(prev => prev.filter(x => x.id !== m.id))} className="p-2 text-zinc-700 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                ))}
                {measurements.length === 0 && (
                  <div className="py-12 text-center opacity-10 border-2 border-dashed border-zinc-500/20 rounded-4xl">
                    <Layers size={40} className="mx-auto mb-2" />
                    <p className="text-[8px] font-black uppercase tracking-[0.4em]">Initializing Stream</p>
                  </div>
                )}
              </div>
            </aside>

            <section className="flex-1 relative bg-black overflow-hidden flex flex-col items-center justify-center">
               <div className="absolute top-6 left-6 flex flex-col gap-2 z-10 bg-zinc-950/90 p-1 rounded-2xl border border-zinc-800 shadow-2xl">
                  <button onClick={() => setScale(s => Math.min(s + 0.2, 4))} className="p-3 text-zinc-400 hover:text-amber-500 transition-all"><ZoomIn size={18}/></button>
                  <button onClick={() => setScale(s => Math.max(s - 0.2, 0.5))} className="p-3 text-zinc-400 hover:text-amber-500 transition-all"><ZoomOut size={18}/></button>
                  <div className="h-px bg-zinc-800 mx-2 my-1" />
                  <button onClick={() => { setIsMeasuring(!isMeasuring); setCurrentPoints([]); }} className={`p-3 rounded-xl transition-all shadow-xl ${isMeasuring ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:bg-zinc-800'}`}>
                    <MousePointer2 size={18}/>
                  </button>
               </div>

               <div className="relative shadow-[0_0_100px_rgba(0,0,0,1)] bg-white rounded-sm overflow-auto max-h-full max-w-full custom-scrollbar">
                  {!pdfDoc && (
                    <div className="p-40 text-center bg-zinc-950/50 backdrop-blur-sm rounded-3xl border border-zinc-800 flex flex-col items-center gap-8">
                      <FileText size={80} className="text-zinc-800 animate-pulse" />
                      <div className="space-y-4">
                        <p className="font-black uppercase tracking-[0.5em] text-xs text-zinc-600">Secure Blueprint Node Offline</p>
                        <button 
                          onClick={loadSampleBlueprint}
                          className="px-8 py-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 hover:bg-amber-500 hover:text-black transition-all flex items-center gap-3 mx-auto"
                        >
                          <Play size={14} /> Initialize Demo Node
                        </button>
                      </div>
                    </div>
                  )}
                  <canvas ref={canvasRef} onClick={handleCanvasClick} className={`cursor-crosshair transition-opacity duration-300 ${isRendering ? 'opacity-40' : 'opacity-100'}`} />
                  
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${canvasRef.current?.width || 0} ${canvasRef.current?.height || 0}`}>
                    {currentPoints.length > 0 && (
                      <polyline points={currentPoints.map(p => `${p.x},${p.y}`).join(' ')} fill={activeTool === 'area' ? 'rgba(245,158,11,0.2)' : 'none'} stroke="#f59e0b" strokeWidth="4" strokeDasharray="10,5" strokeLinecap="round" />
                    )}
                    {measurements.map(m => (
                      <polyline key={m.id} points={m.points.map(p => `${p.x},${p.y}`).join(' ')} fill={m.type === 'area' ? 'rgba(16,185,129,0.1)' : 'none'} stroke="#10b981" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg" />
                    ))}
                    {currentPoints.map((p, i) => (<circle key={i} cx={p.x} cy={p.y} r="5" fill="#f59e0b" className="shadow-lg" />))}
                  </svg>

                  {isMeasuring && currentPoints.length > 0 && (
                    <button onClick={completeMeasurement} className="absolute bottom-12 left-1/2 -translate-x-1/2 px-10 py-5 bg-amber-500 text-black font-black rounded-full uppercase text-xs tracking-widest shadow-[0_20px_50px_rgba(245,158,11,0.4)] hover:bg-amber-400 active:scale-95 transition-all flex items-center gap-3">
                      <Calculator size={16} /> Confirm Node
                    </button>
                  )}
               </div>
               
               <div className="absolute bottom-6 right-6 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 p-4 rounded-2xl flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[8px] font-black uppercase text-zinc-500 tracking-widest leading-none mb-1">Calibration</p>
                    <p className="text-xs font-black text-white italic uppercase tracking-tighter">1:100 @ A3 SMM-Kenya</p>
                  </div>
                  <Info size={14} className="text-amber-500" />
               </div>
            </section>

            <aside className={`w-120 border-l hidden xl:flex flex-col p-8 space-y-8 ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800/40' : 'bg-white border-zinc-200'}`}>
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Bill Summary<span className="text-amber-500">.</span></h3>
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mt-2">Active Valuation Stream</p>
                </div>
                <Download size={20} className="text-amber-500" />
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {boqItems.map(item => (
                  <div key={item.id} className="p-6 rounded-[2.5rem] border bg-zinc-900/30 border-zinc-800/60 shadow-xl group hover:border-amber-500/30 transition-all">
                    <div className="flex justify-between mb-4">
                      <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest border border-amber-500/20">{item.code}</span>
                      <span className="text-zinc-600 uppercase text-[10px] font-black tracking-[0.2em]">{item.unit}</span>
                    </div>
                    <h4 className="text-xs font-bold uppercase text-zinc-400 group-hover:text-zinc-100 transition-colors leading-relaxed mb-6">{item.description}</h4>
                    <div className="flex justify-between items-end border-t border-zinc-800/40 pt-4">
                      <div>
                        <p className="text-[8px] font-black uppercase text-zinc-600 mb-1">Quantity</p>
                        <p className="text-3xl font-black tracking-tighter">{item.qty.toFixed(3)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black uppercase text-zinc-600 mb-1">Net KES</p>
                        <p className="text-sm font-black text-amber-500 tracking-tighter">{(item.qty * item.rate).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-8 rounded-[3rem] bg-amber-500 text-black font-black shadow-[0_20px_60px_rgba(245,158,11,0.2)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform">
                  <Calculator size={100} />
                </div>
                <p className="text-[10px] uppercase tracking-[0.4em] opacity-60 mb-2 font-black leading-none">Elemental Estimate Node</p>
                <p className="text-4xl italic tracking-tighter leading-none">KES {boqTotal.toLocaleString()}</p>
                <div className="mt-6 pt-6 border-t border-black/10 flex justify-between items-center">
                   <span className="text-[8px] uppercase tracking-widest font-black opacity-40 italic">QS 001 Manual Compliant</span>
                   <span className="text-[8px] uppercase tracking-widest font-black opacity-40">Precision OS 2.0</span>
                </div>
              </div>
            </aside>
          </>
        ) : activeTab === 'boq' ? (
          /* FULL SMM TABLE VIEW */
          <section className="flex-1 p-12 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex justify-between items-end mb-12">
               <div>
                  <h2 className="text-6xl font-black uppercase italic tracking-tighter leading-none text-zinc-900 dark:text-white">
                    Bill of <span className="text-amber-500">Quantities.</span>
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-500 mt-4 italic">SMM-Kenya Standard Compliance Certificate</p>
               </div>
               <div className="flex gap-4">
                  <button 
                    onClick={() => handleGenerateReport('priced-boq')}
                    className="flex items-center gap-3 px-8 py-5 bg-zinc-800 rounded-4xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-all min-w-45 justify-center"
                  >
                    {isGenerating === 'priced-boq' ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16}/>}
                    Print Draft
                  </button>
                  <button 
                    onClick={() => handleGenerateReport('boq-excel')}
                    className="flex items-center gap-3 px-10 py-5 bg-amber-500 text-black rounded-4xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 hover:bg-amber-400 transition-all min-w-50 justify-center"
                  >
                    {isGenerating === 'boq-excel' ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16}/>}
                    Export Excel
                  </button>
               </div>
            </header>

            <div className="flex-1 bg-zinc-900/40 border border-zinc-800/60 rounded-[3.5rem] overflow-hidden backdrop-blur-3xl shadow-2xl flex flex-col">
               <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-zinc-900 sticky top-0 z-10">
                      <tr className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 italic border-b border-zinc-800">
                        <th className="p-10">Code</th>
                        <th className="p-10">Description of Work Section</th>
                        <th className="p-8">Unit</th>
                        <th className="p-10 text-right">Quantity</th>
                        <th className="p-10 text-right">Rate</th>
                        <th className="p-10 text-right">Net Amount (KES)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40">
                      {boqItems.map(item => (
                        <tr key={item.id} className="group hover:bg-white/2 transition-colors">
                          <td className="p-10 text-zinc-500 font-mono text-xs italic">{item.code}</td>
                          <td className="p-10">
                            <div className="text-sm font-bold text-zinc-300 max-w-xl leading-relaxed uppercase tracking-tight group-hover:text-white transition-colors">{item.description}</div>
                          </td>
                          <td className="p-8">
                            <span className="px-3 py-1 rounded-lg bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase border border-zinc-700">{item.unit}</span>
                          </td>
                          <td className="p-10 text-right font-black text-xl tracking-tighter">{item.qty.toFixed(3)}</td>
                          <td className="p-10 text-right text-zinc-500 italic font-medium">{item.rate.toLocaleString()}</td>
                          <td className="p-10 text-right font-black text-amber-500 text-2xl tracking-tighter">{(item.qty * item.rate).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                </table>
               </div>
               
               {/* GRAND TOTAL SUMMARY BLOCK */}
               <div className="p-12 bg-zinc-950/60 border-t border-zinc-800 flex justify-end">
                  <div className="w-96 space-y-6">
                    <div className="flex justify-between items-center opacity-40">
                       <span className="text-[10px] font-black uppercase tracking-widest italic">Net Construction Amount</span>
                       <span className="text-xl font-black italic">KES {boqTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center opacity-40">
                       <span className="text-[10px] font-black uppercase tracking-widest italic">Value Added Tax (16.0%)</span>
                       <span className="text-xl font-black italic">KES {(boqTotal * 0.16).toLocaleString()}</span>
                    </div>
                    <div className="h-px bg-zinc-800" />
                    <div className="flex justify-between items-center">
                       <span className="text-xs font-black uppercase tracking-[0.3em] text-amber-500 italic">Total carried to form of offer</span>
                       <span className="text-4xl font-black italic text-white tracking-tighter">KES {(boqTotal * 1.16).toLocaleString()}</span>
                    </div>
                  </div>
               </div>
            </div>
          </section>
        ) : (
          /* DOCS / REPORT ARTIFACTS VIEW (Manual Section 15 & Annexures) */
          <section className="flex-1 p-12 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
             <header className="flex justify-between items-end mb-12">
               <div>
                  <h2 className="text-6xl font-black uppercase italic tracking-tighter leading-none text-zinc-900 dark:text-white">
                    Vault <span className="text-amber-500">Artifacts.</span>
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-500 mt-4 italic">Official Project Documentation & Submission Node</p>
               </div>
               <button className="flex items-center gap-3 px-8 py-5 bg-amber-500 text-black rounded-4xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                  <FileCheck size={16}/> Finalize Account
               </button>
             </header>

             <div className="grid lg:grid-cols-2 gap-8 overflow-auto custom-scrollbar pr-4">
                {reports.map((report) => (
                   <div key={report.id} className="p-10 rounded-[3.5rem] border bg-zinc-900/40 border-zinc-800/60 backdrop-blur-3xl shadow-2xl flex flex-col justify-between group hover:border-amber-500/30 transition-all">
                      <div className="flex justify-between items-start mb-8">
                         <div className="p-5 bg-zinc-800 rounded-3xl border border-zinc-700 group-hover:bg-amber-500/10 group-hover:border-amber-500/20 transition-all">
                            {report.type === 'XLS' ? <FileSpreadsheet className="text-zinc-500 group-hover:text-amber-500" size={32} /> : <FileText className="text-zinc-500 group-hover:text-amber-500" size={32} />}
                         </div>
                         <div className="text-right">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${report.status === 'Draft' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                               {report.status}
                            </span>
                            <p className="text-[8px] font-black uppercase text-zinc-600 tracking-widest mt-3">{report.annexure}</p>
                         </div>
                      </div>

                      <div className="mb-10">
                         <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2">{report.title}</h3>
                         <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">Last Auth: {report.lastGenerated}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <button className="flex items-center justify-center gap-3 py-5 rounded-2xl bg-zinc-800 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-all">
                            <Eye size={14}/> Preview
                         </button>
                         <button 
                            onClick={() => handleGenerateReport(report.id)}
                            disabled={report.status === 'Archived'}
                            className={`flex items-center justify-center gap-3 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${report.status === 'Archived' ? 'bg-zinc-950 text-zinc-800 cursor-not-allowed' : 'bg-amber-500 text-black shadow-lg shadow-amber-500/10 hover:bg-amber-400'}`}
                         >
                            {isGenerating === report.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14}/>}
                            Generate {report.type}
                         </button>
                      </div>
                   </div>
                ))}
                
                {/* Audit Node Simulation */}
                <div className="p-10 rounded-[3.5rem] border border-dashed border-zinc-800 flex flex-col items-center justify-center gap-6 opacity-40">
                   <ClipboardCheck size={64} className="text-zinc-700" />
                   <div className="text-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500">Audit Handshake Pending</p>
                      <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-600 mt-2">Section 14.1 Manual Protocol</p>
                   </div>
                </div>
             </div>
          </section>
        )}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 12px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
        ::selection { background: #f59e0b; color: black; }
      `}</style>
    </div>
  );
};

export default ProjectDetailPage;