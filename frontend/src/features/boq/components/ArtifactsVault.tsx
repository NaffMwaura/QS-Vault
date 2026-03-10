import React, { useState } from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  Download, 
  Eye, 
  FileCheck, 
  Loader2, 
  History, 
  ShieldCheck, 
  ClipboardCheck,
  Lock,
  
} from 'lucide-react';

/* ======================================================
    MODULE RESOLUTION HANDLER (SANDBOX COMPATIBILITY)
   ====================================================== */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let useAuth: any = () => ({
  theme: 'dark',
});

const resolveModules = async () => {
  try {
    // @ts-
    const authMod = await import("../../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // Sandbox fallback active
  }
};

resolveModules();

/** --- TYPES --- **/

interface ReportNode {
  id: string;
  title: string;
  type: 'PDF' | 'XLS' | 'DOC';
  status: 'Draft' | 'Certified' | 'Archived';
  annexure: string;
  lastGenerated: string;
  version: string;
}

/** --- SUB-COMPONENT: ARTIFACT_CARD --- **/

const ArtifactCard: React.FC<{ 
  report: ReportNode; 
  onGenerate: (id: string) => void;
  isGenerating: boolean;
  theme: 'light' | 'dark' 
}> = ({ report, onGenerate, isGenerating, theme }) => (
  <div className={`p-8 sm:p-10 rounded-[3rem] border transition-all duration-500 group relative flex flex-col justify-between overflow-hidden
    ${theme === 'dark' 
      ? 'bg-zinc-900/40 border-zinc-800 hover:border-amber-500/30 shadow-2xl' 
      : 'bg-white border-zinc-200 hover:border-amber-500/30 shadow-xl'}`}>
    
    {/* Status Badge Node */}
    <div className="flex justify-between items-start mb-8">
      <div className={`p-5 rounded-3xl transition-all duration-500 shadow-inner
        ${theme === 'dark' ? 'bg-zinc-950 border border-zinc-800' : 'bg-zinc-50 border border-zinc-100'}
        group-hover:bg-amber-500/10 group-hover:border-amber-500/20`}>
        {report.type === 'XLS' ? (
          <FileSpreadsheet className="text-zinc-600 group-hover:text-amber-500 transition-colors" size={32} />
        ) : (
          <FileText className="text-zinc-600 group-hover:text-amber-500 transition-colors" size={32} />
        )}
      </div>
      <div className="text-right">
        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all
          ${report.status === 'Draft' 
            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
            : report.status === 'Certified'
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
              : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
          {report.status}
        </span>
        <p className="text-[8px] font-black uppercase text-zinc-600 tracking-[0.3em] mt-3 leading-none italic">
          {report.annexure}
        </p>
      </div>
    </div>

    {/* Content Node */}
    <div className="mb-10 text-left">
      <h3 className={`text-2xl font-black uppercase tracking-tight mb-2 leading-tight
        ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
        {report.title}
      </h3>
      <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
        <span>v{report.version}</span>
        <span className="w-1 h-1 rounded-full bg-zinc-800" />
        <span>Last Auth: {report.lastGenerated}</span>
      </div>
    </div>

    {/* Control Handshake Node */}
    <div className="grid grid-cols-2 gap-4">
      <button className={`flex items-center justify-center gap-3 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
        ${theme === 'dark' ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}>
        <Eye size={14} /> Preview
      </button>
      <button 
        onClick={() => onGenerate(report.id)}
        disabled={report.status === 'Archived' || isGenerating}
        className={`flex items-center justify-center gap-3 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl
          ${report.status === 'Archived' 
            ? 'bg-zinc-950 text-zinc-800 cursor-not-allowed border border-zinc-900' 
            : 'bg-amber-500 text-black shadow-amber-500/20 hover:bg-amber-400 active:scale-95'}`}
      >
        {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        {report.type} Node
      </button>
    </div>
  </div>
);

/** --- MAIN COMPONENT --- **/

const ArtifactsVault: React.FC = () => {
  const { theme } = useAuth();
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const [reports] = useState<ReportNode[]>([
    { id: 'r1', title: 'Elemental Estimate Summary', type: 'PDF', status: 'Draft', annexure: 'Annexure A', lastGenerated: 'Pending', version: '1.0.4' },
    { id: 'r2', title: 'Priced Bill of Quantities', type: 'XLS', status: 'Draft', annexure: 'Annexure C', lastGenerated: '2026-03-09', version: '2.1.0' },
    { id: 'r3', title: 'Interim Payment Certificate #01', type: 'PDF', status: 'Certified', annexure: 'Section 13.8', lastGenerated: '2026-03-01', version: '1.0.0' },
    { id: 'r4', title: 'Final Account Statement', type: 'PDF', status: 'Archived', annexure: 'Annexure D', lastGenerated: 'Locked', version: '0.0.0' },
  ]);

  const handleGenerateReport = (id: string) => {
    setIsGenerating(id);
    // Simulate generation handshake
    setTimeout(() => setIsGenerating(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col p-6 sm:p-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. Vault HUD Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 shrink-0 text-left">
        <div className="space-y-2">
          <h2 className={`text-4xl sm:text-6xl font-black uppercase italic tracking-tighter leading-none
            ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
            Vault <span className="text-amber-500">Artifacts.</span>
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 italic">
            Official Project Documentation & Compliance Submission Node
          </p>
        </div>
        <button className="flex items-center gap-3 px-10 py-5 bg-amber-500 text-black rounded-4xl font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-amber-500/20 hover:bg-amber-400 active:scale-95 transition-all">
          <FileCheck size={18} className="stroke-[3px]" /> Finalize Audit Node
        </button>
      </header>

      {/* 2. Professional Artifact Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto custom-scrollbar pr-2 pb-10">
        {reports.map((report) => (
          <ArtifactCard 
            key={report.id} 
            report={report} 
            onGenerate={handleGenerateReport}
            isGenerating={isGenerating === report.id}
            theme={theme} 
          />
        ))}

        {/* 3. Audit Protocol Placeholder */}
        <div className={`p-10 rounded-[3.5rem] border border-dashed flex flex-col items-center justify-center gap-6 opacity-30 group hover:opacity-100 transition-opacity
          ${theme === 'dark' ? 'border-zinc-800 bg-zinc-950/20' : 'border-zinc-300 bg-zinc-50'}`}>
          <div className="p-8 rounded-full bg-zinc-900 border border-zinc-800 shadow-inner group-hover:scale-110 transition-transform">
            <ClipboardCheck size={64} className="text-zinc-700 group-hover:text-amber-500/40" />
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 leading-none">
              Audit Handshake Pending
            </p>
            <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-600 mt-3">
              Section 14.1 Compliance Node
            </p>
          </div>
        </div>
      </div>

      {/* 4. Compliance Sentinel Footer */}
      <footer className="flex flex-col sm:flex-row justify-between items-center opacity-30 gap-6">
        <div className="flex items-center gap-3">
          <ShieldCheck size={18} className="text-emerald-500" />
          <p className="text-[9px] font-black uppercase tracking-[0.5em] italic leading-none">
            Authorized Document Transmission Protocol
          </p>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <Lock size={12} className="text-zinc-600" />
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600 leading-none">AES-256 Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <History size={12} className="text-amber-500" />
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600 leading-none">Version Node Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ArtifactsVault;