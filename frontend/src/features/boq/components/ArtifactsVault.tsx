import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { db } from "../../../lib/database/database";
import BoQGenerator from "./BoQGenerator";

interface ReportItem {
  id: string;
  title: string;
  type: "PDF" | "XLS" | "DOC";
  status: "Draft" | "Certified" | "Archived";
  projectName: string;
  lastUpdated: string;
  version: string;
}

interface DocumentCardProps {
  report: ReportItem;
  onView: (report: ReportItem) => void;
  onDownload: (report: ReportItem) => void;
  isProcessing: boolean;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  report,
  onView,
  onDownload,
  isProcessing,
}) => (
  <div className="theme-card group relative flex flex-col justify-between overflow-hidden rounded-sm border p-5 transition-all duration-500 hover:border-[var(--app-accent-strong)] sm:p-6">
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="theme-card flex h-14 w-14 items-center justify-center rounded-sm text-[var(--app-meta)] shadow-inner transition-all duration-500 group-hover:border-[color-mix(in_srgb,var(--app-accent-strong)_20%,transparent)] group-hover:bg-[color-mix(in_srgb,var(--app-accent-strong)_10%,transparent)]">
        {report.type === "XLS" ? (
          <FileSpreadsheet
            className="transition-colors group-hover:text-[var(--app-accent-strong)]"
            size={24}
          />
        ) : (
          <FileText
            className="transition-colors group-hover:text-[var(--app-accent-strong)]"
            size={24}
          />
        )}
      </div>
      <div className="text-right">
        <span
          className={`rounded-full border-2 px-4 py-1.5 text-[9px] font-black uppercase tracking-widest
            ${
              report.status === "Draft"
                ? "theme-status-warning"
                : report.status === "Certified"
                  ? "theme-status-online"
                  : "theme-status-offline"
            }`}
        >
          {report.status}
        </span>
      </div>
    </div>

    <div className="mb-6 text-left">
      <p className="theme-admin-label mb-2 text-[var(--app-meta)]">
        Project: {report.projectName}
      </p>
      <h3 className="mb-2 text-[1.35rem] font-black uppercase leading-tight tracking-tight text-[var(--app-heading)]">
        {report.title}
      </h3>
      <div className="flex flex-wrap items-center gap-3 text-[0.74rem] font-semibold uppercase tracking-[0.12em] text-[var(--app-meta)]">
        <span>Rev {report.version}</span>
        <span className="h-1 w-1 rounded-full bg-[var(--app-border)]" />
        <span>Updated: {report.lastUpdated}</span>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <button
        onClick={() => onView(report)}
        className="theme-admin-control theme-button-secondary flex items-center justify-center gap-3 transition-all hover:bg-[color-mix(in_srgb,var(--app-secondary-fg)_10%,transparent)]"
      >
        <Eye size={14} /> Preview
      </button>
      <button
        onClick={() => onDownload(report)}
        disabled={report.status === "Archived" || isProcessing}
        className={`theme-admin-control flex items-center justify-center gap-3 shadow-xl transition-all
          ${
            report.status === "Archived"
              ? "cursor-not-allowed border-[var(--app-border)] bg-[var(--app-surface-elevated)] text-[var(--app-body)]"
              : "border-transparent bg-[var(--app-accent-strong)] text-[var(--app-primary-fg)] hover:opacity-90 active:scale-95"
          }`}
      >
        {isProcessing ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Download size={14} />
        )}
        Get {report.type}
      </button>
    </div>
  </div>
);

const ArtifactsVault: React.FC = () => {
  const { user, theme } = useAuth();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  useEffect(() => {
    const syncWithOfficeData = async () => {
      if (!user) {
        setTimeout(() => setLoading(false), 1200);
        return;
      }

      try {
        setLoading(true);
        const activeProjects = await db.projects.where("user_id").equals(user.id).toArray();
        const documentList: ReportItem[] = activeProjects.map((project) => ({
          id: project.id,
          title: "Bill of Quantities",
          projectName: project.name,
          type: "XLS",
          status: "Draft",
          lastUpdated: new Date(project.updated_at).toLocaleDateString(),
          version: "1.2.0",
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

  const handleOpenReport = (report: ReportItem) => {
    setSelectedReport(report);
  };

  const handleDownload = (report: ReportItem) => {
    setIsProcessing(report.id);
    setSelectedReport(report);
    window.setTimeout(() => setIsProcessing(null), 300);
  };

  if (loading) {
    return (
      <div className="py-40 text-center opacity-20">
        <Loader2 className="mx-auto mb-6 h-12 w-12 animate-spin text-amber-500" />
        <p className="text-[10px] font-black uppercase italic tracking-[0.5em]">
          Accessing File Cabinet...
        </p>
      </div>
    );
  }

  if (selectedReport) {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-500">
        <button
          onClick={() => setSelectedReport(null)}
          className={`mb-8 flex items-center gap-3 rounded-xl border-2 px-6 py-4 shadow-sm transition-all active:scale-95
            ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
                : "border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900"
            }`}
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          <span className="text-[10px] font-black uppercase tracking-widest">
            Back to Archives
          </span>
        </button>
        <BoQGenerator
          projectId={selectedReport.id}
          projectName={selectedReport.projectName}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 animate-in fade-in space-y-12 duration-700">
      <header className="flex shrink-0 flex-col items-start justify-between gap-5 text-left lg:flex-row lg:items-end">
        <div className="space-y-2">
          <h2 className="text-3xl font-black uppercase italic leading-none tracking-tighter text-[var(--app-heading)] sm:text-4xl">
            Project <span className="text-[var(--app-accent-strong)]">Reports.</span>
          </h2>
          <p className="theme-admin-label text-[var(--app-heading)]">
            Official Documents & Cost Records
          </p>
        </div>
        <button className="theme-admin-control flex items-center gap-3 rounded-sm border-none bg-[var(--app-accent-strong)] text-[var(--app-primary-fg)] transition-all hover:opacity-90 active:scale-95">
          <FileCheck size={18} className="stroke-[3px]" /> Prepare Final Report
        </button>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {reports.length > 0 ? (
          reports.map((report) => (
            <DocumentCard
              key={report.id}
              report={report}
              onView={handleOpenReport}
              onDownload={handleDownload}
              isProcessing={isProcessing === report.id}
            />
          ))
        ) : (
          <div className="theme-panel col-span-full flex flex-col items-center justify-center gap-5 rounded-[2rem] border border-dashed p-12 text-center opacity-40 shadow-none">
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

      <footer className="flex flex-col gap-4 border-t border-[var(--app-border)] pt-5 opacity-60 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck size={16} className="text-[var(--app-success)]" />
          <p className="theme-admin-label text-[var(--app-meta)]">
            Secure Office Records System
          </p>
        </div>
        <div className="flex gap-10">
          <div className="flex items-center gap-2">
            <Lock size={12} className="text-[var(--app-icon)]" />
            <span className="theme-admin-meta text-[0.72rem] uppercase text-[var(--app-meta)]">
              Encrypted
            </span>
          </div>
          <div className="flex items-center gap-2">
            <History size={12} className="text-[var(--app-accent-strong)]" />
            <span className="theme-admin-meta text-[0.72rem] uppercase text-[var(--app-meta)]">
              History Active
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ArtifactsVault;
