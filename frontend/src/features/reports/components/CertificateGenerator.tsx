/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useMemo } from 'react';
import { 
  FileCheck, 
  Printer, 
  Download, 
  ShieldCheck, 
  Clock, 
  UserCheck,
  Building2,
  FileText,
  AlertCircle,
  Signature
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
    const authMod = await import("../../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;
  } catch (e) {
    // Sandbox fallback
  }
};

resolveModules();

/** --- TYPES --- **/

interface IPCData {
  certNumber: string;
  valuationDate: string;
  contractor: string;
  contractSum: number;
  workExecuted: number;
  materialsOnSite: number;
  previousCertified: number;
  retentionPercent: number;
}

interface CertificateGeneratorProps {
  data: IPCData;
  projectName: string;
}

/** --- MAIN COMPONENT --- **/

const CertificateGenerator: React.FC<CertificateGeneratorProps> = ({ data, projectName }) => {
  const { theme } = useAuth();

  // Standard QS Certification Math
  const financials = useMemo(() => {
    const grossValuation = data.workExecuted + data.materialsOnSite;
    const retentionAmount = grossValuation * (data.retentionPercent / 100);
    const netValuation = grossValuation - retentionAmount;
    const currentAmountDue = netValuation - data.previousCertified;
    const vatAmount = currentAmountDue * 0.16;
    
    return {
      grossValuation,
      retentionAmount,
      netValuation,
      currentAmountDue,
      vatAmount,
      totalDue: currentAmountDue + vatAmount
    };
  }, [data]);

  return (
    <section className="flex-1 flex flex-col p-6 sm:p-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. Certificate HUD Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 shrink-0 text-left">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-amber-500 mb-2">
            <FileCheck size={28} />
            <h2 className={`text-4xl sm:text-5xl font-black uppercase italic tracking-tighter leading-none
              ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              Payment <span className="text-amber-500 text-opacity-80">Certificate.</span>
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 italic">
            Interim Payment Certificate Node • {data.certNumber}
          </p>
        </div>

        <div className="flex gap-4">
          <button className={`flex items-center gap-3 px-8 py-5 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95
            ${theme === 'dark' ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>
            <Printer size={16} /> Print Node
          </button>
          <button className="flex items-center gap-3 px-10 py-5 bg-amber-500 text-black rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-amber-500/20 hover:bg-amber-400 active:scale-95 transition-all">
            <Download size={16} /> Export PDF
          </button>
        </div>
      </header>

      {/* 2. Project & Contractor Identity Node */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Primary Node', value: projectName, icon: Building2 },
          { label: 'Main Contractor', value: data.contractor, icon: UserCheck },
          { label: 'Valuation Date', value: data.valuationDate, icon: Clock },
          { label: 'Contract Sum', value: `KES ${data.contractSum.toLocaleString()}`, icon: FileText },
        ].map((info, i) => (
          <div key={i} className={`p-6 rounded-4xl border ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'} text-left`}>
            <div className="flex items-center gap-3 mb-3 text-zinc-500">
              <info.icon size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">{info.label}</span>
            </div>
            <p className={`text-sm font-black uppercase tracking-tight truncate ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>
              {info.value}
            </p>
          </div>
        ))}
      </div>

      {/* 3. Main Certification Ledger */}
      <div className={`rounded-[3.5rem] border backdrop-blur-3xl overflow-hidden transition-all duration-500
        ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200 shadow-2xl'}`}>
        
        <div className="p-8 sm:p-12 space-y-10">
          {/* Section: Gross Valuation */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 italic text-left border-b border-zinc-800/40 pb-4">
              01. Gross Valuation Node
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-left">
                <span className="text-xs font-bold uppercase text-zinc-400">Total Work Executed to Date</span>
                <span className={`text-lg font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                  KES {data.workExecuted.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-left">
                <span className="text-xs font-bold uppercase text-zinc-400">Materials on Site (MOS)</span>
                <span className={`text-lg font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                  KES {data.materialsOnSite.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-zinc-800/20 text-left">
                <span className="text-xs font-black uppercase text-amber-500 italic">Sub-Total Gross Value</span>
                <span className="text-2xl font-black tracking-tighter text-amber-500 italic">
                  KES {financials.grossValuation.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Deductions */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 italic text-left border-b border-zinc-800/40 pb-4">
              02. Contractual Deductions
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-left">
                <span className="text-xs font-bold uppercase text-zinc-400">Retention Fund ({data.retentionPercent}%)</span>
                <span className="text-lg font-black tracking-tighter text-rose-500">
                  (KES {financials.retentionAmount.toLocaleString()})
                </span>
              </div>
              <div className="flex justify-between items-center text-left">
                <span className="text-xs font-bold uppercase text-zinc-400">Less: Previous Net Certification</span>
                <span className="text-lg font-black tracking-tighter text-rose-500">
                  (KES {data.previousCertified.toLocaleString()})
                </span>
              </div>
            </div>
          </div>

          {/* Section: Net Payment Allocation */}
          <div className={`p-10 rounded-[3rem] ${theme === 'dark' ? 'bg-zinc-950/60' : 'bg-zinc-50 border border-zinc-100'} flex flex-col md:flex-row justify-between items-center gap-8`}>
            <div className="text-left space-y-2">
              <div className="flex items-center gap-2 text-emerald-500">
                <ShieldCheck size={16} />
                <p className="text-[10px] font-black uppercase tracking-widest">Certified Net Amount Due</p>
              </div>
              <p className={`text-5xl font-black italic tracking-tighter leading-none
                ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                KES {financials.currentAmountDue.toLocaleString()}
              </p>
            </div>
            
            <div className="w-full md:w-px h-px md:h-20 bg-zinc-800/60" />

            <div className="text-right space-y-1">
              <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Including VAT node (16%)</p>
              <p className="text-2xl font-black italic tracking-tighter text-amber-500 opacity-80">
                TOTAL: KES {financials.totalDue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* 4. Certification Handshake Node (Signature Area) */}
        <div className={`p-12 border-t flex flex-col md:flex-row gap-12 text-left
          ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
          
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-3 opacity-40">
              <Signature size={14} className="text-zinc-500" />
              <p className="text-[9px] font-black uppercase tracking-widest leading-none">Authorized Quantity Surveyor</p>
            </div>
            <div className="h-20 border-b border-dashed border-zinc-700 flex items-end pb-2">
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest italic leading-none">AWAITING DIGITAL HANDSHAKE...</p>
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-3 opacity-40">
              <UserCheck size={14} className="text-zinc-500" />
              <p className="text-[9px] font-black uppercase tracking-widest leading-none">Authorized Client/PM Rep</p>
            </div>
            <div className="h-20 border-b border-dashed border-zinc-700 flex items-end pb-2">
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest italic leading-none">AWAITING REVIEW NODE...</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Compliance Verification Footer */}
      <footer className="flex flex-col sm:flex-row justify-between items-center opacity-30 gap-6">
        <div className="flex items-center gap-3">
          <AlertCircle size={18} className="text-amber-500" />
          <p className="text-[9px] font-black uppercase tracking-[0.5em] italic">Compliant with FIDIC / JBCC / SMM-KE Protocols</p>
        </div>
        <p className="text-[8px] font-black uppercase tracking-widest leading-none">
          Document GUID: {crypto.randomUUID().slice(0, 18).toUpperCase()} • PRO_NODE_L4
        </p>
      </footer>
    </section>
  );
};

export default CertificateGenerator;