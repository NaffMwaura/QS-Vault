 
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
  Database
} from 'lucide-react';
import { useAuth } from "../../../features/auth/AuthContext";
import { db, type Project } from "../../../lib/database/database";

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

const DocumentCard: React.FC<{ 
  report: ReportItem; 
  onDownload: (id: string) => void;
  isProcessing: boolean;
  theme: 'light' | 'dark' 
}> = ({ report, onDownload, isProcessing, theme }) => (
  <div className={`p-5 sm:p-6 rounded-[1.8rem] border transition-all duration-500 group relative flex flex-col justify-between overflow-hidden
    ${theme === 'dark' 
      ? 'bg-zinc-900/40 border-zinc-800 hover:border-amber-500/30 shadow-2xl' 
      : 'bg-white border-zinc-200 hover:border-amber-500/30 shadow-xl'}`}>
    
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className={`flex h-14 w-14 items-center justify-center rounded-[1.2rem] transition-all duration-500 shadow-inner
        ${theme === 'dark' ? 'bg-zinc-950 border border-zinc-800' : 'bg-zinc-50 border border-zinc-100'}
        group-hover:bg-amber-500/10 group-hover:border-amber-500/20`}>
        {report.type === 'XLS' ? (
          <FileSpreadsheet className="text-zinc-600 group-hover:text-amber-500 transition-colors" size={24} />
        ) : (
          <FileText className="text-zinc-600 group-hover:text-amber-500 transition-colors" size={24} />
        )}
      </div>
      <div className="text-right">
        <span className={`theme-admin-chip inline-flex border
          ${report.status === 'Draft' 
            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
            : report.status === 'Certified'
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
              : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
          {report.status}
        </span>
      </div>
    </div>

    <div className="mb-6 text-left">
      <p className="theme-admin-label mb-2">
        Project: {report.projectName}
      </p>
      <h3 className={`mb-2 text-[1.35rem] font-black uppercase tracking-tight leading-tight
        ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
        {report.title}
      </h3>
      <div className="flex flex-wrap items-center gap-3 text-[0.74rem] font-semibold text-zinc-500 uppercase tracking-[0.12em]">
        <span>Rev {report.version}</span>
        <span className="w-1 h-1 rounded-full bg-zinc-800" />
        <span>Updated: {report.lastUpdated}</span>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <button className={`theme-admin-control flex items-center justify-center gap-3 transition-all
        ${theme === 'dark' ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}>
        <Eye size={14} /> Preview
      </button>
      <button 
        onClick={() => onDownload(report.id)}
        disabled={report.status === 'Archived' || isProcessing}
        className={`theme-admin-control flex items-center justify-center gap-3 transition-all shadow-xl
          ${report.status === 'Archived' 
            ? 'bg-zinc-950 text-zinc-800 cursor-not-allowed border border-zinc-900' 
            : 'bg-amber-500 text-black shadow-amber-500/20 hover:bg-amber-400 active:scale-95'}`}
      >
        {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        Get {report.type}
      </button>
    </div>
  </div>
);

/** --- MAIN COMPONENT: PROJECT REPORTS --- **/

const ArtifactsVault: React.FC = () => {
  const { theme, user } = useAuth();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncWithOfficeData = async () => {
      if (!user || !db) {
        setLoading(false);
        return;
      }
      try {
        // Fetch real projects to generate a "Document List"
        const activeProjects = await db.projects.where('user_id').equals(user.id).toArray();
        
        const documentList: ReportItem[] = activeProjects.map((p: Project) => ({
          id: p.id,
          title: `Bill of Quantities`,
          projectName: p.name,
          type: 'XLS',
          status: 'Draft',
          lastUpdated: new Date(p.updated_at).toLocaleDateString(),
          version: '1.0.0'
        }));

        setReports(documentList);
      } catch (err) {
        console.error("Database connection failed:", err);
      } finally {
        setLoading(false);
      }
    };

    syncWithOfficeData();
  }, [user]);

  const handleDownload = (id: string) => {
    setIsProcessing(id);
    setTimeout(() => setIsProcessing(null), 1500);
  };

  return (
    <div className="flex-1 flex flex-col space-y-8 p-5 sm:p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <header className="flex shrink-0 flex-col items-start justify-between gap-5 text-left lg:flex-row lg:items-end">
        <div className="space-y-2">
          <h2 className={`text-3xl sm:text-4xl font-black uppercase italic tracking-tighter leading-none
            ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
            Project <span className="text-amber-500">Reports.</span>
          </h2>
          <p className="theme-admin-label">
            Official Documents & Cost Records
          </p>
        </div>
        <button className="theme-admin-control flex items-center gap-3 rounded-[1.2rem] bg-amber-500 text-black shadow-2xl shadow-amber-500/20 hover:bg-amber-400 active:scale-95 transition-all">
          <FileCheck size={18} className="stroke-[3px]" /> Prepare Final Report
        </button>
      </header>

      {loading ? (
        <div className="py-16 text-center opacity-30">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="theme-admin-label">Accessing File Cabinet...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {reports.length > 0 ? reports.map((report) => (
            <DocumentCard 
              key={report.id} 
              report={report} 
              onDownload={handleDownload}
              isProcessing={isProcessing === report.id}
              theme={theme} 
            />
          )) : (
            <div className={`col-span-full flex flex-col items-center justify-center gap-5 rounded-[2rem] border border-dashed p-12 text-center opacity-40
              ${theme === 'dark' ? 'border-zinc-800 bg-zinc-950/20' : 'border-zinc-300 bg-zinc-50'}`}>
              <Database size={48} className="text-zinc-700" />
              <div>
                <p className="theme-admin-subheading">
                  No Documents Found
                </p>
                <p className="theme-admin-meta mt-2">
                  Start a project measurement to generate reports.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <footer className="flex flex-col gap-4 border-t border-[color:var(--app-divider)] pt-5 opacity-60 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck size={16} className="text-emerald-500" />
          <p className="theme-admin-label">
            Secure Office Records System
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <Lock size={12} className="text-zinc-600" />
            <span className="theme-admin-meta text-[0.72rem] uppercase">Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <History size={12} className="text-amber-500" />
            <span className="theme-admin-meta text-[0.72rem] uppercase">History Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ArtifactsVault;
