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
  Receipt
} from 'lucide-react';

/* ======================================================
   OFFICE MODULE RESOLUTION (STATIC & STABLE)
   ====================================================== */

let useAuth: any = () => ({ theme: 'dark' });
let db: any = null;

const resolveModules = async () => {
  try {
    const authMod = await import("../../auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;
  } catch (e) {
    console.warn("Auth module offline. Using default theme.");
  }
  
  try {
    const dbMod = await import("../../../lib/database/database");
    if (dbMod.db) db = dbMod.db;
  } catch (e) {
    console.warn("Database module offline. Using standby memory.");
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
  const [isExporting, setIsExporting] = useState(false);
  
  // Core Valuation State
  const [data, setData] = useState<IPCData>({
    certNumber: "IPC/001",
    valuationDate: new Date().toLocaleDateString(),
    contractor: "Official Client",
    contractSum: 0,
    workExecuted: 0,
    materialsOnSite: 0,
    previousCertified: 0,
    retentionPercent: 10 
  });

  /** * DATA HARVEST: SYNCHRONIZED WITH BOQ ENGINE */
  const loadFinancials = useCallback(async () => {
    if (!db) {
      setTimeout(() => setLoading(false), 800);
      return;
    }

    try {
      setLoading(true);
      
      const rawMeasurements = await db.measurements.toArray();
      
      // Group measurements exactly like the BoQ engine to prevent isolated negative values
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
         if (item.qty > 0) { // Only count positive netted quantities
           totalExecuted += (item.qty * item.rate);
         }
      });

      setData(prev => ({
        ...prev,
        contractSum: totalExecuted * 1.5, // Generating a realistic contract sum based on work done
        workExecuted: totalExecuted,
        valuationDate: new Date().toLocaleDateString()
      }));
    } catch (err) {
      console.error("Valuation Error: Data harvest failed.", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadFinancials();
  }, [loadFinancials]);

  /** * CERTIFICATION MATHEMATICS */
  const financials = useMemo(() => {
    const grossValuation = data.workExecuted + data.materialsOnSite;
    const retentionAmount = grossValuation * (data.retentionPercent / 100);
    const netValuation = grossValuation - retentionAmount;
    const currentAmountDue = netValuation - data.previousCertified;
    const taxAmount = currentAmountDue * 0.16; 
    
    return {
      grossValuation,
      retentionAmount,
      netValuation,
      currentAmountDue,
      taxAmount,
      totalDue: currentAmountDue + taxAmount
    };
  }, [data]);

  /** * NATIVE PRINT PROTOCOL (DRAFT) */
  const handlePrintDraft = () => {
    window.print();
  };

  /** * TRUE PDF DOWNLOAD PROTOCOL (EXPORT) */
  const handleDownloadPDF = async () => {
    const element = document.getElementById('printable-certificate');
    if (!element) return;

    const originalClasses = element.className;
    const originalStyles = new Map<HTMLElement, Record<string, string>>();
    let exportStylesApplied = false;

    try {
      setIsExporting(true);

      // Dynamically load html2pdf if not present
      if (!(window as any).html2pdf) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      // Temporarily override dark mode styling so html2canvas receives clean CSS values.
      element.className = 'print-container bg-white text-black p-8';

      const allElements = element.querySelectorAll<HTMLElement>('*');
      allElements.forEach((el) => {
        exportStylesApplied = true;
        originalStyles.set(el, {
          color: el.style.color,
          backgroundColor: el.style.backgroundColor,
          borderColor: el.style.borderColor,
          boxShadow: el.style.boxShadow,
          textShadow: el.style.textShadow,
          filter: el.style.filter,
          backgroundImage: el.style.backgroundImage,
        });

        el.style.color = '#000000';
        el.style.backgroundColor = '#ffffff';
        el.style.borderColor = '#000000';
        el.style.boxShadow = 'none';
        el.style.textShadow = 'none';
        el.style.filter = 'none';
        el.style.backgroundImage = 'none';
      });

      const opt = {
        margin:       10,
        filename:     `Payment_Certificate_${data.certNumber.replace('/', '-')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Generate and trigger native browser download
      await (window as any).html2pdf().set(opt).from(element).save();

    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Export failed. Please use Print Draft as a fallback.');
    } finally {
      element.className = originalClasses;
      if (exportStylesApplied) {
        originalStyles.forEach((style, el) => {
          el.style.color = style.color;
          el.style.backgroundColor = style.backgroundColor;
          el.style.borderColor = style.borderColor;
          el.style.boxShadow = style.boxShadow;
          el.style.textShadow = style.textShadow;
          el.style.filter = style.filter;
          el.style.backgroundImage = style.backgroundImage;
        });
      }
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center p-40 rounded-[4rem] border-2 transition-colors duration-500
        ${theme === 'dark' ? 'bg-zinc-950/50 border-zinc-800' : 'bg-white border-zinc-200'}`}>
        <Loader2 className="w-16 h-16 animate-spin mb-8 text-amber-500" />
        <p className={`font-black text-xs uppercase tracking-[0.5em] italic ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
          Compiling Financials...
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left pb-20 transition-colors ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
      
      {/* 1. UI HEADER (Hidden in Print Mode) */}
      <header className="print:hidden flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-4 p-4 sm:p-0">
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-amber-500">
            <FileCheck size={32} strokeWidth={2.5} />
            <h2 className={`text-4xl sm:text-5xl font-black uppercase italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
              Payment Certificate
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 italic leading-none flex items-center gap-3">
            Interim Valuation Schedule • Cert No: <span className="text-amber-500">{data.certNumber}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <button 
            onClick={handlePrintDraft}
            className={`px-8 py-4 rounded-2xl border-2 transition-all font-black uppercase text-[10px] tracking-widest flex items-center gap-3 active:scale-95 shadow-xl
            ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900'}`}>
            <Printer size={16} strokeWidth={2.5} /> Print Draft
          </button>
          <button 
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="px-8 py-4 rounded-2xl bg-amber-500 text-black font-black uppercase text-[10px] tracking-widest flex items-center gap-3 active:scale-95 shadow-amber-500/20 shadow-2xl hover:bg-amber-400 border-2 border-amber-300 disabled:opacity-50">
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} strokeWidth={3} />}
            {isExporting ? 'Compiling PDF...' : 'Export Official PDF'}
          </button>
        </div>
      </header>

      {/* ==============================================================
          THE CERTIFICATE DOCUMENT (This section prints/exports beautifully)
          ============================================================== */}
      <div id="printable-certificate" className="print-container">
        
        {/* Certificate Title (Only shows in print/export) */}
        <div className="hidden print:block text-center mb-10 border-b-2 border-black pb-6">
           <h1 className="text-3xl font-black uppercase tracking-widest">Interim Payment Certificate</h1>
           <p className="text-sm font-bold uppercase tracking-widest mt-2">Valuation No: {data.certNumber}</p>
        </div>

        {/* 2. PROJECT DETAILS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 sm:px-0 mb-10 print:grid-cols-2 print:gap-4 print:mb-8">
          {[
            { label: 'Project Name', value: projectName, icon: Building2 },
            { label: 'Contractor', value: data.contractor, icon: UserCheck },
            { label: 'Valuation Date', value: data.valuationDate, icon: Clock },
            { label: 'Contract Sum', value: `KES ${data.contractSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: Wallet },
          ].map((info, i) => (
            <div key={i} className={`p-8 print:p-4 rounded-[2.5rem] print:rounded-lg border-2 print:border-black shadow-xl print:shadow-none transition-all duration-500
              ${theme === 'dark' ? 'bg-zinc-950/80 border-zinc-800 print:bg-white print:text-black' : 'bg-white border-zinc-200 print:bg-white print:text-black'}`}>
              <div className={`flex items-center gap-4 mb-4 print:mb-2 ${theme === 'dark' ? 'opacity-60' : 'opacity-80'} print:opacity-100`}>
                <info.icon size={18} className="text-amber-500 print:text-black" strokeWidth={2.5} />
                <span className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'} print:text-black`}>{info.label}</span>
              </div>
              <p className={`text-lg font-black truncate uppercase tracking-tight italic ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'} print:text-black`}>
                {info.value}
              </p>
            </div>
          ))}
        </div>

        {/* 3. FINANCIAL LEDGER */}
        <div className={`rounded-[4rem] print:rounded-none border-2 print:border-none backdrop-blur-3xl overflow-hidden transition-all duration-500 shadow-2xl print:shadow-none
          ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200'}`}>
          <div className="p-8 sm:p-12 lg:p-16 print:p-0 space-y-12 print:space-y-8">
            
            {/* Section 01: Gross Valuation */}
            <div className="space-y-6 print:space-y-4">
              <div className={`flex items-center gap-6 border-b-2 pb-6 print:pb-2 ${theme === 'dark' ? 'border-zinc-800/40' : 'border-zinc-100'} print:border-black`}>
                 <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-black font-black font-mono shadow-lg print:hidden">01</div>
                 <h3 className={`text-2xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'} print:text-black`}>Gross Valuation</h3>
              </div>
              <div className="space-y-4 px-2 sm:px-4 print:px-0">
                <div className="flex justify-between items-center group">
                  <span className={`text-[12px] font-black uppercase tracking-widest transition-colors ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'} print:text-black`}>Total Value of Work Executed</span>
                  <span className={`text-2xl sm:text-3xl font-black italic tracking-tighter ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'} print:text-black`}>
                    KES {data.workExecuted.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center group">
                  <span className={`text-[12px] font-black uppercase tracking-widest transition-colors ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'} print:text-black`}>Materials on Site</span>
                  <span className={`text-2xl sm:text-3xl font-black italic tracking-tighter ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'} print:text-black`}>
                    KES {data.materialsOnSite.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className={`flex justify-between items-center pt-6 border-t-2 ${theme === 'dark' ? 'border-zinc-800/40' : 'border-zinc-100'} print:border-black`}>
                  <span className="text-[11px] sm:text-sm font-black uppercase tracking-[0.3em] text-amber-500 print:text-black">Gross Valuation</span>
                  <span className="text-3xl sm:text-4xl font-black tracking-tighter text-amber-500 print:text-black italic drop-shadow-md print:drop-shadow-none">
                    KES {financials.grossValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 02: Deductions */}
            <div className="space-y-6 print:space-y-4">
              <div className={`flex items-center gap-6 border-b-2 pb-6 print:pb-2 ${theme === 'dark' ? 'border-zinc-800/40' : 'border-zinc-100'} print:border-black`}>
                 <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center text-white font-black font-mono shadow-lg print:hidden">02</div>
                 <h3 className={`text-2xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'} print:text-black`}>Less Deductions</h3>
              </div>
              <div className="space-y-4 px-2 sm:px-4 print:px-0">
                <div className="flex justify-between items-center group">
                  <span className={`text-[12px] font-black uppercase tracking-widest transition-colors ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'} print:text-black`}>Retention Fund ({data.retentionPercent}%)</span>
                  <span className="text-xl sm:text-2xl font-black italic tracking-tighter text-rose-500/80 print:text-black">
                    - KES {financials.retentionAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center group">
                  <span className={`text-[12px] font-black uppercase tracking-widest transition-colors ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'} print:text-black`}>Previous Payments Certified</span>
                  <span className="text-xl sm:text-2xl font-black italic tracking-tighter text-rose-500/80 print:text-black">
                    - KES {data.previousCertified.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 03: Final Amount */}
            <div className={`rounded-[3rem] print:rounded-none border-2 print:border-black transition-all duration-500 flex flex-col lg:flex-row justify-between items-center gap-8 p-8 sm:p-12 lg:p-14 print:p-6
              ${theme === 'dark' ? 'bg-zinc-950/80 border-zinc-800 shadow-inner' : 'bg-zinc-50 border-zinc-200'} print:bg-white`}>
              <div className="text-left space-y-4 flex-1 w-full lg:w-auto">
                <div className="flex items-center gap-4 text-emerald-500 print:text-black">
                  <CheckCircle2 size={24} strokeWidth={3} className="print:hidden" />
                  <p className="text-xs sm:text-sm font-black uppercase tracking-widest leading-none">Amount Due for Payment</p>
                </div>
                <p className={`text-4xl sm:text-5xl lg:text-6xl font-black italic tracking-tighter leading-none
                  ${theme === 'dark' ? 'text-white' : 'text-zinc-950'} print:text-black`}>
                  KES {financials.currentAmountDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'} print:text-black`}>Excluding VAT</p>
              </div>
              
              <div className={`hidden lg:block print:block w-px h-24 ${theme === 'dark' ? 'bg-zinc-800/60' : 'bg-zinc-300'} print:bg-black`} />

              <div className="text-left lg:text-right space-y-3 w-full lg:w-auto border-t-2 lg:border-t-0 pt-8 lg:pt-0 border-zinc-200 dark:border-zinc-800 print:border-none print:pt-0">
                <div className={`flex items-center justify-start lg:justify-end gap-3 ${theme === 'dark' ? 'opacity-60' : 'opacity-80'} print:opacity-100`}>
                   <Receipt size={14} className="text-amber-500 print:hidden" />
                   <p className={`text-[11px] font-black uppercase tracking-widest leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-600'} print:text-black`}>Add VAT (16%)</p>
                </div>
                <p className="text-3xl sm:text-4xl font-black italic tracking-tighter text-amber-500 print:text-black drop-shadow-md print:drop-shadow-none">
                  TOTAL: KES {financials.totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* 4. VERIFICATION SIGNATURES */}
          <div className={`border-t-2 print:border-black grid gap-8 sm:gap-12 p-8 sm:p-12 lg:grid-cols-2 print:grid-cols-2 print:p-0 print:pt-8 print:mt-8
            ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'} print:bg-white`}>
            
            <div className="space-y-6 sm:space-y-8">
              <div className={`flex items-center gap-4 ${theme === 'dark' ? 'opacity-50' : 'opacity-70'} print:opacity-100`}>
                <Signature size={20} className={theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'} strokeWidth={2.5} />
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest print:text-black">Quantity Surveyor Sign & Stamp</p>
              </div>
              <div className={`h-32 print:h-24 border-2 border-dashed rounded-3xl print:rounded-none flex items-center justify-center transition-colors
                ${theme === 'dark' ? 'border-zinc-800 bg-zinc-950/40' : 'border-zinc-300 bg-white'} print:border-black print:bg-white`}>
                <p className={`text-[10px] font-mono font-black uppercase tracking-widest italic ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'} print:hidden`}>Digital Identity Trace</p>
              </div>
            </div>

            <div className="space-y-6 sm:space-y-8">
              <div className={`flex items-center gap-4 ${theme === 'dark' ? 'opacity-50' : 'opacity-70'} print:opacity-100`}>
                <UserCheck size={20} className={theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'} strokeWidth={2.5} />
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest print:text-black">Client Authorization</p>
              </div>
              <div className={`h-32 print:h-24 border-2 border-dashed rounded-3xl print:rounded-none flex items-center justify-center transition-colors
                ${theme === 'dark' ? 'border-zinc-800 bg-zinc-950/40' : 'border-zinc-300 bg-white'} print:border-black print:bg-white`}>
                <p className={`text-[10px] font-mono font-black uppercase tracking-widest italic ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'} print:hidden`}>Pending Client Approval</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. SYSTEM COMPLIANCE FOOTER (Hidden in Print) */}
      <footer className={`print:hidden pt-20 border-t-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8 pb-10
        ${theme === 'dark' ? 'border-zinc-800/60 opacity-40' : 'border-zinc-200 opacity-60'}`}>
        <div className="flex items-center gap-5">
          <ShieldCheck size={28} className="text-emerald-500" strokeWidth={2.5} />
          <div className="text-left">
            <p className={`text-[11px] font-black uppercase tracking-widest leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-700'}`}>Certified Financial Ledger</p>
            <p className={`text-[9px] font-mono mt-1.5 uppercase ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>System Version v2.5.4</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-8 justify-start sm:justify-end">
           <p className={`text-[10px] font-mono font-black uppercase leading-none ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>
             REF_ID: {projectId.slice(0, 10).toUpperCase()}_IPC_001
           </p>
        </div>
      </footer>

      {/* PRINT STYLESHEET */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 20mm; }
          body { 
            background: white !important; 
            color: black !important; 
            -webkit-print-color-adjust: exact; 
          }
          
          body * { visibility: hidden; }
          #printable-certificate, #printable-certificate * { visibility: visible; }
          
          #printable-certificate {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            font-family: "Times New Roman", Times, serif !important;
          }
          
          .print\\:bg-white { background-color: white !important; }
          .print\\:text-black { color: black !important; }
          .print\\:border-black { border-color: black !important; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
        }
      `}</style>
    </div>
  );
};

export default CertificateGenerator;