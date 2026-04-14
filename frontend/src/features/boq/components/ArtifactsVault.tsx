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
}> = ({ report, onDownload, isProcessing }) => (
  <div className={`p-5 sm:p-6 rounded-sm border transition-all duration-500 group relative flex flex-col justify-between overflow-hidden theme-card hover:border-[var(--app-accent-strong)]`}>
    
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className={`flex h-14 w-14 items-center justify-center rounded-sm transition-all duration-500 shadow-inner theme-card text-[var(--app-meta)] group-hover:bg-[color-mix(in_srgb,var(--app-accent-strong)_10%,transparent)] group-hover:border-[color-mix(in_srgb,var(--app-accent-strong)_20%,transparent)]`}>
        {report.type === 'XLS' ? (
          <FileSpreadsheet className="group-hover:text-[var(--app-accent-strong)] transition-colors" size={24} />
        ) : (
          <FileText className="group-hover:text-[var(--app-accent-strong)] transition-colors" size={24} />
        )}
      </div>
      <div className="text-right">
        <span className={`theme-admin-chip inline-flex border
          ${report.status === 'Draft' 
            ? 'theme-status-warning' 
            : report.status === 'Certified'
              ? 'theme-status-online'
              : 'theme-status-offline'}`}>
          {report.status}
        </span>
      </div>
    </div>

    <div className="mb-6 text-left">
      <p className="theme-admin-label mb-2 text-[var(--app-meta)]">
        Project: {report.projectName}
      </p>
      <h3 className={`mb-2 text-[1.35rem] font-black uppercase tracking-tight leading-tight text-[var(--app-heading)]`}>
        {report.title}
      </h3>
      <div className="flex flex-wrap items-center gap-3 text-[0.74rem] font-semibold text-[var(--app-meta)] uppercase tracking-[0.12em]">
        <span>Rev {report.version}</span>
        <span className="w-1 h-1 rounded-full bg-[var(--app-border)]" />
        <span>Updated: {report.lastUpdated}</span>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <button className={`theme-admin-control flex items-center justify-center gap-3 transition-all theme-button-secondary hover:bg-[color-mix(in_srgb,var(--app-secondary-fg)_10%,transparent)]`}>
        <Eye size={14} /> Preview
      </button>
      <button 
        onClick={() => onDownload(report.id)}
        disabled={report.status === 'Archived' || isProcessing}
        className={`theme-admin-control flex items-center justify-center gap-3 transition-all shadow-xl
          ${report.status === 'Archived' 
            ? 'bg-[var(--app-surface-elevated)] text-[var(--app-body)] cursor-not-allowed border-[var(--app-border)]' 
            : 'bg-[var(--app-accent-strong)] text-[var(--app-primary-fg)] hover:opacity-90 active:scale-95 border-transparent'}`}
      >
        {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        Get {report.type}
      </button>
    </div>
  </div>
);

/** --- MAIN COMPONENT: PROJECT REPORTS --- **/

const ArtifactsVault: React.FC = () => {
  const { user } = useAuth();
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
          <h2 className={`text-3xl sm:text-4xl font-black uppercase italic tracking-tighter leading-none text-[var(--app-heading)]`}>
            Project <span className="text-[var(--app-accent-strong)]">Reports.</span>
          </h2>
          <p className="theme-admin-label text-[var(--app-heading)]">
            Official Documents & Cost Records
          </p>
        </div>
        <button className="theme-admin-control flex items-center gap-3 rounded-sm bg-[var(--app-accent-strong)] hover:opacity-90 text-[var(--app-primary-fg)] border-none active:scale-95 transition-all">
          <FileCheck size={18} className="stroke-[3px]" /> Prepare Final Report
        </button>
      </header>

      {loading ? (
        <div className="py-16 text-center opacity-30">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[var(--app-icon)]" />
          <p className="theme-admin-label text-[var(--app-meta)]">Accessing File Cabinet...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {reports.length > 0 ? reports.map((report) => (
            <DocumentCard 
              key={report.id} 
              report={report} 
              onDownload={handleDownload}
              isProcessing={isProcessing === report.id}
            />
          )) : (
            <div className={`col-span-full flex flex-col items-center justify-center gap-5 rounded-[2rem] border border-dashed p-12 text-center opacity-40 theme-panel shadow-none`}>
              <Database size={48} className="text-[var(--app-meta)]" />
              <div>
                <p className="theme-admin-subheading text-[var(--app-heading)]">
                  No Documents Found
                </p>
                <p className="theme-admin-meta mt-2 text-[var(--app-meta)]">
                  Start a project measurement to generate reports.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <footer className="flex flex-col gap-4 border-t border-[var(--app-divider)] pt-5 opacity-60 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck size={16} className="text-[var(--app-success)]" />
          <p className="theme-admin-label text-[var(--app-meta)]">
            Secure Office Records System
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <Lock size={12} className="text-[var(--app-icon)]" />
            <span className="theme-admin-meta text-[0.72rem] uppercase text-[var(--app-meta)]">Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <History size={12} className="text-[var(--app-accent-strong)]" />
            <span className="theme-admin-meta text-[0.72rem] uppercase text-[var(--app-meta)]">History Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ArtifactsVault;
