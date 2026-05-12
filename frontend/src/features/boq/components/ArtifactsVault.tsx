/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileSpreadsheet, 
  Loader2, 
  ShieldCheck,
  ArrowLeft,
  Archive,
  Search,
  RefreshCw,
  FolderOpen,
  ChevronRight
} from 'lucide-react';

// Standard Infrastructure (Direct Imports for Reliability)
import { useAuth } from "../../auth/AuthContext";
import { db } from "../../../lib/database/database";
import BoQGenerator from "./BoQGenerator";
import type { Measurement } from "../../takeoff/types/takeoff";

/** --- TYPES --- **/
interface ReportItem {
  id: string;
  title: string;
  type: 'PDF' | 'XLS' | 'DOC';
  status: 'Draft' | 'Certified' | 'Archived';
  projectName: string;
  lastUpdated: string;
  version: string;
  measurementCount: number;
}

/** --- SUB-COMPONENT: PROJECT FOLDER CARD --- **/
const DocumentCard: React.FC<{ 
  report: ReportItem; 
  onView: (report: ReportItem) => void;
  theme: 'light' | 'dark' 
}> = ({ report, onView, theme }) => (
  <div 
    onClick={() => onView(report)}
    className={`p-8 rounded-[3.5rem] border-2 transition-all duration-500 group relative flex flex-col justify-between overflow-hidden shadow-2xl cursor-pointer
    ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 hover:border-amber-500/30' : 'bg-white border-zinc-200 shadow-sm hover:border-amber-500/30'}`}
  >
    <div className="mb-8 flex items-start justify-between gap-4">
      <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border-2 transition-all duration-500
        ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}
        group-hover:bg-amber-500/10 group-hover:border-amber-500/20`}>
        <FileSpreadsheet className="text-zinc-600 group-hover:text-amber-500 transition-colors" size={32} />
      </div>
      <div className="text-right flex flex-col items-end gap-2">
        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border-2
          ${report.measurementCount > 0 
            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
          {report.measurementCount > 0 ? `${report.measurementCount} Nodes Secured` : 'Empty Vault'}
        </span>
        <p className="text-[8px] font-mono text-zinc-600 font-bold uppercase">SEC-v2.5</p>
      </div>
    </div>

    <div className="mb-10 text-left space-y-2">
      <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em] italic">Project Folder</p>
      <h3 className={`text-3xl font-black uppercase italic tracking-tighter leading-tight ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
        {report.projectName}
      </h3>
      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
        Last Modification: {report.lastUpdated}
      </p>
    </div>

    <div className="flex items-center justify-between pt-6 border-t border-zinc-800/40 opacity-40 group-hover:opacity-100 transition-opacity">
       <span className="text-[10px] font-black uppercase tracking-widest">Open Archive</span>
       <ChevronRight size={18} className="text-amber-500 group-hover:translate-x-2 transition-transform" />
    </div>
  </div>
);

/** --- MAIN COMPONENT: THE ARCHIVE CABINET --- **/
const ArtifactsVault: React.FC = () => {
  const { user, theme } = useAuth();
  
  // App State
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Drill-down State (Crucial for fixing the empty display)
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [selectedMeasurements, setSelectedMeasurements] = useState<Measurement[]>([]);
  const [isDrillingDown, setIsDrillingDown] = useState(false);

  /** * 1. SCANNER: REFRESH ALL CABINET FOLDERS */
  const scanVault = useCallback(async () => {
    if (!db || !user) {
      setTimeout(() => setLoading(false), 1000);
      return;
    }

    try {
      setLoading(true);
      // Fetch all projects owned by this user
      const projects = await db.projects.where("user_id").equals(user.id).toArray();
      
      const documentList: ReportItem[] = await Promise.all(projects.map(async (p: any) => {
        // Count how many measurements exist for this SPECIFIC project ID
        const count = await db.measurements.where("project_id").equals(p.id).count();
        
        return {
          id: p.id,
          title: "Bill of Quantities",
          projectName: p.name,
          type: "XLS",
          status: count > 0 ? "Certified" : "Draft",
          lastUpdated: new Date(p.updated_at || p.created_at).toLocaleDateString(),
          version: "1.0.0",
          measurementCount: count
        };
      }));

      setReports(documentList.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated)));
    } catch (err) {
      console.error("Vault Scanner: Failure.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    scanVault();
  }, [scanVault]);

  /** * 2. DRILL DOWN: OPEN A SPECIFIC FOLDER
   * This is where we fetch the actual measurement "papers" for the folder.
   */
  const handleOpenFolder = async (report: ReportItem) => {
    if (!db) return;
    
    // CRITICAL: Immediately clear old measurements to prevent cross-project data bleed
    setSelectedMeasurements([]);
    setSelectedReport(report);
    
    try {
      setIsDrillingDown(true);
      
      // FETCH: Get every node where project_id matches the folder clicked
      const projectData = await db.measurements
        .where("project_id")
        .equals(report.id)
        .toArray();
        
      setSelectedMeasurements(projectData as Measurement[]);
    } catch (err) {
      console.error("Folder Drill: Access Denied.");
    } finally {
      setIsDrillingDown(false);
    }
  };

  const filteredReports = reports.filter(r => 
    r.projectName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center opacity-30">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500 mb-6" />
        <p className="font-black uppercase text-[10px] tracking-[0.5em] italic">Unlocking Project Vault...</p>
      </div>
    );
  }

  // --- DETAIL VIEW: INSIDE THE PROJECT FOLDER ---
  if (selectedReport) {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-500 text-left">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
           <button 
             onClick={() => { setSelectedReport(null); setSelectedMeasurements([]); }}
             className={`flex items-center gap-4 px-8 py-5 rounded-2xl border-2 transition-all active:scale-95 shadow-xl font-black uppercase text-[10px] tracking-widest
               ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600'}`}
           >
              <ArrowLeft size={18} strokeWidth={3} /> Return to File Cabinet
           </button>
           
           <div className="flex items-center gap-5">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                 <ShieldCheck size={24} />
              </div>
              <div className="text-left">
                 <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] leading-none mb-2 italic">Active Data Source</p>
                 <h4 className={`text-2xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                    {selectedReport.projectName}
                 </h4>
              </div>
           </div>
         </div>
         
         <div className={`rounded-[4rem] border-2 shadow-2xl p-6 sm:p-14 transition-all duration-500
           ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            {isDrillingDown ? (
              <div className="py-32 flex flex-col items-center gap-6 opacity-30">
                <Loader2 className="animate-spin text-amber-500 w-10 h-10" />
                <p className="text-[11px] font-black uppercase tracking-widest italic">Reading Project Ledger...</p>
              </div>
            ) : (
              <BoQGenerator 
                projectId={selectedReport.id} 
                projectName={selectedReport.projectName} 
                measurements={selectedMeasurements} 
              />
            )}
         </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col space-y-12 animate-in fade-in duration-700 text-left">
      
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
             <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-inner">
                <Archive size={28} />
             </div>
             <p className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-500 italic">Technical Archive</p>
          </div>
          <h2 className={`text-5xl sm:text-6xl font-black uppercase italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
            File Cabinet<span className="text-amber-500">.</span>
          </h2>
          <p className={`text-base font-medium max-w-2xl leading-relaxed ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-600'}`}>
            Access archived project nodes. Every folder here is automatically updated with the latest site measurements saved in your project vault.
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <button 
            onClick={scanVault}
            className={`p-6 rounded-2xl border-2 transition-all active:scale-95 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-amber-500' : 'bg-white border-zinc-200 text-zinc-400'}`}
          >
            <RefreshCw size={24} />
          </button>
          <div className="relative flex-1 lg:flex-none">
             <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600" />
             <input 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Search Cabinet..." 
               className={`w-full lg:w-80 pl-16 pr-8 py-6 rounded-3xl border-2 font-black uppercase text-[10px] tracking-widest outline-none transition-all
                 ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200'}`}
             />
          </div>
        </div>
      </header>

      {filteredReports.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 pb-20">
          {filteredReports.map((report) => (
            <DocumentCard 
              key={report.id} 
              report={report} 
              onView={handleOpenFolder}
              theme={theme as 'light' | 'dark'} 
            />
          ))}
        </div>
      ) : (
        <div className={`p-24 sm:p-40 rounded-[4rem] border-2 border-dashed flex flex-col items-center justify-center gap-10 opacity-20
          ${theme === 'dark' ? 'border-zinc-800 bg-zinc-950/20' : 'border-zinc-200 bg-zinc-50'}`}>
          <FolderOpen size={100} strokeWidth={1} />
          <div className="text-center space-y-4">
            <p className="text-2xl font-black uppercase tracking-[0.4em] italic">Archive Standby</p>
            <p className="text-sm font-bold uppercase tracking-widest max-w-sm mx-auto">
              Complete a site measurement in the Technical Workspace to populate this cabinet.
            </p>
          </div>
        </div>
      )}

      <footer className="pt-20 border-t border-zinc-800/40 flex flex-col sm:flex-row justify-between items-center gap-8 opacity-30 pb-10">
        <div className="flex items-center gap-6">
          <ShieldCheck size={32} className="text-emerald-500" />
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Security: AES-256 Encrypted</p>
            <p className="text-[8px] font-mono uppercase tracking-tighter">DATA SOURCE: LOCAL VAULT • SMM-KE COMPLIANT</p>
          </div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[1em] italic text-zinc-700">QS VAULT OS</p>
      </footer>
    </div>
  );
};

export default ArtifactsVault;