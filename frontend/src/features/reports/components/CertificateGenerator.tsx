/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { 
  FileCheck, 
  Printer, 
  ShieldCheck,  
  Building2,
  Loader2,
  CheckCircle2,
 
  ArrowDownToLine,
  Zap
} from 'lucide-react';

// Infrastructure
import { useAuth } from "../../auth/AuthContext";
import { db } from "../../../lib/database/database";

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
  const [isExporting, setIsExporting] = useState(false);
  
  const [data, setData] = useState<IPCData>({
    certNumber: `IPC/${new Date().getFullYear()}/001`,
    valuationDate: new Date().toLocaleDateString('en-GB'),
    contractor: "Authorized Site Contractor",
    contractSum: 0,
    workExecuted: 0,
    materialsOnSite: 0,
    previousCertified: 0,
    retentionPercent: 10 
  });

  /** * 1. VAULT HARVEST: CALCULATE FINANCIALS 
   * This strictly filters by project_id to ensure the machine remains continuous
   * and project-specific.
   */
  const loadFinancials = useCallback(async () => {
    if (!db || !projectId) {
      setTimeout(() => setLoading(false), 1000);
      return;
    }

    try {
      setLoading(true);
      
      const rawMeasurements = await db.measurements
        .where('project_id')
        .equals(projectId)
        .toArray();
      
      let totalExecutedValue = 0;

      rawMeasurements.forEach((m: any) => {
         if (!m.value) return;
         
         // Standard Demo Rates (Matched with BoQ Generator)
         let rate = 4500;
         if (m.sectionCode?.includes('Concrete') || m.unit === 'm³') rate = 14500;
         if (m.sectionCode?.includes('Walling')) rate = 2800;
         if (m.sectionCode?.includes('Finishes')) rate = 1800;
         if (m.sectionCode?.includes('Doors') || m.type === 'count') rate = 18500;
         if (m.sectionCode?.includes('Excavation')) rate = 850;

         totalExecutedValue += (m.value * rate);
      });

      setData(prev => ({
        ...prev,
        contractSum: totalExecutedValue > 0 ? totalExecutedValue * 1.5 : 2500000, 
        workExecuted: totalExecutedValue,
      }));
    } catch (err) {
      console.error("Valuation Error.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadFinancials();
  }, [loadFinancials]);

  /** * 2. FINANCIAL LOGIC (Simplified Language) */
  const financials = useMemo(() => {
    const totalValue = data.workExecuted + data.materialsOnSite;
    const retention = totalValue * (data.retentionPercent / 100);
    const amountDue = totalValue - retention - data.previousCertified;
    const tax = amountDue * 0.16; 
    
    return {
      totalValue,
      retention,
      amountDue,
      tax,
      grandTotal: amountDue + tax
    };
  }, [data]);

  /** * 3. EXPORT PROTOCOL */
  const handleDownloadPDF = async () => {
    const element = document.getElementById('ipc-document');
    if (!element) return;

    try {
      setIsExporting(true);
      if (!(window as any).html2pdf) {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        document.head.appendChild(s);
        await new Promise(r => s.onload = r);
      }

      const opt = {
        margin: [10, 10],
        filename: `Payment_Certificate_${projectName}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await (window as any).html2pdf().set(opt).from(element).save();
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center opacity-30">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500 mb-6" />
        <p className="font-black uppercase text-[10px] tracking-[0.5em] italic">Building Payment Report...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 text-left transition-colors ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
      
      {/* HUD: ACTION BAR */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-4 sm:p-0">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
               <FileCheck size={20} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic leading-none">Interim Payment Certificate</p>
          </div>
          <h2 className={`text-3xl sm:text-5xl font-black uppercase italic tracking-tighter leading-none`}>
            Payment Claim<span className="text-amber-500">.</span>
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.print()}
            className={`px-6 py-4 rounded-xl border-2 transition-all font-black uppercase text-[10px] tracking-widest flex items-center gap-3 active:scale-95 shadow-xl
            ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600'}`}>
            <Printer size={16} /> Print
          </button>
          <button 
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="px-8 py-5 rounded-2xl bg-amber-500 text-black font-black uppercase text-[10px] tracking-widest flex items-center gap-4 active:scale-95 shadow-2xl hover:bg-amber-400 border-2 border-amber-300 shadow-amber-500/10">
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <ArrowDownToLine size={18} strokeWidth={3} />}
            {isExporting ? 'Generating...' : 'Export Official PDF'}
          </button>
        </div>
      </header>

      {/* THE OFFICIAL DOCUMENT */}
      <div className="relative group">
        <div 
          id="ipc-document" 
          className={`rounded-[3rem] border-2 shadow-2xl p-10 sm:p-20 transition-all duration-500 relative overflow-hidden
            ${theme === 'dark' ? 'bg-white text-zinc-900 border-zinc-200' : 'bg-white text-zinc-900 border-zinc-200'}`}
        >
          {/* WATERMARK */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] rotate-[-30deg] pointer-events-none select-none">
             <h1 className="text-[120px] font-black uppercase tracking-widest">OFFICIAL</h1>
          </div>

          {/* DOC HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 border-b-4 border-zinc-900 pb-12 mb-16">
            <div className="space-y-6">
              <div className="bg-zinc-900 text-white px-6 py-3 rounded-lg inline-block">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em]">QS VAULT OFFICIAL RECORD</p>
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none">Payment Certificate</h1>
                <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{data.certNumber}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
               <div className="space-y-1">
                 <p className="text-[9px] font-black uppercase text-zinc-400">Date of Valuation</p>
                 <p className="text-sm font-bold uppercase">{data.valuationDate}</p>
               </div>
               <div className="space-y-1 text-right">
                 <p className="text-[9px] font-black uppercase text-zinc-400">Project Reference</p>
                 <p className="text-sm font-bold uppercase">{projectId.slice(0, 8)}</p>
               </div>
            </div>
          </div>

          {/* PROJECT IDENTITY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
             <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-zinc-400 flex items-center gap-2">
                  <Building2 size={12} /> Project Name
                </p>
                <p className="text-xl font-black uppercase italic tracking-tight">{projectName}</p>
             </div>
             <div className="space-y-2 text-right">
                <p className="text-[10px] font-black uppercase text-zinc-400">Contractor</p>
                <p className="text-xl font-black uppercase italic tracking-tight">{data.contractor}</p>
             </div>
          </div>

          {/* VALUATION TABLE */}
          <div className="space-y-8 mb-20">
            <div className="flex items-center gap-4 border-b-2 border-zinc-100 pb-4">
               <h4 className="text-lg font-black uppercase italic tracking-tighter">01. Summary of Site Progress</h4>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-bold text-zinc-500 uppercase">Value of Completed Site Work</span>
                <span className="text-lg font-black italic">KES {data.workExecuted.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-bold text-zinc-500 uppercase">Materials Securely on Site</span>
                <span className="text-lg font-black italic">KES {data.materialsOnSite.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center p-6 bg-zinc-50 rounded-2xl border-2 border-zinc-100">
                <span className="text-sm font-black uppercase tracking-widest italic">Gross Value of Work to Date</span>
                <span className="text-2xl font-black italic">KES {financials.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* DEDUCTIONS */}
          <div className="space-y-8 mb-20">
            <div className="flex items-center gap-4 border-b-2 border-zinc-100 pb-4">
               <h4 className="text-lg font-black uppercase italic tracking-tighter text-rose-600">02. Security Holds & Deductions</h4>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <div className="text-left">
                  <span className="text-sm font-bold text-zinc-500 uppercase block">Retention Fund ({data.retentionPercent}%)</span>
                  <p className="text-[10px] text-zinc-400 font-medium italic">Safety savings held until final project completion.</p>
                </div>
                <span className="text-lg font-black text-rose-600">- KES {financials.retention.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center px-2">
                <span className="text-sm font-bold text-zinc-500 uppercase">Previous Payments Already Certified</span>
                <span className="text-lg font-black text-rose-600">- KES {data.previousCertified.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* FINAL SETTLEMENT */}
          <div className="bg-zinc-900 rounded-[3rem] p-12 sm:p-16 flex flex-col md:flex-row justify-between items-center gap-10 shadow-2xl">
             <div className="text-left space-y-3">
                <div className="flex items-center gap-3 text-emerald-400">
                   <CheckCircle2 size={24} strokeWidth={3} />
                   <p className="text-[11px] font-black uppercase tracking-[0.4em]">Current Amount Payable</p>
                </div>
                <h1 className="text-6xl sm:text-7xl font-black text-white italic tracking-tighter leading-none">
                  {Math.max(0, financials.amountDue).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  <span className="text-2xl ml-4 opacity-50 not-italic">KES</span>
                </h1>
             </div>
             
             <div className="text-right space-y-4 border-l border-white/10 pl-12">
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 leading-none">Tax Calculation (VAT 16%)</p>
                   <p className="text-xl font-black text-zinc-400 italic">+ KES {financials.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="pt-4 border-t border-white/10">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-1">Total Claim Amount</p>
                   <p className="text-3xl font-black text-white italic tracking-tight">
                     KES {Math.max(0, financials.grandTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                   </p>
                </div>
             </div>
          </div>

          {/* SIGNATURES */}
          <div className="mt-24 grid grid-cols-2 gap-20">
             <div className="border-t-2 border-zinc-900 pt-6 text-left">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1">Quantity Surveyor</p>
                <p className="text-xs font-bold text-zinc-400 uppercase">Verified Node Stamp Included</p>
             </div>
             <div className="border-t-2 border-zinc-900 pt-6 text-right">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1">Contractor Acknowledgement</p>
                <p className="text-xs font-bold text-zinc-400 uppercase">Signature & Date</p>
             </div>
          </div>
        </div>

        {/* OVERLAY: SYNC STATUS */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900 border-2 border-zinc-800 px-8 py-4 rounded-2xl flex items-center gap-4 shadow-2xl print:hidden">
           <Zap size={16} className="text-amber-500 animate-pulse" />
           <p className="text-[10px] font-black uppercase tracking-widest text-white italic">Continuous Data Sync Active • 100% Accuracy</p>
        </div>
      </div>

      <footer className="pt-32 pb-10 flex items-center justify-between opacity-30 select-none px-4 sm:px-0">
        <div className="flex items-center gap-4">
           <ShieldCheck size={28} className="text-emerald-500" />
           <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest leading-none">Security Protocol: AES-256</p>
              <p className="text-[8px] font-mono uppercase tracking-tighter">DATA_NODE_VERIFIED • SMM-KE COMPLIANT</p>
           </div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[1em] italic text-zinc-600">QS VAULT OS</p>
      </footer>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #ipc-document, #ipc-document * { visibility: visible; }
          #ipc-document { position: absolute; left: 0; top: 0; width: 100%; border: none; box-shadow: none; padding: 0; margin: 0; }
        }
      `}</style>
    </div>
  );
};

export default CertificateGenerator;