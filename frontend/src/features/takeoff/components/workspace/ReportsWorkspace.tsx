import React from "react";
import {  
  Database, 
  Archive, 
  LayoutGrid,
  ShieldCheck,
  FileText,
  ClipboardCheck,
  Share2,
  TrendingUp,
  
} from "lucide-react";

// Standard Infrastructure Imports
import { useAuth } from "../../../auth/AuthContext";

// Specialized Reporting Components
import BoQGenerator from "../../../boq/components/BoQGenerator";
import CertificateGenerator from "../../../reports/components/CertificateGenerator";
import WhatsAppExport from "../../../reports/components/WhatsAppExport";
import ArtifactsVault from "../../../boq/components/ArtifactsVault";

// Master Types
import type { Measurement } from "../../types/takeoff";

interface ReportsWorkspaceProps {
  projectId: string;
  projectName: string;
  measurements: Measurement[];
}

/** --- MAIN COMPONENT: THE REPORTING HUB --- **/
const ReportsWorkspace: React.FC<ReportsWorkspaceProps> = ({
  projectId,
  projectName,
  measurements
}) => {
  const { theme } = useAuth();

  // Calculate high-level summary for the dashboard
  const totalValue = measurements.reduce((acc, curr) => acc + (curr.value || 0), 0);

  return (
    <div className={`flex-1 flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar p-6 sm:p-14 space-y-16 sm:space-y-24 animate-in fade-in duration-700 pb-40 transition-colors
      ${theme === 'dark' ? 'bg-[#050505]' : 'bg-zinc-50'}`}>
      
      {/* 1. HUB HEADER: PROJECT OVERVIEW */}
      <div className={`max-w-6xl mx-auto w-full rounded-[3.5rem] border-2 p-10 sm:p-14 shadow-2xl relative overflow-hidden transition-all duration-500
        ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
        
        <div className="absolute top-0 right-0 p-12 opacity-5">
           <TrendingUp size={150} className="text-amber-500" />
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 relative z-10">
          <div className="text-left space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <LayoutGrid size={24} />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-500 italic">Office Environment</p>
            </div>
            <h2 className={`text-4xl sm:text-6xl font-black uppercase italic tracking-tighter leading-none transition-colors
              ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
              Report Center<span className="text-amber-500">.</span>
            </h2>
            <p className={`text-base sm:text-lg font-medium leading-relaxed max-w-2xl transition-colors
              ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Transforming <span className="text-amber-500 font-bold">{measurements.length} captured nodes</span> into professional 
              <span className="text-zinc-100 font-bold mx-1">SMM-KE</span> documentation for project {projectName}.
            </p>
          </div>

          {/* QUICK STAT CHIP */}
          <div className="bg-zinc-900/80 border-2 border-zinc-800 p-8 rounded-[2.5rem] min-w-240px] shadow-2xl backdrop-blur-xl">
             <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.3em] mb-2">Current Ledger Total</p>
             <div className="flex items-end gap-2">
                <h4 className="text-4xl font-black italic tracking-tighter text-white">
                  {totalValue.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </h4>
                <span className="text-sm font-black text-amber-500 uppercase mb-1.5">Units</span>
             </div>
          </div>
        </div>
      </div>

      {/* 2. STEP 01: ARCHIVE (PROJECT FILE CABINET) */}
      <div className="max-w-6xl mx-auto w-full space-y-8">
        <div className="flex items-center justify-between px-8 border-l-4 border-zinc-700">
           <div className="flex items-center gap-6 text-left">
              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-[10px] font-black transition-colors
                ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-white border-zinc-200 text-zinc-400'}`}>01</div>
              <div className="text-left">
                 <h4 className={`text-2xl font-black uppercase tracking-tighter leading-none italic ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>Archive Vault</h4>
                 <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mt-2 italic">Historical Reports & Uploaded Media</p>
              </div>
           </div>
           <Archive size={28} className="text-zinc-800" />
        </div>
        <div className={`rounded-[4rem] border-2 overflow-hidden shadow-2xl transition-all duration-500
          ${theme === 'dark' ? 'border-zinc-800/60 bg-zinc-950/20' : 'bg-white border-zinc-100'}`}>
           <ArtifactsVault />
        </div>
      </div>

      {/* 3. STEP 02: BILL OF QUANTITIES (BoQ) */}
      <div className="max-w-6xl mx-auto w-full space-y-8">
        <div className="flex items-center justify-between px-8 border-l-4 border-amber-500">
           <div className="flex items-center gap-6 text-left">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center text-[10px] font-black text-amber-500">02</div>
              <div className="text-left">
                 <h4 className={`text-2xl font-black uppercase tracking-tighter leading-none italic ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Quantities (BoQ)</h4>
                 <p className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-500/60 mt-2 italic">Live Pricing & Unit Consolidation</p>
              </div>
           </div>
           <FileText size={28} className="text-amber-500 opacity-20" />
        </div>
        <div className={`rounded-[4rem] border-2 overflow-hidden shadow-2xl transition-all duration-500
          ${theme === 'dark' ? 'border-zinc-800 bg-zinc-950/40' : 'bg-white border-zinc-200'}`}>
           <BoQGenerator 
             projectId={projectId} 
             projectName={projectName} 
             measurements={measurements} 
           />
        </div>
      </div>

      {/* 4. STEP 03: PAYMENT CERTIFICATE */}
      <div className="max-w-6xl mx-auto w-full space-y-8">
        <div className="flex items-center justify-between px-8 border-l-4 border-rose-500">
           <div className="flex items-center gap-6 text-left">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border-2 border-rose-500/20 flex items-center justify-center text-[10px] font-black text-rose-500">03</div>
              <div className="text-left">
                 <h4 className={`text-2xl font-black uppercase tracking-tighter leading-none italic ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Payment Claim</h4>
                 <p className="text-[9px] font-black uppercase tracking-[0.3em] text-rose-500/60 mt-2 italic">Interim Valuation & Certificates</p>
              </div>
           </div>
           <ClipboardCheck size={28} className="text-rose-500 opacity-20" />
        </div>
        <div className={`rounded-[4rem] border-2 overflow-hidden shadow-2xl transition-all duration-500
          ${theme === 'dark' ? 'border-zinc-800 bg-zinc-950/40' : 'bg-white border-zinc-200'}`}>
           <CertificateGenerator 
             projectId={projectId} 
             projectName={projectName} 
           />
        </div>
      </div>

      {/* 5. STEP 04: DISPATCH NODE (WhatsApp/Share) */}
      <div className="max-w-6xl mx-auto w-full space-y-8">
        <div className="flex items-center justify-between px-8 border-l-4 border-emerald-500">
           <div className="flex items-center gap-6 text-left">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center text-[10px] font-black text-emerald-500">04</div>
              <div className="text-left">
                 <h4 className={`text-2xl font-black uppercase tracking-tighter leading-none italic ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Client Handshake</h4>
                 <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-500/60 mt-2 italic">Instant Mobile Export & Sharing</p>
              </div>
           </div>
           <Share2 size={28} className="text-emerald-500 opacity-20" />
        </div>
        <div className={`rounded-[3.5rem] border-2 p-10 transition-all duration-500
          ${theme === 'dark' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50 border-emerald-100'}`}>
           <WhatsAppExport
             projectId={projectId}
             projectName={projectName}
             measurements={measurements}
           />
        </div>
      </div>

      {/* 6. CONTINUOUS MACHINE FOOTER */}
      <footer className="pt-32 pb-20 text-center opacity-30 select-none">
        <div className="flex items-center justify-center gap-10 mb-10">
          <div className={`h-px w-40 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-300'}`} />
          <Database size={32} className={theme === 'dark' ? 'text-zinc-700' : 'text-zinc-400'} />
          <div className={`h-px w-40 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-300'}`} />
        </div>
        <p className={`text-[12px] font-black uppercase tracking-[1.5em] italic leading-none transition-colors
          ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
          DATA FLOW SECURED • QS VAULT 2026
        </p>
        <div className="flex items-center justify-center gap-6 mt-12">
           <ShieldCheck size={18} className="text-emerald-500" />
           <span className={`text-[9px] font-mono tracking-widest ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>
             CONTINUOUS SYNC ACTIVE • ISO 19650 COMPLIANT
           </span>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${theme === 'dark' ? '#27272a' : '#d4d4d8'}; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
      `}</style>
    </div>
  );
};

export default ReportsWorkspace;