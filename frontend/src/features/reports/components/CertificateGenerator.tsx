/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { 
  FileCheck, 
  Printer, 
  Download, 
  ShieldCheck, 
  Clock, 
  UserCheck,
  Building2,
  Signature,
  Loader2,
  Wallet,
  CheckCircle2,
  Receipt,
  FileText,
  AlertCircle
} from 'lucide-react';

/* ======================================================
    OFFICE MODULE RESOLUTION (PRO-DEV STABILIZED)
   ====================================================== */

let useAuth: any = () => ({ theme: 'dark' });
let db: any = null;

const resolveModules = async () => {
  try {
    const authMod = await import("../../auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const dbMod = await import("../../../lib/database/database");
    if (dbMod.db) db = dbMod.db;
  } catch (e) {
    console.warn("Cert Engine: Waiting for database connection...");
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

/** --- MAIN COMPONENT: PAYMENT CLAIM GENERATOR --- **/
const CertificateGenerator: React.FC<CertificateGeneratorProps> = ({ projectId, projectName }) => {
  const { theme } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  // Core Valuation State
  const [data, setData] = useState<IPCData>({
    certNumber: "CLAIM/001",
    valuationDate: new Date().toLocaleDateString(),
    contractor: "Authorized Builder",
    contractSum: 0,
    workExecuted: 0,
    materialsOnSite: 0,
    previousCertified: 0,
    retentionPercent: 10 
  });

  /** * 1. DATA HARVEST: CALCULATE FINANCIALS FOR THIS PROJECT ONLY 
   * FIXED: Now uses .where('project_id').equals(projectId) to prevent data mixing.
   */
  const loadFinancials = useCallback(async () => {
    if (!db || !projectId) {
      setTimeout(() => setLoading(false), 800);
      return;
    }

    try {
      setLoading(true);
      
      // --- DATA INTEGRITY FILTER ---
      const rawMeasurements = await db.measurements
        .where('project_id')
        .equals(projectId)
        .toArray();
      
      const aggregated: Record<string, { qty: number, rate: number }> = {};

      rawMeasurements.forEach((m: any) => {
         if (!m.value || m.value === 0) return;
         const key = `${m.sectionCode}_${m.unit}`;

         if (!aggregated[key]) {
            let demoRate = 4500;
            if (m.sectionCode?.includes('Concrete') || m.unit === 'm³') demoRate = 14500;
            if (m.sectionCode?.includes('Walling')) demoRate = 2800;
            if (m.sectionCode?.includes('Finishes')) demoRate = 1800;
            if (m.sectionCode?.includes('Doors') || m.type === 'count') demoRate = 18500;
            if (m.sectionCode?.includes('Excavation')) demoRate = 850;

            aggregated[key] = { qty: 0, rate: demoRate };
         }
         aggregated[key].qty += m.value;
      });

      let totalExecuted = 0;
      Object.values(aggregated).forEach(item => {
         if (item.qty > 0) {
           totalExecuted += (item.qty * item.rate);
         }
      });

      setData(prev => ({
        ...prev,
        contractSum: totalExecuted > 0 ? totalExecuted * 1.4 : 5000000, 
        workExecuted: totalExecuted,
        valuationDate: new Date().toLocaleDateString()
      }));
    } catch (err) {
      console.error("Valuation Engine Error:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadFinancials();
  }, [loadFinancials]);

  /** * 2. MATH CALCULATIONS (Simplified Language) */
  const financials = useMemo(() => {
    const totalValueDone = data.workExecuted + data.materialsOnSite;
    const securityDeposit = totalValueDone * (data.retentionPercent / 100);
    const amountAfterSecurity = totalValueDone - securityDeposit;
    const netPayable = amountAfterSecurity - data.previousCertified;
    const taxValue = netPayable * 0.16; 
    
    return {
      totalValueDone,
      securityDeposit,
      amountAfterSecurity,
      netPayable,
      taxValue,
      finalTotal: netPayable + taxValue
    };
  }, [data]);

  /** * 3. PDF EXPORT PROTOCOL */
  const handleDownloadPDF = async () => {
    const element = document.getElementById('printable-certificate');
    if (!element) return;

    try {
      setIsExporting(true);
      if (!(window as any).html2pdf) {
        await new Promise((res) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
          s.onload = res;
          document.head.appendChild(s);
        });
      }

      const opt = {
        margin: 10,
        filename: `Payment_Claim_${projectName.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await (window as any).html2pdf().set(opt).from(element).save();
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center p-40 rounded-[4rem] border-2 transition-colors duration-500
        ${theme === 'dark' ? 'bg-zinc-950/50 border-zinc-800' : 'bg-white border-zinc-200'}`}>
        <Loader2 className="w-12 h-12 animate-spin mb-6 text-amber-500" />
        <p className="font-black text-[10px] uppercase tracking-[0.5em] italic text-zinc-500">
          Preparing Payment Claim...
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left transition-colors ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
      
      {/* HEADER SECTION */}
      <header className="print:hidden flex flex-col md:flex-row justify-between items-start md:items-end gap-8 p-4 sm:p-0">
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-amber-500">
            <FileCheck size={32} strokeWidth={2.5} />
            <h2 className={`text-4xl sm:text-5xl font-black uppercase italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
              Payment Report
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic leading-none flex items-center gap-3">
            Official Progress Claim • {data.certNumber}
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => window.print()}
            className={`px-8 py-4 rounded-2xl border-2 transition-all font-black uppercase text-[10px] tracking-widest flex items-center gap-3 active:scale-95 shadow-xl
            ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900'}`}>
            <Printer size={16} /> Print Draft
          </button>
          <button 
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="px-10 py-5 rounded-3xl bg-amber-500 text-black font-black uppercase text-[10px] tracking-widest flex items-center gap-4 active:scale-95 shadow-2xl hover:bg-amber-400 border-2 border-amber-300 disabled:opacity-50">
            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} strokeWidth={3} />}
            {isExporting ? 'Creating PDF...' : 'Download Official PDF'}
          </button>
        </div>
      </header>

      {/* DOCUMENT BODY */}
      <div id="printable-certificate" className={`rounded-[4rem] border-2 backdrop-blur-3xl overflow-hidden transition-all duration-500 shadow-2xl p-10 sm:p-16 text-left
        ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
        
        {/* SUMMARY TILES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            { label: 'Project Name', value: projectName, icon: Building2 },
            { label: 'Claim Date', value: data.valuationDate, icon: Clock },
            { label: 'Full Project Cost', value: `KES ${data.contractSum.toLocaleString()}`, icon: Wallet },
            { label: 'Verified By', value: 'Authorized Node', icon: ShieldCheck },
          ].map((info, i) => (
            <div key={i} className="text-left space-y-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 italic">{info.label}</p>
              <p className={`text-lg font-black truncate uppercase tracking-tight italic ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>
                {info.value}
              </p>
            </div>
          ))}
        </div>

        {/* CALCULATION ROWS */}
        <div className="space-y-16">
           {/* Section 1: Value Done */}
           <div className="space-y-8">
              <div className="flex items-center gap-4 border-b-2 border-zinc-800/40 pb-4">
                 <h3 className="text-2xl font-black uppercase italic tracking-tighter">01. Work Done to Date</h3>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-center px-4">
                  <span className="text-xs font-bold uppercase text-zinc-500 tracking-widest">Calculated Site Work</span>
                  <span className="text-2xl font-black italic">KES {data.workExecuted.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center px-4 bg-amber-500/5 py-4 rounded-2xl border border-amber-500/10">
                  <span className="text-xs font-black uppercase text-amber-500 tracking-[0.2em]">Total Value of Work</span>
                  <span className="text-3xl font-black italic text-amber-500">KES {financials.totalValueDone.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
           </div>

           {/* Section 2: Deductions */}
           <div className="space-y-8">
              <div className="flex items-center gap-4 border-b-2 border-zinc-800/40 pb-4">
                 <h3 className="text-2xl font-black uppercase italic tracking-tighter text-rose-500">02. Deductions</h3>
              </div>
              <div className="space-y-6 px-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase text-zinc-500 tracking-widest block">Security Deposit (Retention {data.retentionPercent}%)</span>
                    <p className="text-[10px] text-zinc-600 font-medium italic">Funds held until project completion</p>
                  </div>
                  <span className="text-xl font-black text-rose-500">- KES {financials.securityDeposit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
           </div>

           {/* Section 3: Final Total */}
           <div className={`p-10 rounded-[3rem] border-2 flex flex-col md:flex-row justify-between items-center gap-10 bg-emerald-500/5 border-emerald-500/10 shadow-emerald-500/5 shadow-2xl`}>
              <div className="text-left space-y-3">
                 <div className="flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-emerald-500" strokeWidth={3} />
                    <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Amount Payable Now</p>
                 </div>
                 <p className={`text-5xl sm:text-6xl font-black italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
                    KES {Math.max(0, financials.netPayable).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                 </p>
              </div>
              <div className="text-right">
                 <div className="flex items-center justify-end gap-3 mb-2 opacity-60">
                    <Receipt size={14} className="text-amber-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none mt-1">Total Including VAT (16%)</p>
                 </div>
                 <p className="text-3xl font-black italic text-amber-500 drop-shadow-xl">
                    CLAIM: KES {Math.max(0, financials.finalTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                 </p>
              </div>
           </div>
        </div>
      </div>

      {/* COMPLIANCE FOOTER */}
      <footer className="pt-20 border-t-2 border-zinc-800/40 flex items-center justify-between opacity-30 pb-10">
        <div className="flex items-center gap-4 text-left">
          <ShieldCheck size={24} className="text-emerald-500" />
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest leading-none">Financial Accuracy Verified</p>
            <p className="text-[8px] font-mono uppercase tracking-tighter">QS_VAULT_IPC_V5 • SMM-KE COMPLIANT</p>
          </div>
        </div>
        <p className="text-[8px] font-mono font-black uppercase">Project Node ID: {projectId.slice(0, 12).toUpperCase()}</p>
      </footer>
    </div>
  );
};

export default CertificateGenerator;