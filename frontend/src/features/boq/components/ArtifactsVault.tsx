/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
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
  ArrowLeft
} from 'lucide-react';

// STANDARD IMPORTS: Guaranteed to be stable for your presentation
import { useAuth } from "../../auth/AuthContext";
import { db } from "../../../lib/database/database";
import BoQGenerator from "./BoQGenerator";

/** --- TYPES --- **/

interface ReportItem {
  id: string;
  title: string;
  type: 'PDF' | 'XLS' | 'DOC';
  status: 'Draft' | 'Certified' | 'Archived';
  projectName: string;
  lastUpdated: string;
  version: string;
}

/** --- SUB-COMPONENT: DOCUMENT NODE CARD --- **/

const DocumentCard: React.FC<{ 
  report: ReportItem; 
  onView: (report: ReportItem) => void;
  isProcessing: boolean;
  theme: 'light' | 'dark' 
}> = ({ report, onView, isProcessing, theme }) => (
  <div className={`p-8 rounded-[3rem] border-2 transition-all duration-500 group relative flex flex-col justify-between overflow-hidden shadow-2xl
    ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 hover:border-amber-500/30 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50 hover:border-amber-500/50 hover:shadow-xl'}`}>
    
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
      <div className="text-right">
        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border-2
          ${report.status === 'Draft' 
            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
          {report.status}
        </span>
      </div>
    </div>

    <div className="mb-10 text-left">
      <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] mb-2 italic leading-none">
        Project: {report.projectName}
      </p>
      <h3 className={`mb-3 text-2xl font-black uppercase italic tracking-tighter leading-tight
        ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
        {report.title}
      </h3>
      <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
        <span className={theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}>REV_{report.version}</span>
        <span className={`w-1 h-1 rounded-full ${theme === 'dark' ? 'bg-zinc-700' : 'bg-zinc-300'}`} />
        <span className={theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}>Sync: {report.lastUpdated}</span>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <button 
        onClick={() => onView(report)}
        className={`flex h-16 items-center justify-center gap-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 border-2
          ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 shadow-sm'}`}>
        <Eye size={16} strokeWidth={2.5} /> Open Document
      </button>
      <button 
        className={`flex h-16 items-center justify-center gap-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-amber-500/10 active:scale-95 border-2 border-amber-400
           bg-amber-500 text-black hover:bg-amber-400`}>
        {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} strokeWidth={2.5} />}
        Get {report.type}
      </button>
    </div>
  </div>
);

/** --- MAIN COMPONENT: OFFICE ARTIFACTS HUB --- **/

const ArtifactsVault: React.FC = () => {
  const { theme, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  /** * 1. VAULT HANDSHAKE
   * Scans the project database to build the document registry.
   */
  useEffect(() => {
    const syncWithOfficeData = async () => {
      if (!user || !db) {
        setTimeout(() => setLoading(false), 1200);
        return;
      }
      try {
        setLoading(true);
        const activeProjects = await db.projects.where('user_id').equals(user.id).toArray();
        
        const documentList: ReportItem[] = activeProjects.map((p: any) => ({
          id: p.id,
          title: `Bill of Quantities`,
          projectName: p.name,
          type: 'XLS',
          status: 'Draft',
          lastUpdated: new Date(p.updated_at).toLocaleDateString(),
          version: '1.2.0'
        }));

        setReports(documentList);
      } catch (err) {
        console.error("Archive connection failed.", err);
      } finally {
        setLoading(false);
      }
    };

    syncWithOfficeData();
  }, [user]);

  if (loading) {
    return (
      <div className="py-40 text-center opacity-20">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-6 text-amber-500" />
        <p className="font-black uppercase text-[10px] tracking-[0.5em] italic">Accessing File Cabinet...</p>
      </div>
    );
  }

  // --- VIEW DETAIL: BOQ GENERATOR HANDSHAKE ---
  if (selectedReport && BoQGenerator) {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-500">
         <button 
           onClick={() => setSelectedReport(null)}
           className={`mb-8 flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all active:scale-95 shadow-sm
             ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900'}`}
         >
            <ArrowLeft size={16} strokeWidth={2.5} />
            <span className="text-[10px] font-black uppercase tracking-widest">Back to Archives</span>
         </button>
         <BoQGenerator projectId={selectedReport.id} projectName={selectedReport.projectName} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col space-y-12 animate-in fade-in duration-700">
      
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 text-left px-2 sm:px-0">
        <div className="space-y-3">
          <h2 className={`text-5xl sm:text-6xl font-black uppercase italic tracking-tighter leading-none
            ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
            Archive <span className="text-amber-500">Vault.</span>
          </h2>
          <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.4em] sm:tracking-[0.5em] text-zinc-500 italic">
            Official Project Ledger & Statutory Reports
          </p>
        </div>
        <button className="px-10 py-5 sm:py-6 bg-amber-500 text-black font-black uppercase text-[10px] sm:text-xs tracking-widest rounded-3xl shadow-2xl shadow-amber-500/20 hover:bg-amber-400 active:scale-95 transition-all flex items-center gap-4 italic border-2 border-amber-300">
          <FileCheck size={20} strokeWidth={2.5} /> Compile Global Audit
        </button>
      </header>

      {reports.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 pb-20">
          {reports.map((report) => (
            <DocumentCard 
              key={report.id} 
              report={report} 
              onView={(r) => setSelectedReport(r)}
              isProcessing={false}
              theme={theme} 
            />
          ))}
        </div>
      ) : (
        <div className={`p-20 sm:p-32 rounded-[4rem] border-2 border-dashed flex flex-col items-center justify-center gap-10 opacity-40 transition-colors
          ${theme === 'dark' ? 'border-zinc-800 bg-zinc-950/40' : 'border-zinc-300 bg-zinc-50'}`}>
          <div className={`p-8 rounded-full border-2 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <Database size={80} className={theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'} strokeWidth={1.5} />
          </div>
          <div className="text-center space-y-4">
            <p className={`text-xl font-black uppercase tracking-[0.4em] italic ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Vault Storage Empty</p>
            <p className={`text-[10px] font-bold uppercase tracking-widest max-w-xs mx-auto ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'}`}>
              Measurement nodes must be secured before documents can be generated.
            </p>
          </div>
        </div>
      )}

      <footer className={`flex flex-col sm:flex-row justify-between items-center gap-8 border-t-2 pt-10 pb-10
        ${theme === 'dark' ? 'border-zinc-800/40 opacity-40' : 'border-zinc-200 opacity-60'}`}>
        <div className="flex items-center gap-5">
          <ShieldCheck size={28} className="text-emerald-500" strokeWidth={2.5} />
          <div className="text-left">
            <p className={`text-[11px] font-black uppercase tracking-widest leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-800'}`}>Immutable Office Records</p>
            <p className={`text-[9px] font-mono mt-1.5 uppercase ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'}`}>NODE_v4.5 • ISO_19650</p>
          </div>
        </div>
        <div className="flex gap-10">
          <div className="flex items-center gap-2">
            <Lock size={14} className={theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'} />
            <span className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'}`}>Encrypted Vault</span>
          </div>
          <div className="flex items-center gap-2">
            <History size={14} className="text-amber-500" />
            <span className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'}`}>Auto-Revision Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ArtifactsVault;