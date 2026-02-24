import React, { useState } from "react";
import { 
  FileText, Trash2, Upload, Loader2, ArrowLeft, 
  Calculator, ListChecks, ChevronRight, HardHat
} from "lucide-react";

/** --- TYPES & INTERFACES --- **/

interface Drawing {
  id: string;
  name: string;
  file_type: 'pdf' | 'image';
  version: number;
  updated_at: number;
}

interface BoqItem {
  id: string;
  description: string;
  unit: string;
  qty: number;
}

/** --- MOCK COMPONENTS & UTILS --- **/

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "amber";
}

const Button: React.FC<ButtonProps> = ({ children, className, variant = "primary", ...props }) => {
  const variants = {
    primary: "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-white",
    ghost: "text-zinc-500 hover:text-amber-500 bg-transparent",
    amber: "bg-amber-500 text-black hover:bg-amber-400"
  };
  return (
    <button 
      {...props} 
      className={`px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

interface DrawingCanvasProps {
  fileUrl: string;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ fileUrl }) => (
  <div className="relative w-full h-150 bg-zinc-900 flex items-center justify-center overflow-hidden border-2 border-amber-500/20 rounded-3xl group">
    <div className="absolute inset-0 opacity-10 pointer-events-none" 
         style={{backgroundImage: 'radial-gradient(#f59e0b 0.5px, transparent 0.5px)', backgroundSize: '24px 24px'}} />
    <div className="z-10 text-center space-y-4">
      <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
        <Calculator className="text-amber-500" size={32} />
      </div>
      <p className="text-zinc-400 font-black uppercase text-[10px] tracking-widest">Canvas Active: {fileUrl.split('/').pop() || "Layer-0"}</p>
      <div className="flex gap-2 justify-center">
        <div className="px-3 py-1 bg-amber-500 text-black text-[9px] font-black rounded uppercase">Scale: 1:100</div>
        <div className="px-3 py-1 bg-zinc-800 text-zinc-400 text-[9px] font-black rounded uppercase border border-zinc-700">Tool: Line</div>
      </div>
    </div>
  </div>
);

/** --- PROJECT DETAIL PAGE --- **/

const ProjectDetailPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("drawings");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null);
  
  // Fix: Lazy initialization for mock data to satisfy rendering purity
  const [drawings, setDrawings] = useState<Drawing[]>(() => [
    { id: 'd1', name: 'Ground Floor Plan.pdf', file_type: 'pdf', version: 1, updated_at: Date.now() },
    { id: 'd2', name: 'Electrical Layout-Rev2.img', file_type: 'image', version: 2, updated_at: Date.now() - 500000 }
  ]);

  const [boqItems] = useState<BoqItem[]>([
    { id: 'b1', description: 'Excavation of foundation trenches not exceeding 1.5m deep', unit: 'm3', qty: 145.5 },
    { id: 'b2', description: 'Concrete grade 25/20 in foundations', unit: 'm3', qty: 42.0 },
    { id: 'b3', description: 'High tensile reinforcement bars 12mm diameter', unit: 'kg', qty: 1250 }
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setTimeout(() => {
      const newDoc: Drawing = {
        id: crypto.randomUUID(),
        name: file.name,
        file_type: file.type.includes('pdf') ? 'pdf' : 'image',
        version: 1,
        updated_at: Date.now()
      };
      setDrawings([newDoc, ...drawings]);
      setIsUploading(false);
    }, 1500);
  };

  const launchCanvas = (doc: Drawing) => {
    setSelectedDrawing(doc);
    setActiveTab("takeoffs");
  };

  const handleDeleteFile = (id: string) => {
    if (window.confirm("Purge this blueprint from the vault?")) {
      setDrawings(drawings.filter(d => d.id !== id));
      if (selectedDrawing?.id === id) setSelectedDrawing(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 pb-24">
      
      {/* Back & Breadcrumb */}
      <div className="flex flex-col gap-6">
        <button type="button" className="flex items-center gap-2 text-zinc-600 hover:text-amber-500 transition-colors font-black uppercase text-[10px] tracking-[0.2em] group w-fit">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Workspace
        </button>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <h1 className="text-6xl font-black uppercase tracking-tighter italic text-amber-500">Project Master</h1>
            <div className="flex items-center gap-4">
              <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-500/20">
                Active Site
              </span>
              <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-widest">Vault_Ref: #0084B</p>
            </div>
          </div>

          <label className="cursor-pointer">
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,image/*" />
            <Button disabled={isUploading}>
              {isUploading ? <Loader2 className="animate-spin w-4 h-4" /> : <Upload size={16} />}
              Add Document
            </Button>
          </label>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex gap-10 border-b border-zinc-800/50">
        {[
          { id: "drawings", label: "Blueprints", icon: FileText },
          { id: "boq", label: "Bill of Quantities", icon: ListChecks },
          { id: "takeoffs", label: "Take-off Canvas", icon: Calculator }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`pb-5 text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-2.5 relative ${
              activeTab === tab.id ? "text-amber-500" : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            <tab.icon size={14} className={activeTab === tab.id ? "text-amber-500" : ""} />
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
            )}
          </button>
        ))}
      </div>

      {/* Content Switching Engine */}
      <div className="min-h-125">
        {activeTab === "drawings" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4">
            {drawings.map((doc) => (
              <div key={doc.id} className="bg-zinc-900/30 border border-zinc-800/50 p-8 rounded-[2.5rem] group hover:border-amber-500/30 transition-all hover:bg-zinc-900/50">
                <div className="flex justify-between items-start mb-8">
                  <div className="p-5 bg-zinc-950 rounded-2xl text-amber-500 border border-zinc-800 group-hover:scale-110 transition-transform">
                    <FileText size={28} />
                  </div>
                  <button type="button" onClick={() => handleDeleteFile(doc.id)} className="p-2 text-zinc-800 hover:text-red-500 transition-colors">
                    <Trash2 size={20} />
                  </button>
                </div>
                <h3 className="font-black uppercase text-sm tracking-tight truncate text-zinc-100">{doc.name}</h3>
                <div className="flex gap-3 mt-2">
                  <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">V{doc.version}</span>
                  <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">{doc.file_type}</span>
                </div>
                
                <button 
                  type="button"
                  onClick={() => launchCanvas(doc)}
                  className="w-full mt-8 bg-zinc-950 text-zinc-500 group-hover:bg-amber-500 group-hover:text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-2 border border-zinc-800 group-hover:border-amber-400"
                >
                  Launch Canvas <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "boq" && (
          <div className="bg-zinc-900/20 border border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900/50 text-[10px] font-black uppercase text-zinc-600 tracking-[0.2em] border-b border-zinc-800">
                  <th className="p-8">Item Description</th>
                  <th className="p-8">Unit</th>
                  <th className="p-8">Measured Qty</th>
                  <th className="p-8 text-right">Total (KES)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {boqItems.map((item) => (
                  <tr key={item.id} className="group hover:bg-amber-500/3 transition-colors">
                    <td className="p-8 text-[11px] font-black uppercase text-zinc-400 group-hover:text-zinc-100 transition-colors max-w-md">
                      {item.description}
                    </td>
                    <td className="p-8 text-[10px] font-bold text-zinc-600 uppercase">{item.unit}</td>
                    <td className="p-8 text-xs font-mono text-amber-500 font-black">
                      {item.qty.toFixed(2)}
                    </td>
                    <td className="p-8 text-right text-xs font-mono text-zinc-600 italic">
                      --
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "takeoffs" && (
          <div className="animate-in slide-in-from-bottom-4">
            {selectedDrawing ? (
              <DrawingCanvas fileUrl={selectedDrawing.name} />
            ) : (
              <div className="h-125 w-full bg-zinc-900/20 border-2 border-dashed border-zinc-800 rounded-[3rem] flex flex-col items-center justify-center space-y-4">
                <div className="p-6 bg-zinc-950 rounded-full border border-zinc-800">
                  <HardHat size={40} className="text-zinc-800" />
                </div>
                <div className="text-center">
                  <p className="text-zinc-400 font-black uppercase text-[10px] tracking-[0.3em]">No Drawing Active</p>
                  <p className="text-zinc-700 text-[9px] font-bold uppercase mt-2">Select a blueprint from the gallery to start measuring</p>
                </div>
                <Button variant="ghost" onClick={() => setActiveTab('drawings')} className="mt-4">
                  Go to Blueprints
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailPage;