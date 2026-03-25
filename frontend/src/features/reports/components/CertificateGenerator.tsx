/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { 
  FileCheck, 
  Printer, 
  Download, 
  ShieldCheck, 
  Clock, 
  UserCheck,
  Building2,
  AlertCircle,
  Signature,
  Loader2,
  Wallet,
  CheckCircle2
} from 'lucide-react';

/* ======================================================
    OFFICE MODULE RESOLUTION (OFFLINE-READY)
   ====================================================== */

let useAuth: any = () => ({ theme: 'dark' });
let db: any = null;
let Button: any = ({ children, onClick, className}: any) => (
  <button onClick={onClick} className={className}>{children}</button>
);

const resolveModules = async () => {
  try {
    const authMod = await import("../../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const dbMod = await import("../../../lib/database/database");
    if (dbMod.db) db = dbMod.db;

    const btnMod = await import("../../../components/ui/Button");
    if (btnMod.default) Button = btnMod.default;
  } catch (e) {
    // Sandbox shims active
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
  projectId: string;
  projectName: string;
}

/** --- MAIN COMPONENT: PAYMENT CERTIFICATE ENGINE --- **/

const CertificateGenerator: React.FC<CertificateGeneratorProps> = ({ projectId, projectName }) => {
  const { theme } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Core Valuation State
  const [data, setData] = useState<IPCData>({
    certNumber: "IPC/001",
    valuationDate: new Date().toLocaleDateString(),
    contractor: "Loading...",
    contractSum: 0,
    workExecuted: 0,
    materialsOnSite: 0,
    previousCertified: 0,
    retentionPercent: 10 // Standard Kenya Default
  });

  /** * DATA HANDSHAKE: FINANCIAL AGGREGATION
   * Pulls actual financial data from the project vault and sums up bill items.
   */
  const loadFinancials = useCallback(async () => {
    if (!db || !projectId) {
      setTimeout(() => setLoading(false), 1000);
      return;
    }

    try {
      setLoading(true);
      
      // 1. Fetch Master Project Node
      const project = await db.projects.get(projectId);
      
      // 2. Aggregate Work Executed (Sum of all priced takeoff items)
      const billItems = await db.bill_items.where('project_id').equals(projectId).toArray();
      const totalExecuted = billItems.reduce((acc: number, item: any) => acc + (item.quantity * item.rate), 0);

      setData(prev => ({
        ...prev,
        contractSum: project?.contract_sum || 0,
        workExecuted: totalExecuted,
        contractor: project?.client_name || "Assigned Contractor",
        valuationDate: new Date().toLocaleDateString()
      }));
    } catch (err) {
      console.error("Valuation Engine: Data harvest failed.", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadFinancials();
  }, [loadFinancials]);

  /** * CERTIFICATION LOGIC (SMM-KE COMPLIANT)
   * High-precision math for the final payment claim.
   */
  const financials = useMemo(() => {
    const grossValuation = data.workExecuted + data.materialsOnSite;
    const retentionAmount = grossValuation * (data.retentionPercent / 100);
    const netValuation = grossValuation - retentionAmount;
    const currentAmountDue = netValuation - data.previousCertified;
    const vatAmount = currentAmountDue * 0.16; // 16% Kenya VAT
    
    return {
      grossValuation,
      retentionAmount,
      netValuation,
      currentAmountDue,
      vatAmount,
      totalDue: currentAmountDue + vatAmount
    };
  }, [data]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-40 opacity-20">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-amber-500" />
        <p className="font-black text-[10px] uppercase tracking-[0.4em]">Compiling Financial Data...</p>
      </div>
    );
  }

  return (
    <section className="flex-1 flex flex-col p-6 sm:p-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left">
      
      {/* 1. REPORT HEADER: MASTER ACTIONS */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 shrink-0">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-amber-500 mb-2">
            <FileCheck size={32} className="stroke-[2.5px]" />
            <h2 className={`text-4xl sm:text-6xl font-black uppercase italic tracking-tighter leading-none
              ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              Payment <span className="text-amber-500/80">Certificate.</span>
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">
            Official Interim Valuation • {data.certNumber} • {projectName}
          </p>
        </div>

        <div className="flex gap-4">
          <Button 
            variant="outline" 
            className="px-8 py-5" 
            leftIcon={<Printer size={16} />}
          >
            Print Draft
          </Button>
          <Button 
            variant="primary" 
            className="px-10 py-5" 
            leftIcon={<Download size={16} />}
          >
            Export PDF
          </Button>
        </div>
      </header>

      {/* 2. PROJECT OVERVIEW NODES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Work Area', value: projectName, icon: Building2 },
          { label: 'Primary Client', value: data.contractor, icon: UserCheck },
          { label: 'Report Date', value: data.valuationDate, icon: Clock },
          { label: 'Contract Sum', value: `KES ${data.contractSum.toLocaleString()}`, icon: Wallet },
        ].map((info, i) => (
          <div key={i} className={`p-6 rounded-[2.5rem] border shadow-sm transition-all duration-500
            ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <div className="flex items-center gap-3 mb-4 text-zinc-600">
              <info.icon size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">{info.label}</span>
            </div>
            <p className={`text-xs sm:text-sm font-black uppercase tracking-tight truncate ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-900'}`}>
              {info.value || 'Not Defined'}
            </p>
          </div>
        ))}
      </div>

      {/* 3. PROFESSIONAL VALUATION LEDGER */}
      <div className={`rounded-[3.5rem] border backdrop-blur-3xl overflow-hidden transition-all duration-500
        ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800 shadow-2xl shadow-black' : 'bg-white border-zinc-200'}`}>
        
        <div className="p-8 sm:p-14 space-y-12">
          
          {/* Section 01: Work Done */}
          <div className="space-y-8">
            <div className="flex items-center gap-4 border-b border-zinc-800/40 pb-4">
               <span className="px-3 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 font-mono text-[10px] font-black leading-none">01</span>
               <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">Project Progress Valuation</h3>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center group">
                <span className="text-sm font-bold uppercase text-zinc-500 group-hover:text-zinc-300 transition-colors">Measured Work to Date</span>
                <span className={`text-xl font-black italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                  KES {data.workExecuted.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-sm font-bold uppercase text-zinc-500 group-hover:text-zinc-300 transition-colors">Stored Materials on Site</span>
                <span className={`text-xl font-black italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                  KES {data.materialsOnSite.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-6 border-t border-zinc-800/20">
                <span className="text-sm font-black uppercase text-amber-500 italic">Total Value of Work Executed</span>
                <span className="text-3xl font-black tracking-tighter text-amber-500 italic shadow-amber-500/10 drop-shadow-xl">
                  KES {financials.grossValuation.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Section 02: Deductions */}
          <div className="space-y-8">
            <div className="flex items-center gap-4 border-b border-zinc-800/40 pb-4">
               <span className="px-3 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-500 font-mono text-[10px] font-black leading-none">02</span>
               <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">Authorized Deductions</h3>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold uppercase text-zinc-500">Retention Fund ({data.retentionPercent}%)</span>
                <span className="text-xl font-black italic tracking-tighter text-rose-500/80">
                  (KES {financials.retentionAmount.toLocaleString()})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold uppercase text-zinc-500">Previous Amount Certified</span>
                <span className="text-xl font-black italic tracking-tighter text-rose-500/80">
                  (KES {data.previousCertified.toLocaleString()})
                </span>
              </div>
            </div>
          </div>

          {/* Section 03: Final Net Total */}
          <div className={`p-10 sm:p-14 rounded-[3.5rem] border transition-all duration-500 flex flex-col md:flex-row justify-between items-center gap-10
            ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800 shadow-inner' : 'bg-zinc-50 border-zinc-100 shadow-inner'}`}>
            <div className="text-left space-y-3">
              <div className="flex items-center gap-3 text-emerald-500">
                <CheckCircle2 size={18} />
                <p className="text-[11px] font-black uppercase tracking-widest leading-none">Certified Net Amount Due</p>
              </div>
              <p className={`text-6xl sm:text-7xl font-black italic tracking-tighter leading-none
                ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                KES {financials.currentAmountDue.toLocaleString()}
              </p>
              <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Calculated per SMM-Kenya Standards</p>
            </div>
            
            <div className="w-full md:w-px h-px md:h-24 bg-zinc-800/60" />

            <div className="text-right space-y-2">
              <p className="text-[11px] font-black uppercase text-zinc-500 tracking-widest text-right italic opacity-60">Including VAT (16%)</p>
              <p className="text-3xl font-black italic tracking-tighter text-amber-500/80 text-right drop-shadow-lg">
                TOTAL: KES {financials.totalDue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* 4. VERIFICATION NODES (Signatures) */}
        <div className={`p-12 sm:p-16 border-t grid md:grid-cols-2 gap-16
          ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
          
          <div className="space-y-8">
            <div className="flex items-center gap-3 opacity-40">
              <Signature size={16} className="text-zinc-500" />
              <p className="text-[10px] font-black uppercase tracking-widest">Quantity Surveyor Authorization</p>
            </div>
            <div className="h-24 border-b border-dashed border-zinc-700 flex items-center justify-center">
              <p className="text-[11px] font-mono text-zinc-800 uppercase tracking-[0.4em] italic">Electronic Signature Pending</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-3 opacity-40">
              <UserCheck size={16} className="text-zinc-500" />
              <p className="text-[10px] font-black uppercase tracking-widest">Client Representative Review</p>
            </div>
            <div className="h-24 border-b border-dashed border-zinc-700 flex items-center justify-center">
              <p className="text-[11px] font-mono text-zinc-800 uppercase tracking-[0.4em] italic">Awaiting Official Stamp</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. SYSTEM COMPLIANCE FOOTER */}
      <footer className="flex flex-col sm:flex-row justify-between items-center opacity-30 gap-8">
        <div className="flex items-center gap-4">
          <ShieldCheck size={20} className="text-emerald-500" />
          <div className="text-left">
            <p className="text-[9px] font-black uppercase tracking-widest leading-none">Immutable Vault Record</p>
            <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Certified System v2.0</p>
          </div>
        </div>
        <div className="flex items-center gap-8">
           <div className="flex items-center gap-2">
             <AlertCircle size={14} className="text-amber-500" />
             <span className="text-[9px] font-black uppercase tracking-widest leading-none italic">Verified Professional Protocol</span>
           </div>
           <p className="text-[9px] font-black uppercase tracking-widest leading-none font-mono">
             REF: {projectId.slice(0, 12).toUpperCase()}-IPC
           </p>
        </div>
      </footer>
    </section>
  );
};

export default CertificateGenerator;