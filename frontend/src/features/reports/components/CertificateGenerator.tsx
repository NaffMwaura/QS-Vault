/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState, useEffect } from 'react';
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
  Signature,
  Loader2
} from 'lucide-react';

/* ======================================================
    OFFICE DATABASE INTEGRATION
   ====================================================== */

let useAuth: any = () => ({ theme: 'dark' });
let db: any = null;

const resolveModules = async () => {
  try {
    const authMod = await import("../../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const dbMod = await import("../../../lib/database/database");
    if (dbMod.db) db = dbMod.db;
  } catch (e) {
    // Sandbox fallback active
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
  const [data, setData] = useState<IPCData>({
    certNumber: "IPC/001",
    valuationDate: new Date().toLocaleDateString(),
    contractor: "Main Contractor Ltd",
    contractSum: 0,
    workExecuted: 0,
    materialsOnSite: 0,
    previousCertified: 0,
    retentionPercent: 10
  });

  /** * LIVE DATA HARVESTING
   * Pulls actual financial figures from the local office database
   */
  useEffect(() => {
    const fetchFinancialData = async () => {
      if (!db || !projectId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // 1. Fetch Project Details (Contract Sum)
        const project = await db.projects.get(projectId);
        
        // 2. Fetch Total Work Executed (Sum of Bill Items)
        const billItems = await db.bill_items.where('project_id').equals(projectId).toArray();
        const totalExecuted = billItems.reduce((acc: number, item: any) => acc + (item.quantity * item.rate), 0);

        setData(prev => ({
          ...prev,
          projectName: project?.name || projectName,
          contractSum: project?.contract_sum || 0,
          workExecuted: totalExecuted,
          contractor: project?.client_name || "Assigned Contractor"
        }));
      } catch (err) {
        console.error("Certification Error: Database link broken.", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, [projectId, projectName]);

  // Standard QS Certification Math (SMM-KE Compliant)
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

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 opacity-20">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-black text-[10px] uppercase tracking-[0.4em]">Generating Valuation Report...</p>
      </div>
    );
  }

  return (
    <section className="flex-1 flex flex-col p-6 sm:p-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. Certification Summary Header */}
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
            Interim Payment Certificate • {data.certNumber}
          </p>
        </div>

        <div className="flex gap-4">
          <button className={`flex items-center gap-3 px-8 py-5 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95
            ${theme === 'dark' ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>
            <Printer size={16} /> Print Report
          </button>
          <button className="flex items-center gap-3 px-10 py-5 bg-amber-500 text-black rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-amber-500/20 hover:bg-amber-400 active:scale-95 transition-all">
            <Download size={16} /> Export PDF
          </button>
        </div>
      </header>

      {/* 2. Project & Contractor Details */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Project Name', value: projectName, icon: Building2 },
          { label: 'Contractor', value: data.contractor, icon: UserCheck },
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
        ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800 shadow-2xl shadow-black/40' : 'bg-white border-zinc-200 shadow-xl'}`}>
        
        <div className="p-8 sm:p-12 space-y-10">
          {/* Section: Gross Valuation */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 italic text-left border-b border-zinc-800/40 pb-4">
              01. Gross Valuation
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-left">
                <span className="text-xs font-bold uppercase text-zinc-400">Total Work Measured to Date</span>
                <span className={`text-lg font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                  KES {data.workExecuted.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-left">
                <span className="text-xs font-bold uppercase text-zinc-400">Materials on Site</span>
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
                <span className="text-xs font-bold uppercase text-zinc-400">Less: Previous Certified Amount</span>
                <span className="text-lg font-black tracking-tighter text-rose-500">
                  (KES {data.previousCertified.toLocaleString()})
                </span>
              </div>
            </div>
          </div>

          {/* Section: Net Payment Allocation */}
          <div className={`p-10 rounded-[3rem] ${theme === 'dark' ? 'bg-zinc-950/60 shadow-inner' : 'bg-zinc-50 border border-zinc-100 shadow-inner'} flex flex-col md:flex-row justify-between items-center gap-8`}>
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
              <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest text-right">Including VAT (16%)</p>
              <p className="text-2xl font-black italic tracking-tighter text-amber-500 opacity-80 text-right">
                TOTAL: KES {financials.totalDue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* 4. Verification & Signatures */}
        <div className={`p-12 border-t flex flex-col md:flex-row gap-12 text-left
          ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
          
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-3 opacity-40">
              <Signature size={14} className="text-zinc-500" />
              <p className="text-[9px] font-black uppercase tracking-widest leading-none">Authorized Quantity Surveyor</p>
            </div>
            <div className="h-20 border-b border-dashed border-zinc-700 flex items-end pb-2">
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest italic leading-none">AWAITING VERIFICATION...</p>
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-3 opacity-40">
              <UserCheck size={14} className="text-zinc-500" />
              <p className="text-[9px] font-black uppercase tracking-widest leading-none">Authorized Client Representative</p>
            </div>
            <div className="h-20 border-b border-dashed border-zinc-700 flex items-end pb-2">
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest italic leading-none">AWAITING CLIENT REVIEW...</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Compliance Verification Footer */}
      <footer className="flex flex-col sm:flex-row justify-between items-center opacity-30 gap-6">
        <div className="flex items-center gap-3">
          <AlertCircle size={18} className="text-amber-500" />
          <p className="text-[9px] font-black uppercase tracking-[0.5em] italic">Standard Professional Valuation Protocol</p>
        </div>
        <p className="text-[8px] font-black uppercase tracking-widest leading-none">
          Document REF: {projectName.slice(0, 3).toUpperCase()}-IPC-AUTO • CERTIFIED SYSTEM V2.0
        </p>
      </footer>
    </section>
  );
};

export default CertificateGenerator;