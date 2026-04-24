/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { 
  Maximize2, 
  Database, 
  Archive, 
  LayoutGrid, 
  Calculator, 
  MessageSquare,
  Zap,
  ShieldCheck,
  FileText,
  ClipboardCheck,
  Share2
} from "lucide-react";
import BoQGenerator from "../../../boq/components/BoQGenerator";
import CertificateGenerator from "../../../reports/components/CertificateGenerator";
import WhatsAppExport from "../../../reports/components/WhatsAppExport";
import ArtifactsVault from "../../../boq/components/ArtifactsVault";
import type { Measurement } from "../../types/takeoff";
import { useAuth } from "../../../auth/AuthContext";

interface ReportsWorkspaceProps {
  projectId: string;
  projectName: string;
  measurements: Measurement[];
}

/** --- MAIN COMPONENT: SIMPLIFIED REPORT HUB --- **/
const ReportsWorkspace = ({
  projectId,
  projectName,
  measurements,
}: ReportsWorkspaceProps) => {
  
  const { theme } = useAuth();

  // Quick total estimate for the preview dispatch node
  const estimatedTotal = measurements.reduce(
    (acc, item) => acc + Math.abs(item.value || 0) * 1000,
    0,
  );

  return (
    <div className={`flex-1 flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar p-4 sm:p-14 space-y-16 sm:space-y-32 animate-in fade-in duration-700 pb-40 transition-colors
      ${theme === 'dark' ? 'bg-[#050505]' : 'bg-zinc-50'}`}>
      
      {/* 1. MASTER HUB INTRO */}
      <div className={`max-w-6xl mx-auto w-full min-w-0 rounded-[3.5rem] border p-10 sm:p-14 shadow-2xl relative overflow-hidden transition-colors duration-500
        ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
        <div className="absolute top-0 right-0 p-10 opacity-5">
           <Zap size={120} className="text-amber-500" />
        </div>
        <div className="flex items-center gap-5 mb-4 text-left">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <LayoutGrid size={24} />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-500 italic">
            Reporting Workspace
          </p>
        </div>
        <h2 className={`text-4xl sm:text-5xl font-black uppercase italic tracking-tighter mb-6 leading-none transition-colors text-left
          ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
          Project Report Center<span className="text-amber-500">.</span>
        </h2>
        <p className={`text-base sm:text-lg font-medium leading-relaxed max-w-3xl transition-colors text-left
          ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Turn your site measurements into official project documents. Here, you can generate your <span className="text-amber-500 font-bold italic">Bill of Quantities (BoQ)</span> and <span className="text-amber-500 font-bold italic">Payment Certificates</span> based on the work you've recorded.
        </p>
      </div>

      {/* 2. SECTION 01: SAVED DOCUMENTS (Project File Cabinet) */}
      <div className="max-w-6xl mx-auto w-full space-y-10">
        <div className="flex items-center justify-between px-8 border-l-4 border-zinc-700">
           <div className="flex items-center gap-6 text-left">
              <div className={`w-10 h-10 rounded-full border flex items-center justify-center text-[10px] font-black text-zinc-500 transition-colors
                ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>01</div>
              <div className="text-left">
                 <h4 className={`text-xl font-black uppercase tracking-widest leading-none transition-colors ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>Project File Cabinet</h4>
                 <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mt-2 italic">Stored Documents & Past Reports</p>
              </div>
           </div>
           <Archive size={24} className={theme === 'dark' ? 'text-zinc-800' : 'text-zinc-300'} />
        </div>
        <div className={`rounded-[4rem] border overflow-hidden shadow-2xl transition-all duration-500
          ${theme === 'dark' ? 'border-zinc-800/60 bg-zinc-900/10 hover:border-zinc-700' : 'border-zinc-200 bg-white hover:border-amber-500/30'}`}>
           <ArtifactsVault />
        </div>
      </div>

      {/* 3. SECTION 02: CREATE BILL OF QUANTITIES (BoQ) */}
      <div className="max-w-6xl mx-auto w-full space-y-10">
        <div className="flex items-center justify-between px-8 border-l-4 border-amber-500">
           <div className="flex items-center gap-6 text-left">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[10px] font-black text-amber-500">02</div>
              <div className="text-left">
                 <h4 className={`text-xl font-black uppercase tracking-widest leading-none transition-colors ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Bill of Quantities (BoQ)</h4>
                 <p className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-500/80 mt-2 italic">Calculated Values for Every Work Item</p>
              </div>
           </div>
           <FileText size={24} className={theme === 'dark' ? 'text-amber-900' : 'text-amber-200'} />
        </div>
        <div className={`rounded-[4rem] border overflow-hidden shadow-2xl transition-colors duration-500
          ${theme === 'dark' ? 'border-zinc-800 bg-zinc-950/20' : 'border-zinc-200 bg-white'}`}>
           <BoQGenerator projectId={projectId} projectName={projectName} />
        </div>
      </div>

      {/* 4. SECTION 03: PREPARE PAYMENT CERTIFICATE */}
      <div className="max-w-6xl mx-auto w-full space-y-10">
        <div className="flex items-center justify-between px-8 border-l-4 border-rose-500">
           <div className="flex items-center gap-6 text-left">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-[10px] font-black text-rose-500">03</div>
              <div className="text-left">
                 <h4 className={`text-xl font-black uppercase tracking-widest leading-none transition-colors ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Payment Certificate</h4>
                 <p className="text-[9px] font-black uppercase tracking-[0.3em] text-rose-500/80 mt-2 italic">Monthly Claim for Completed Work</p>
              </div>
           </div>
           <ClipboardCheck size={24} className={theme === 'dark' ? 'text-rose-900' : 'text-rose-200'} />
        </div>
        <div className={`rounded-[4rem] border overflow-hidden shadow-2xl transition-colors duration-500
          ${theme === 'dark' ? 'border-zinc-800 bg-zinc-950/20' : 'border-zinc-200 bg-white'}`}>
           <CertificateGenerator projectId={projectId} projectName={projectName} />
        </div>
      </div>

      {/* 5. SECTION 04: SHARE WITH CLIENT */}
      <div className="max-w-6xl mx-auto w-full space-y-10">
        <div className="flex items-center justify-between px-8 border-l-4 border-emerald-500">
           <div className="flex items-center gap-6 text-left">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px] font-black text-emerald-500">04</div>
              <div className="text-left">
                 <h4 className={`text-xl font-black uppercase tracking-widest leading-none transition-colors ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Share with Client</h4>
                 <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-500/80 mt-2 italic">Quick Update via WhatsApp Link</p>
              </div>
           </div>
           <Share2 size={24} className={theme === 'dark' ? 'text-emerald-900' : 'text-emerald-200'} />
        </div>
        <div className={`border rounded-[4rem] p-4 transition-colors duration-500
          ${theme === 'dark' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50 border-emerald-100'}`}>
           <WhatsAppExport
             projectId={projectId}
             projectName={projectName}
           />
        </div>
      </div>

      {/* 6. SYSTEM FOOTER */}
      <footer className="pt-32 pb-20 text-center opacity-30 select-none">
        <div className="flex items-center justify-center gap-12 mb-10">
          <div className={`h-px w-40 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-300'}`} />
          <Database size={32} className={theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'} />
          <div className={`h-px w-40 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-300'}`} />
        </div>
        <p className={`text-[12px] font-black uppercase tracking-[1.5em] italic leading-none transition-colors
          ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
          SECURE PROJECT VAULT • PRECISION 2026
        </p>
        <div className="flex items-center justify-center gap-6 mt-10">
           <ShieldCheck size={16} className="text-emerald-500" />
           <span className={`text-[10px] font-mono transition-colors ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>VERIFIED DATA SOURCE • ISO 19650</span>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${theme === 'dark' ? '#27272a' : '#d4d4d8'}; border-radius: 20px; }
      `}</style>
    </div>
  );
};

export default ReportsWorkspace;