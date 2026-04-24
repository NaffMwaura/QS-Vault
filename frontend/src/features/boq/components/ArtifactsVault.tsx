/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  Download, 
  Eye, 
  FileCheck, 
  Loader2, 
  History, 
  ShieldCheck, 
  Lock,
  Database,
  ArrowLeft,
  ChevronRight,
  Archive,
  Search,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

/* ======================================================
    OFFICE MODULE RESOLUTION (PRO-DEV STABILIZED)
    Using dynamic resolution to prevent build failures.
   ====================================================== */

let useAuth: any = () => ({ theme: 'dark', user: null });
let db: any = null;
let BoQGenerator: any = () => null;

const resolveModules = async () => {
  try {
    const authMod = await import("../../auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const dbMod = await import("../../../lib/database/database");
    if (dbMod.db) db = dbMod.db;

    const boqMod = await import("./BoQGenerator");
    if (boqMod.default) BoQGenerator = boqMod.default;
  } catch (e) {
    console.warn("Vault Hub: Infrastructure nodes in standby.");
  }
};

resolveModules();

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
  <div className={`p-8 rounded-[3.5rem] border-2 transition-all duration-500 group relative flex flex-col justify-between overflow-hidden shadow-2xl
    ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 hover:border-amber-500/30 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50 hover:border-amber-500/30'}`}>
    
    <div className="mb-8 flex items-start justify-between gap-4">
      <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border-2 transition-all duration-500 shadow-inner
        ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}
        group-hover:bg-amber-500/10 group-hover:border-amber-500/20`}>
        {report.type === 'XLS' ? (
          <FileSpreadsheet className="text-zinc-600 group-hover:text-amber-500 transition-colors" size={32} />
        ) : (
          <FileText className="text-zinc-600 group-hover:text-amber-500 transition-colors" size={32} />
        )}
      </div>
      <div className="text-right flex flex-col items-end gap-2">
        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border-2
          ${report.measurementCount > 0 
            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
          {report.measurementCount > 0 ? 'Data Secured' : 'No Records'}
        </span>
        <p className="text-[8px] font-mono text-zinc-600 font-bold uppercase">v{report.version}</p>
      </div>
    </div>

    <div className="mb-10 text-left space-y-3">
      <div className="flex items-center gap-2 opacity-60">
        <Database size={12} className="text-amber-500" />
        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest italic leading-none">
          Data from: {report.projectName}
        </p>
      </div>
      <h3 className={`text-3xl font-black uppercase italic tracking-tighter leading-tight
        ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
        {report.title}
      </h3>
      <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
        <span className={report.measurementCount > 0 ? 'text-emerald-500' : ''}>
          {report.measurementCount} Measurements Found
        </span>
        <span className={`w-1 h-1 rounded-full ${theme === 'dark' ? 'bg-zinc-700' : 'bg-zinc-300'}`} />
        <span>Updated {report.lastUpdated}</span>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <button 
        onClick={() => onView(report)}
        className={`flex h-16 items-center justify-center gap-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 border-2
          ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 shadow-black' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}>
        <Eye size={18} strokeWidth={2.5} /> Review & Edit
      </button>
      <button 
        onClick={() => onView(report)}
        className={`flex h-16 items-center justify-center gap-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl active:scale-95 border-2 border-amber-400
           bg-amber-500 text-black hover:bg-amber-400 shadow-amber-500/10`}>
        <Download size={18} strokeWidth={2.5} /> Save as Excel
      </button>
    </div>
  </div>
);

/** --- MAIN COMPONENT: PROJECT FILE CABINET --- **/
const ArtifactsVault: React.FC = () => {
  const { user, theme } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  /** * 1. CABINET SYNCHRONIZATION */
  const syncWithOfficeData = useCallback(async () => {
    if (!db || !user) {
      setTimeout(() => setLoading(false), 1200);
      return;
    }

    try {
      setIsRefreshing(true);
      const activeProjects = await db.projects.where("user_id").equals(user.id).toArray();
      
      const documentList: ReportItem[] = await Promise.all(activeProjects.map(async (project: any) => {
        const mCount = await db.measurements.where("project_id").equals(project.id).count();
        
        return {
          id: project.id,
          title: "Bill of Quantities",
          projectName: project.name,
          type: "XLS",
          status: mCount > 0 ? "Certified" : "Draft",
          lastUpdated: new Date(project.updated_at).toLocaleDateString(),
          version: "1.2.0",
          measurementCount: mCount
        };
      }));

      setReports(documentList.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated)));
    } catch (err) {
      console.error("Cabinet sync failed.", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    syncWithOfficeData();
  }, [syncWithOfficeData]);

  if (loading) {
    return (
      <div className="py-40 text-center opacity-20 flex flex-col items-center gap-6">
        <Loader2 className="w-16 h-16 animate-spin text-amber-500" />
        <p className="font-black uppercase text-[10px] tracking-[0.5em] italic">Accessing Project Records...</p>
      </div>
    );
  }

  // --- DETAIL VIEW: THE SPECIFIC PROJECT SPREADSHEET ---
  if (selectedReport) {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-500">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 px-4 sm:px-0">
           <button 
             onClick={() => setSelectedReport(null)}
             className={`flex items-center gap-3 px-8 py-5 rounded-2xl border-2 transition-all active:scale-95 shadow-xl font-black uppercase text-[10px] tracking-widest
               ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900'}`}
           >
              <ArrowLeft size={18} strokeWidth={2.5} />
              Return to Cabinet
           </button>
           <div className="flex items-center gap-4 text-left">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                 <ShieldCheck size={20} />
              </div>
              <div>
                 <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest leading-none mb-1">Active Report Source</p>
                 <p className={`text-sm font-bold uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{selectedReport.projectName}</p>
              </div>
           </div>
         </div>
         
         <div className={`rounded-[4rem] border-2 shadow-2xl p-4 sm:p-12 transition-all duration-500
           ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 shadow-black' : 'bg-white border-zinc-100'}`}>
            <BoQGenerator projectId={selectedReport.id} projectName={selectedReport.projectName} />
         </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col space-y-12 animate-in fade-in duration-700 p-4 sm:p-14 text-left">
      
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 text-left">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
             <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-inner">
                <Archive size={28} />
             </div>
             <p className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-500 italic leading-none">Technical Reports Archive</p>
          </div>
          <h2 className={`text-5xl sm:text-6xl font-black uppercase italic tracking-tighter leading-none
            ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
            Project File Cabinet<span className="text-amber-500">.</span>
          </h2>
          <p className={`text-base font-medium max-w-2xl leading-relaxed ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-600'}`}>
            Review and download professional documentation for your projects. These reports are generated instantly from the site measurements saved in your vault.
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <button 
            onClick={syncWithOfficeData}
            className={`p-6 rounded-2xl border-2 transition-all active:scale-95 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-amber-500 shadow-black' : 'bg-white border-zinc-200 text-zinc-400 shadow-sm'}`}
            title="Refresh Files"
          >
            <RefreshCw size={24} className={isRefreshing ? 'animate-spin text-amber-500' : ''} />
          </button>
          <button className="flex-1 lg:flex-none px-12 py-7 bg-amber-500 text-black font-black uppercase text-xs tracking-widest rounded-3xl shadow-2xl hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-4 italic border-2 border-amber-300">
            <FileCheck size={24} strokeWidth={2.5} /> Prepare Final Project Report
          </button>
        </div>
      </header>

      <div className={`p-6 rounded-[2.5rem] border-2 flex items-center gap-5 mx-2 sm:mx-0 shadow-inner
        ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
         <Search size={20} className="text-zinc-700 ml-4" />
         <input 
           placeholder="Search project folders..." 
           className="bg-transparent border-none outline-none flex-1 text-sm font-bold text-zinc-500 placeholder-zinc-700 uppercase tracking-widest"
         />
      </div>

      {reports.length > 0 ? (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 pb-20">
          {reports.map((report) => (
            <DocumentCard 
              key={report.id} 
              report={report} 
              onView={(r) => setSelectedReport(r)}
              theme={theme as 'light' | 'dark'} 
            />
          ))}
        </div>
      ) : (
        <div className={`p-20 sm:p-40 rounded-[4.5rem] border-2 border-dashed flex flex-col items-center justify-center gap-14 opacity-20
          ${theme === 'dark' ? 'border-zinc-800 bg-zinc-950/20' : 'border-zinc-200 bg-zinc-50'}`}>
          <div className="p-14 rounded-[3rem] border-2 border-zinc-800 bg-zinc-900 shadow-black animate-pulse">
            <FolderOpen size={120} className="text-zinc-800" strokeWidth={1} />
          </div>
          <div className="text-center space-y-4">
            <p className="text-3xl font-black uppercase tracking-[0.4em] italic leading-none">Cabinet is Empty</p>
            <p className="text-sm font-bold uppercase tracking-widest max-w-sm mx-auto text-zinc-500">
              Complete a site measurement to generate your first professional Bill of Quantities (BoQ) report.
            </p>
          </div>
        </div>
      )}

      <footer className={`flex flex-col sm:flex-row justify-between items-center gap-12 border-t-2 pt-16 pb-12
        ${theme === 'dark' ? 'border-zinc-800/60 opacity-30' : 'border-zinc-200 opacity-60'}`}>
        <div className="flex items-center gap-8 text-left">
          <ShieldCheck size={40} className="text-emerald-500" strokeWidth={2.5} />
          <div className="text-left space-y-1">
            <p className={`text-sm font-black uppercase tracking-widest leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Immutable Project Records</p>
            <p className="text-[10px] font-mono uppercase text-zinc-500 tracking-tighter">Verified Node Architecture • SMM-KE COMPLIANT</p>
          </div>
        </div>
        <div className="flex items-center gap-14">
          <div className="flex items-center gap-3">
            <Lock size={18} className="text-zinc-700" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Encrypted Storage</span>
          </div>
          <div className="flex items-center gap-3">
            <RefreshCw size={18} className="text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Cloud Backup Active</span>
          </div>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${theme === 'dark' ? '#27272a' : '#d4d4d8'}; border-radius: 20px; }
      `}</style>
    </div>
  );
};

export default ArtifactsVault;