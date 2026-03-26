/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Wifi,
  WifiOff,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Zap,
  ShieldCheck,
  Maximize2
} from 'lucide-react';

// --- FIXED COMPONENT PATHS ---
import BlueprintViewport from './components/BlueprintViewport';
import GeometricRegistry from './components/GeometricRegistry';
import CalibrationNode from './components/CalibrationNode';
import SMMWorkSections from './components/SMMWorkSections';
import SMMTemplates from './components/SMMTemplates';

// --- REPORT ENGINES ---
import BoQGenerator from '../boq/components/BoQGenerator';
import CertificateGenerator from '../reports/components/CertificateGenerator';
import WhatsAppExport from '../reports/components/WhatsAppExport';

/* ======================================================
    OFFICE MODULE RESOLUTION
   ====================================================== */

let useAuth: any = () => ({ user: { id: 'dev-node-001' }, theme: 'dark' });
let db: any = null;
let syncEngine: any = null;

const resolveModules = async () => {
  try {
    const authMod = await import("../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;
    const dbMod = await import("../../lib/database/database");
    if (dbMod.db) db = dbMod.db;
    if (dbMod.syncEngine) syncEngine = dbMod.syncEngine;
  } catch (e) { /* empty */ }
};

resolveModules();

/** --- TYPES --- **/
interface Point { x: number; y: number; }
interface Measurement {
  id: string;
  project_id: string;
  label: string;
  type: 'length' | 'area' | 'count';
  value: number;
  unit: string;
  sectionCode: string;
  points: Point[];
  timestamp: string;
}

interface ProjectTakeoffPageProps {
  projectId: string;
  projectName: string;
  onBack: () => void;
}

const ProjectTakeoffPage: React.FC<ProjectTakeoffPageProps> = ({ projectId, projectName, onBack }) => {
  const { theme, user } = useAuth();

  // Workspace States
  const [activeWorkspace, setActiveWorkspace] = useState<'takeoff' | 'reports'>('takeoff');
  const [isOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [, setIsLoading] = useState(true);

  // Takeoff Parameters
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [scale, setScale] = useState(1.0);
  const [scaleFactor, setScaleFactor] = useState(0.01);
  const [unit, setUnit] = useState<'m' | 'mm'>('m');
  const [activeSection, setActiveSection] = useState('Concrete Work');
  const [activeTool, setActiveTool] = useState<'length' | 'area' | 'count'>('area');
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [isDeductionMode, setIsDeductionMode] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [smmParams, setSmmParams] = useState({ depth: 0.150, height: 3.0, waste: 5 });

  // Sidebar Controls
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    const loadVault = async () => {
      if (!db || !projectId) { setIsLoading(false); return; }
      try {
        const stored = await db.measurements.where('project_id').equals(projectId).toArray();
        setMeasurements(stored);
      } finally { setIsLoading(false); }
    };
    loadVault();
  }, [projectId]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMeasuring) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const nextPoints = [...currentPoints, { x, y }];
    setCurrentPoints(nextPoints);
    if (activeTool === 'count') commitMeasurement(nextPoints);
  };

  const commitMeasurement = async (points: Point[]) => {
    if (!db || !user) return;
    setSaveStatus('saving');
    const id = crypto.randomUUID();
    const rawVal = points.length * scaleFactor;
    let finalVal = rawVal;
    if (activeSection.includes('Concrete')) finalVal = rawVal * smmParams.depth;
    if (activeSection.includes('Walling')) finalVal = rawVal * smmParams.height;

    const entry: Measurement = {
      id, project_id: projectId, label: `${activeSection} Node #${measurements.length + 1}`,
      type: activeTool, value: finalVal * (1 + smmParams.waste / 100) * (isDeductionMode ? -1 : 1),
      unit: activeSection.includes('Concrete') ? 'm³' : activeTool === 'area' ? 'm²' : 'm',
      sectionCode: activeSection, points, timestamp: new Date().toISOString()
    };

    try {
      await db.measurements.add(entry);
      if (syncEngine) await syncEngine.queueChange('measurements', id, 'INSERT', entry);
      setMeasurements([entry, ...measurements]);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) { setSaveStatus('idle'); }
    setCurrentPoints([]);
    if (activeTool !== 'count') setIsMeasuring(false);
  };

  return (
    <div className={`flex flex-col h-screen w-full overflow-hidden transition-colors duration-500
      ${theme === 'dark' ? 'bg-[#050505] text-zinc-100' : 'bg-zinc-100 text-zinc-900'}`}>

      {/* 1. TOP COMMAND BAR */}
      <header className={`h-20 flex items-center justify-between px-6 border-b shrink-0 z-40 backdrop-blur-2xl
        ${theme === 'dark' ? 'bg-black/60 border-zinc-800' : 'bg-white/90 border-zinc-200 shadow-sm'}`}>
        
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-3 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-zinc-500 transition-all active:scale-90">
            <ArrowLeft size={20} />
          </button>
          <div className="text-left">
            <p className="text-[9px] font-black uppercase text-amber-500 tracking-[0.2em] leading-none mb-1">Technical Workspace</p>
            <h2 className="text-sm font-black uppercase tracking-tight leading-none truncate max-w-200px]">{projectName}</h2>
          </div>
          <div className="hidden md:flex bg-zinc-950/40 p-1.5 rounded-2xl border border-zinc-800/60 ml-4">
            <button onClick={() => setActiveWorkspace('takeoff')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeWorkspace === 'takeoff' ? 'bg-amber-500 text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-200'}`}>Takeoff</button>
            <button onClick={() => setActiveWorkspace('reports')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeWorkspace === 'reports' ? 'bg-amber-500 text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-200'}`}>Reports</button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`px-4 py-2.5 rounded-2xl border flex items-center gap-3 transition-all ${isOnline ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500 animate-pulse'}`}>
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span className="text-[9px] font-black uppercase hidden sm:block">{isOnline ? 'Synced' : 'Offline'}</span>
          </div>
          <div className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl border font-black text-[10px] uppercase shadow-xl ${saveStatus === 'saved' ? 'bg-emerald-500 border-emerald-600 text-black' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>
            {saveStatus === 'saving' ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
            <span>{saveStatus === 'saving' ? 'Vaulting...' : saveStatus === 'saved' ? 'Secured' : 'Armed'}</span>
          </div>
        </div>
      </header>

      {/* 2. DYNAMIC WORKSPACE CONTENT */}
      <div className="flex-1 flex overflow-hidden relative">
        {activeWorkspace === 'takeoff' ? (
          <>
            {/* LEFT SIDEBAR: TOOLS */}
            <div className={`relative transition-all duration-500 border-r z-30 ${leftOpen ? 'w-80' : 'w-0'} bg-zinc-950/60 backdrop-blur-3xl`}>
              <div className={`w-80 h-full flex flex-col overflow-y-auto custom-scrollbar ${!leftOpen && 'invisible opacity-0'}`}>
                <SMMWorkSections activeSection={activeSection} setActiveSection={setActiveSection} activeTool={activeTool} setActiveTool={setActiveTool} />
                <div className="p-8 border-t border-zinc-800/40 bg-white/1 mt-auto">
                  <CalibrationNode currentScale={scaleFactor} onScaleChange={setScaleFactor} unit={unit} onUnitToggle={setUnit} />
                </div>
              </div>
              <button onClick={() => setLeftOpen(!leftOpen)} className="absolute top-1/2 -right-3.5 -translate-y-1/2 w-7 h-7 rounded-full border bg-zinc-950 border-zinc-800 text-zinc-500 z-50 flex items-center justify-center hover:text-amber-500 shadow-2xl">
                {leftOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
              </button>
            </div>

            {/* VIEWPORT: THE CANVAS */}
            <main className="flex-1 relative bg-black overflow-hidden flex flex-col">
              <BlueprintViewport
                pdfDoc={pdfDoc} setPdfDoc={setPdfDoc} pageNum={1} scale={scale} setScale={setScale}
                isMeasuring={isMeasuring} setIsMeasuring={setIsMeasuring} activeTool={activeTool}
                currentPoints={currentPoints} setCurrentPoints={setCurrentPoints} measurements={measurements}
                onCanvasClick={handleCanvasClick}
              />
              {isMeasuring && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 px-8 py-4 bg-amber-500 rounded-2xl border-2 border-amber-600 shadow-2xl animate-in slide-in-from-top-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-black flex items-center gap-3">
                    <Zap size={16} className="fill-current animate-pulse" /> Define {activeTool} on drawing
                  </p>
                </div>
              )}
            </main>

            {/* RIGHT SIDEBAR: LEDGER */}
            <div className={`relative transition-all duration-500 border-l z-30 ${rightOpen ? 'w-96' : 'w-0'} bg-zinc-950/60 backdrop-blur-3xl`}>
              <div className={`w-96 h-full flex flex-col overflow-hidden ${!rightOpen && 'invisible opacity-0'}`}>
                <div className="flex-1 overflow-hidden">
                  <GeometricRegistry measurements={measurements} onDelete={(id) => setMeasurements(measurements.filter(m => m.id !== id))} activeSection={activeSection} />
                </div>
                <div className="p-8 border-t border-zinc-800/40 bg-white/1">
                  <SMMTemplates activeSection={activeSection} isDeductionMode={isDeductionMode} setIsDeductionMode={setIsDeductionMode} onParameterChange={setSmmParams} />
                </div>
              </div>
              <button onClick={() => setRightOpen(!rightOpen)} className="absolute top-1/2 -left-3.5 -translate-y-1/2 w-7 h-7 rounded-full border bg-zinc-950 border-zinc-800 text-zinc-500 z-50 flex items-center justify-center hover:text-amber-500 shadow-2xl">
                {rightOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </button>
            </div>
          </>
        ) : (
          /* REPORT MODE: CENTERED BREATHING ROOM */
          <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-[#050505] p-6 sm:p-14 space-y-20 animate-in slide-in-from-bottom-6">
            <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-3 gap-16">
              <div className="lg:col-span-2 space-y-8">
                 <div className="flex items-center gap-4 px-6 opacity-40"><Maximize2 size={16} /><h4 className="text-[10px] font-black uppercase tracking-widest">Bill Calculation Engine</h4></div>
                 <BoQGenerator projectId={projectId} projectName={projectName} />
              </div>
              <div className="space-y-12">
                <WhatsAppExport projectName={projectName} data={{ certNumber: "IPC/001", valuationDate: new Date().toLocaleDateString(), contractSum: 0, workExecuted: measurements.reduce((acc, m) => acc + (Math.abs(m.value) * 1000), 0), materialsOnSite: 0, previousCertified: 0, retentionPercent: 10 }} />
                <CertificateGenerator projectId={projectId} projectName={projectName} />
              </div>
            </div>
            <footer className="pt-32 pb-10 text-center opacity-10">
               <p className="text-[10px] font-black uppercase tracking-[1em]">END OF TECHNICAL RECORD</p>
            </footer>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
      `}</style>
    </div>
  );
};

export default ProjectTakeoffPage;