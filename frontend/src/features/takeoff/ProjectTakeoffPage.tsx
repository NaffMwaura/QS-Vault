import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Save,
} from 'lucide-react';

// Import our newly created Modular Components
import HUDHeader from '../../components/layout/HUDHeader';
import SidebarCommand from '../../components/layout/SidebarCommand';
import BlueprintViewport from './components/BlueprintViewport';
import GeometricRegistry from './components/GeometricRegistry';
import CalibrationNode from './components/CalibrationNode';
import SMMWorkSections from './components/SMMWorkSections';
import SMMTemplates from './components/SMMTemplates';

/** --- TYPES --- **/
interface Point { x: number; y: number; }
interface Measurement {
  id: string;
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

const ProjectTakeoffPage: React.FC<ProjectTakeoffPageProps> = ({ onBack }) => {
  // 1. MASTER STATE HANDSHAKE
  const [theme] = useState<'light' | 'dark'>('dark');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [scale, setScale] = useState(1.0);
  const [scaleFactor, setScaleFactor] = useState(1.0); // pixels to meters
  const [unit, setUnit] = useState<'m' | 'mm'>('m');
  
  const [activeSection, setActiveSection] = useState('Concrete Work');
  const [activeTool, setActiveTool] = useState<'length' | 'area' | 'count'>('area');
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [isDeductionMode, setIsDeductionMode] = useState(false);
  
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [, setSmmParams] = useState({ depth: 0.150, height: 3.0, waste: 5 });

  // 2. GEOMETRIC LOGIC NODES
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMeasuring) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newPoints = [...currentPoints, { x, y }];
    setCurrentPoints(newPoints);

    // Auto-finalize for 'count' tool
    if (activeTool === 'count') {
      commitMeasurement(newPoints);
    }
  };

  const commitMeasurement = (points: Point[]) => {
    const id = crypto.randomUUID();
    let calculatedValue = 0;

    // Simulate SMM-KE calculation logic
    if (activeTool === 'length') calculatedValue = points.length * 2.5; // Mock length
    if (activeTool === 'area') calculatedValue = points.length * 5.0;  // Mock area

    const newMeasurement: Measurement = {
      id,
      label: `${activeSection} Item ${measurements.length + 1}`,
      type: activeTool,
      value: calculatedValue,
      unit: activeTool === 'area' ? 'm²' : activeTool === 'length' ? 'm' : 'nr',
      sectionCode: activeSection,
      points,
      timestamp: new Date().toISOString()
    };

    setMeasurements([newMeasurement, ...measurements]);
    setCurrentPoints([]);
    if (activeTool !== 'count') setIsMeasuring(false);
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden ${theme === 'dark' ? 'bg-[#09090b]' : 'bg-zinc-100'}`}>
      
      {/* LEFT: COMMAND STRIP */}
      <SidebarCommand activeView="projects" setActiveView={() => onBack()} />

      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP: HUD HEADER */}
        <HUDHeader activeView="projects" setActiveView={() => {}} />

        {/* MASTER WORKSPACE LAYOUT */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* COLUMN 1: SMM CONFIGURATION (320px) */}
          <div className={`w-80 border-r flex flex-col overflow-y-auto custom-scrollbar transition-colors
            ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800/40' : 'bg-white border-zinc-200'}`}>
            <SMMWorkSections 
              activeSection={activeSection} 
              setActiveSection={setActiveSection}
              activeTool={activeTool}
              setActiveTool={setActiveTool}
            />
            <div className="p-6 border-t border-zinc-800/40">
              <CalibrationNode 
                currentScale={scaleFactor} 
                onScaleChange={setScaleFactor} 
                unit={unit} 
                onUnitToggle={setUnit} 
              />
            </div>
          </div>

          {/* COLUMN 2: BLUEPRINT VIEWPORT (FLEX) */}
          <div className="flex-1 relative flex flex-col bg-black">
            <div className="absolute top-6 right-6 z-20 flex gap-3">
              <button 
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900/90 border border-zinc-800 rounded-xl text-[10px] font-black uppercase text-zinc-400 hover:text-white transition-all"
              >
                <ArrowLeft size={14} /> Exit Vault
              </button>
              <button className="flex items-center gap-2 px-6 py-2 bg-amber-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amber-500/20">
                <Save size={14} /> Commit Node
              </button>
            </div>

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
              onCanvasClick={handleCanvasClick}
            />
          </div>

          {/* COLUMN 3: REGISTRY & LOGIC (380px) */}
          <div className={`w-96 border-l flex flex-col overflow-hidden transition-colors
            ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800/40' : 'bg-white border-zinc-200'}`}>
            
            <div className="flex-1 overflow-hidden">
               <GeometricRegistry 
                measurements={measurements}
                onDelete={(id) => setMeasurements(measurements.filter(m => m.id !== id))}
                onEditLabel={() => {}}
                activeSection={activeSection}
               />
            </div>

            <div className="p-6 border-t border-zinc-800/40 bg-black/20">
              <SMMTemplates 
                activeSection={activeSection}
                isDeductionMode={isDeductionMode}
                setIsDeductionMode={setIsDeductionMode}
                onParameterChange={(params) => setSmmParams(params)}
              />
            </div>
          </div>

        </div>
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


