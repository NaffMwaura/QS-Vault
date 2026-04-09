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
import { useAuth } from "../../../features/auth/AuthContext";
import Button from "../../../components/ui/Button";
import { db } from "../../../lib/database/database";

/* ======================================================
    OFFICE MODULE RESOLUTION (OFFLINE-READY)
   ====================================================== */

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      <div className="flex-1 flex flex-col items-center justify-center p-16 opacity-30">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-amber-500" />
        <p className="theme-admin-label">Compiling Financial Data...</p>
      </div>
    );
  }

  return (
    <section className="flex-1 flex flex-col space-y-8 p-5 sm:p-6 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left">
      
      {/* 1. REPORT HEADER: MASTER ACTIONS */}
      <header className="flex shrink-0 flex-col items-start justify-between gap-5 lg:flex-row lg:items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-amber-500 mb-2">
            <FileCheck size={24} className="stroke-[2.5px]" />
            <h2 className={`text-3xl sm:text-4xl font-black uppercase italic tracking-tighter leading-none
              ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              Payment <span className="text-amber-500/80">Certificate.</span>
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">
            Official Interim Valuation • {data.certNumber} • {projectName}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            className="theme-admin-control px-5" 
            leftIcon={<Printer size={16} />}
          >
            Print Draft
          </Button>
          <Button 
            variant="primary" 
            className="theme-admin-control px-5" 
            leftIcon={<Download size={16} />}
          >
            Export PDF
          </Button>
        </div>
      </header>

      {/* 2. PROJECT OVERVIEW NODES */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Work Area', value: projectName, icon: Building2 },
          { label: 'Primary Client', value: data.contractor, icon: UserCheck },
          { label: 'Report Date', value: data.valuationDate, icon: Clock },
          { label: 'Contract Sum', value: `KES ${data.contractSum.toLocaleString()}`, icon: Wallet },
        ].map((info, i) => (
          <div key={i} className={`p-5 rounded-[1.6rem] border shadow-sm transition-all duration-500
            ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <div className="flex items-center gap-3 mb-4 text-zinc-600">
              <info.icon size={14} />
              <span className="theme-admin-label">{info.label}</span>
            </div>
            <p className={`theme-admin-row-title truncate uppercase ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-900'}`}>
              {info.value || 'Not Defined'}
            </p>
          </div>
        ))}
      </div>

      {/* 3. PROFESSIONAL VALUATION LEDGER */}
      <div className={`rounded-[2rem] border backdrop-blur-3xl overflow-hidden transition-all duration-500
        ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800 shadow-2xl shadow-black' : 'bg-white border-zinc-200'}`}>
        
        <div className="space-y-8 p-5 sm:p-6">
          
          {/* Section 01: Work Done */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-zinc-800/20 pb-4">
               <span className="theme-admin-chip bg-amber-500/10 border border-amber-500/20 text-amber-500 font-mono">01</span>
               <h3 className="theme-admin-label">Project Progress Valuation</h3>
            </div>
            <div className="space-y-5">
              <div className="flex justify-between items-center group">
                <span className="theme-admin-meta uppercase group-hover:text-zinc-300 transition-colors">Measured Work to Date</span>
                <span className={`text-lg font-black italic tracking-tight ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                  KES {data.workExecuted.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="theme-admin-meta uppercase group-hover:text-zinc-300 transition-colors">Stored Materials on Site</span>
                <span className={`text-lg font-black italic tracking-tight ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                  KES {data.materialsOnSite.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-6 border-t border-zinc-800/20">
                <span className="theme-admin-label text-amber-500">Total Value of Work Executed</span>
                <span className="text-2xl font-black tracking-tight text-amber-500 italic shadow-amber-500/10 drop-shadow-xl">
                  KES {financials.grossValuation.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Section 02: Deductions */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-zinc-800/20 pb-4">
               <span className="theme-admin-chip bg-rose-500/10 border border-rose-500/20 text-rose-500 font-mono">02</span>
               <h3 className="theme-admin-label">Authorized Deductions</h3>
            </div>
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <span className="theme-admin-meta uppercase">Retention Fund ({data.retentionPercent}%)</span>
                <span className="text-lg font-black italic tracking-tight text-rose-500/80">
                  (KES {financials.retentionAmount.toLocaleString()})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="theme-admin-meta uppercase">Previous Amount Certified</span>
                <span className="text-lg font-black italic tracking-tight text-rose-500/80">
                  (KES {data.previousCertified.toLocaleString()})
                </span>
              </div>
            </div>
          </div>

          {/* Section 03: Final Net Total */}
          <div className={`rounded-[1.7rem] border transition-all duration-500 flex flex-col md:flex-row justify-between items-center gap-8 p-6 sm:p-8
            ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800 shadow-inner' : 'bg-zinc-50 border-zinc-100 shadow-inner'}`}>
            <div className="text-left space-y-3">
              <div className="flex items-center gap-3 text-emerald-500">
                <CheckCircle2 size={18} />
                <p className="theme-admin-label leading-none">Certified Net Amount Due</p>
              </div>
              <p className={`text-4xl sm:text-5xl font-black italic tracking-tight leading-none
                ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                KES {financials.currentAmountDue.toLocaleString()}
              </p>
              <p className="theme-admin-meta uppercase">Calculated per SMM-Kenya Standards</p>
            </div>
            
            <div className="w-full md:w-px h-px md:h-24 bg-zinc-800/60" />

            <div className="text-right space-y-2">
              <p className="theme-admin-label text-right opacity-60">Including VAT (16%)</p>
              <p className="text-2xl font-black italic tracking-tight text-amber-500/80 text-right drop-shadow-lg">
                TOTAL: KES {financials.totalDue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* 4. VERIFICATION NODES (Signatures) */}
        <div className={`border-t grid gap-10 p-6 sm:p-8 md:grid-cols-2
          ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3 opacity-40">
              <Signature size={16} className="text-zinc-500" />
              <p className="theme-admin-label">Quantity Surveyor Authorization</p>
            </div>
            <div className="h-24 border-b border-dashed border-zinc-700 flex items-center justify-center">
              <p className="theme-admin-meta font-mono uppercase">Electronic Signature Pending</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 opacity-40">
              <UserCheck size={16} className="text-zinc-500" />
              <p className="theme-admin-label">Client Representative Review</p>
            </div>
            <div className="h-24 border-b border-dashed border-zinc-700 flex items-center justify-center">
              <p className="theme-admin-meta font-mono uppercase">Awaiting Official Stamp</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. SYSTEM COMPLIANCE FOOTER */}
      <footer className="flex flex-col gap-4 border-t border-[color:var(--app-divider)] pt-5 opacity-60 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <ShieldCheck size={18} className="text-emerald-500" />
          <div className="text-left">
            <p className="theme-admin-label leading-none">Immutable Vault Record</p>
            <p className="theme-admin-meta mt-1 uppercase">Certified System v2.0</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-5">
           <div className="flex items-center gap-2">
             <AlertCircle size={14} className="text-amber-500" />
             <span className="theme-admin-meta uppercase italic">Verified Professional Protocol</span>
           </div>
           <p className="theme-admin-meta font-mono uppercase leading-none">
             REF: {projectId.slice(0, 12).toUpperCase()}-IPC
           </p>
        </div>
      </footer>
    </section>
  );
};

export default CertificateGenerator;
