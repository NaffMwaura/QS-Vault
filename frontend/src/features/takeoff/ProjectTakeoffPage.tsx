/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, } from 'react';
import { 
  ArrowLeft, 
  Wifi,
  WifiOff,
  ChevronLeft,
  ChevronRight,
  FileText,
  Layout,
  Loader2,
  CheckCircle2
} from 'lucide-react';

// Refined Modular Components
import BlueprintViewport from '../takeoff/components/BlueprintViewport';
import GeometricRegistry from '../takeoff/components/GeometricRegistry';
import CalibrationNode from '../takeoff/components/CalibrationNode';
import SMMWorkSections from '../takeoff/components/SMMWorkSections';
import SMMTemplates from '../takeoff/components/SMMTemplates';

// Report Engines
import BoQGenerator from '../../features/boq/components/BoQGenerator';
import CertificateGenerator from '../../features/reports/components/CertificateGenerator';
import WhatsAppExport from '../../features/reports/components/WhatsAppExport';

/* ======================================================
    OFFICE DATABASE INTEGRATION
   ====================================================== */

let useAuth: any = () => ({ user: { id: 'dev-node' }, theme: 'dark' });
let db: any = null;
let syncEngine: any = null;

const resolveModules = async () => {
  try {
    const authMod = await import("../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const dbMod = await import("../../lib/database/database");
    if (dbMod.db) db = dbMod.db; 
    if (dbMod.syncEngine) syncEngine = dbMod.syncEngine;
  } catch (e) {
    // Shims active
  }
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
  
  // 1. WORKSPACE STATE
  const [activeWorkspace, setActiveWorkspace] = useState<'takeoff' | 'reports'>('takeoff');
  const [isOnline] = useState(navigator.onLine);
  const [, setIsLoading] = useState(true);
  
  // Drafting Engine
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [scale, setScale] = useState(1.0);
  const [scaleFactor, setScaleFactor] = useState(0.01); // Default 1:100
  const [unit, setUnit] = useState<'m' | 'mm'>('m');
  
  // Takeoff Data
  const [activeSection, setActiveSection] = useState('Concrete Work');
  const [activeTool, setActiveTool] = useState<'length' | 'area' | 'count'>('area');
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [isDeductionMode, setIsDeductionMode] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [smmParams, setSmmParams] = useState({ depth: 0.150, height: 3.0, waste: 5 });

  // UI States
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  /** * DATABASE SYNC
   * Loads existing project measurements from local storage.
   */
  useEffect(() => {
    const loadData = async () => {
      if (!db || !projectId) {
        setIsLoading(false);
        return;
      }
      try {
        const stored = await db.measurements.where('project_id').equals(projectId).toArray();
        setMeasurements(stored);
      } catch (err) {
        console.error("Takeoff Error: Local records unreachable.", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [projectId]);

  /** * MEASUREMENT LOGIC
   * Handles high-precision calculation based on SMM-KE rules.
   */
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMeasuring) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newPoints = [...currentPoints, { x, y }];
    setCurrentPoints(newPoints);

    if (activeTool === 'count') commitMeasurement(newPoints);
  };

  const commitMeasurement = async (points: Point[]) => {
    if (!db || !user) return;
    setSaveStatus('saving');

    const id = crypto.randomUUID();
    const rawValue = points.length * scaleFactor; // Basic pixel-to-meter simulation
    
    // Apply SMM Rules (m2 for area, m3 for concrete depth etc)
    let calculatedValue = rawValue;
    if (activeSection.includes('Concrete')) calculatedValue = rawValue * smmParams.depth;
    if (activeSection.includes('Walling')) calculatedValue = rawValue * smmParams.height;

    const newEntry: Measurement = {
      id,
      project_id: projectId,
      label: `${activeSection} Item ${measurements.length + 1}`,
      type: activeTool,
      value: calculatedValue * (1 + smmParams.waste / 100) * (isDeductionMode ? -1 : 1),
      unit: activeSection.includes('Concrete') ? 'm³' : activeTool === 'area' ? 'm²' : 'm',
      sectionCode: activeSection,
      points,
      timestamp: new Date().toISOString()
    };

    try {
      // SAVE TO OFFICE DEVICE
      await db.measurements.add(newEntry);
      
      // QUEUE FOR OFFICE CLOUD
      if (syncEngine?.queueChange) {
        await syncEngine.queueChange('measurements', id, 'INSERT', newEntry);
      }

      setMeasurements([newEntry, ...measurements]);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error("Critical: Measurement save failed:", err);
      setSaveStatus('idle');
    }

    setCurrentPoints([]);
    if (activeTool !== 'count') setIsMeasuring(false);
  };

  return (
    <div className={`flex flex-col h-screen w-full overflow-hidden transition-colors duration-500
      ${theme === 'dark' ? 'bg-[#09090b] text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
      
      {/* 1. MASTER WORKSPACE HEADER */}
      <header className={`h-20 flex items-center justify-between px-6 border-b shrink-0 z-30 backdrop-blur-md
        ${theme === 'dark' ? 'bg-[#09090b]/90 border-zinc-800/60' : 'bg-white/90 border-zinc-200 shadow-sm'}`}>
        
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-3 rounded-xl hover:bg-zinc-800 text-zinc-500 transition-all active:scale-90">
            <ArrowLeft size={20} />
          </button>
          
          <div className="text-left">
             <p className="text-[9px] font-black uppercase text-amber-500 tracking-[0.2em] leading-none mb-1 italic">
               Project Workspace
             </p>
             <h2 className="text-sm font-black uppercase tracking-tight leading-none truncate max-w-200px]">
               {projectName}
             </h2>
          </div>

          <div className="h-8 w-px bg-zinc-800 hidden md:block" />

          {/* WORKSPACE TOGGLE */}
          <div className="hidden md:flex bg-zinc-950 p-1 rounded-2xl border border-zinc-800">
            <button 
              onClick={() => setActiveWorkspace('takeoff')}
              className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2
                ${activeWorkspace === 'takeoff' ? 'bg-amber-500 text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Layout size={12} /> Takeoff Mode
            </button>
            <button 
              onClick={() => setActiveWorkspace('reports')}
              className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2
                ${activeWorkspace === 'reports' ? 'bg-amber-500 text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <FileText size={12} /> Report Mode
            </button>
          </div>
        </div>

        {/* STATUS & ACTIONS */}
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-full border flex items-center gap-3 transition-all
            ${isOnline ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/5 border-amber-500/20 text-amber-500'}`}>
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span className="text-[8px] font-black uppercase tracking-widest">
              {isOnline ? 'Office Online' : 'Device Storage Active'}
            </span>
          </div>
          
          <div className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all
            ${saveStatus === 'saved' ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
            {saveStatus === 'saving' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {saveStatus === 'saving' ? 'Recording...' : saveStatus === 'saved' ? 'Work Secured' : 'System Ready'}
          </div>
        </div>
      </header>

      {/* 2. DYNAMIC WORKSPACE CONTENT */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {activeWorkspace === 'takeoff' ? (
          <>
            {/* TAKEOFF SIDEBAR (LEFT): Tools & Scale */}
            <div className={`relative transition-all duration-500 border-r z-20 ${leftSidebarOpen ? 'w-80' : 'w-0'} bg-zinc-950/80 backdrop-blur-xl`}>
              <div className={`w-80 h-full flex flex-col overflow-y-auto custom-scrollbar ${!leftSidebarOpen && 'invisible opacity-0'}`}>
                <SMMWorkSections 
                  activeSection={activeSection} 
                  setActiveSection={setActiveSection}
                  activeTool={activeTool}
                  setActiveTool={setActiveTool}
                />
                <div className="p-6 border-t border-zinc-800/40 bg-zinc-900/10 mt-auto">
                  <CalibrationNode currentScale={scaleFactor} onScaleChange={setScaleFactor} unit={unit} onUnitToggle={setUnit} />
                </div>
              </div>
              <button onClick={() => setLeftSidebarOpen(!leftSidebarOpen)} className="absolute top-1/2 -right-3 -translate-y-1/2 p-1.5 rounded-full border bg-zinc-950 border-zinc-800 text-zinc-500 z-50">
                {leftSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
              </button>
            </div>

            {/* VIEWPORT (CENTER) */}
            <main className="flex-1 relative bg-black flex flex-col overflow-hidden">
              <BlueprintViewport 
                pdfDoc={pdfDoc} setPdfDoc={setPdfDoc} pageNum={1} scale={scale} setScale={setScale}
                isMeasuring={isMeasuring} setIsMeasuring={setIsMeasuring} activeTool={activeTool}
                currentPoints={currentPoints} setCurrentPoints={setCurrentPoints} measurements={measurements}
                onCanvasClick={handleCanvasClick}
              />
            </main>

            {/* TAKEOFF SIDEBAR (RIGHT): Ledger & Parameters */}
            <div className={`relative transition-all duration-500 border-l z-20 ${rightSidebarOpen ? 'w-96' : 'w-0'} bg-zinc-950/80 backdrop-blur-xl`}>
              <div className={`w-96 h-full flex flex-col overflow-hidden ${!rightSidebarOpen && 'invisible opacity-0'}`}>
                <div className="flex-1 overflow-hidden">
                   <GeometricRegistry 
                    measurements={measurements} 
                    onDelete={(id) => setMeasurements(measurements.filter(m => m.id !== id))} 
                    activeSection={activeSection} 
                  />
                </div>
                <div className="p-6 border-t border-zinc-800/40 bg-black/20">
                  <SMMTemplates 
                    activeSection={activeSection} 
                    isDeductionMode={isDeductionMode} 
                    setIsDeductionMode={setIsDeductionMode}
                    onParameterChange={setSmmParams}
                  />
                </div>
              </div>
              <button onClick={() => setRightSidebarOpen(!rightSidebarOpen)} className="absolute top-1/2 -left-3 -translate-y-1/2 p-1.5 rounded-full border bg-zinc-950 border-zinc-800 text-zinc-500 z-50">
                {rightSidebarOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </button>
            </div>
          </>
        ) : (
          /* REPORT MODE: Integrated BoQ, Certificate, and Sharing */
          <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-zinc-950 p-6 sm:p-12 space-y-12 animate-in slide-in-from-bottom-4">
            
            <div className="grid lg:grid-cols-3 gap-10">
               {/* 1. The Professional BoQ Output */}
               <div className="lg:col-span-2">
                  <BoQGenerator projectId={projectId} projectName={projectName} />
               </div>

               {/* 2. Certificate and Instant Sharing */}
               <div className="space-y-10">
                  <div className="space-y-4 text-left px-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 italic">Instant Submission</h4>
                    <p className="text-xl font-black text-white uppercase tracking-tighter">Office Share</p>
                  </div>
                  <WhatsAppExport projectName={projectName} data={{
                    certNumber: "IPC/001",
                    valuationDate: new Date().toLocaleDateString(),
                    contractSum: 0,
                    workExecuted: measurements.reduce((acc, m) => acc + m.value, 0) * 1000, // Simulated rate multiplier
                    materialsOnSite: 0,
                    previousCertified: 0,
                    retentionPercent: 10
                  }} />

                  <div className="space-y-4 text-left px-4 pt-10 border-t border-zinc-800/40">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 italic">Valuation Registry</h4>
                    <p className="text-xl font-black text-white uppercase tracking-tighter">Draft Certificate</p>
                  </div>
                  <CertificateGenerator projectId={projectId} projectName={projectName} />
               </div>
            </div>

            <footer className="py-20 text-center opacity-10">
              <p className="text-[10px] font-black uppercase tracking-[0.6em]">Professional Report Export Module v2.0</p>
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
