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
  CheckCircle2,
  Receipt
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
    console.warn("Certificate Engine: Infrastructure nodes in standby.");
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
    contractor: "Assigned Contractor",
    contractSum: 0,
    workExecuted: 0,
    materialsOnSite: 0,
    previousCertified: 0,
    retentionPercent: 10 
  });

  /** * 1. DATA HANDSHAKE: FINANCIAL AGGREGATION
   * Pulls real priced data from the project vault and sums it up.
   */
  const loadFinancials = useCallback(async () => {
    if (!db || !projectId) {
      setTimeout(() => setLoading(false), 1200);
      return;
    }

    try {
      setLoading(true);
      
      const project = await db.projects.get(projectId);
      const billItems = await db.bill_items.where('project_id').equals(projectId).toArray();
      
      // Calculate total value of work recorded in BoQ
      const totalExecuted = billItems.reduce((acc: number, item: any) => 
        acc + ((item.quantity || 0) * (item.rate || 0)), 0
      );

      setData(prev => ({
        ...prev,
        contractSum: project?.contract_sum || 0,
        workExecuted: totalExecuted,
        contractor: project?.client_name || "Official Client",
        valuationDate: new Date().toLocaleDateString()
      }));
    } catch (err) {
      console.error("Valuation Error: Data harvest failed.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadFinancials();
  }, [loadFinancials]);

  /** * 2. CERTIFICATION LOGIC (SMM-KE COMPLIANT) */
  const financials = useMemo(() => {
    const grossValuation = data.workExecuted + data.materialsOnSite;
    const retentionAmount = grossValuation * (data.retentionPercent / 100);
    const netValuation = grossValuation - retentionAmount;
    const currentAmountDue = netValuation - data.previousCertified;
    const taxAmount = currentAmountDue * 0.16; // 16% Kenya VAT
    
    return {
      grossValuation,
      retentionAmount,
      netValuation,
      currentAmountDue,
      taxAmount,
      totalDue: currentAmountDue + taxAmount
    };
  }, [data]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-40 opacity-20">
        <Loader2 className="w-12 h-12 animate-spin mb-6 text-amber-500" />
        <p className={`font-black text-[10px] uppercase tracking-[0.5em] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-950'}`}>Analyzing Project Accounts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left pb-20">
      
      {/* 1. REPORT HEADER: MASTER ACTIONS */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-4">
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-amber-500">
            <FileCheck size={32} strokeWidth={2.5} />
            <h2 className={`text-4xl font-black uppercase italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
              Payment Certificate
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 italic leading-none">
            Official Interim Valuation • Node: {data.certNumber}
          </p>
        </div>

        <div className="flex gap-4">
          <button className={`px-8 py-4 rounded-2xl border transition-all font-black uppercase text-[10px] tracking-widest flex items-center gap-3 active:scale-95 shadow-xl
            ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900'}`}>
            <Printer size={16} /> Print Draft
          </button>
          <button className="px-8 py-4 rounded-2xl bg-amber-500 text-black font-black uppercase text-[10px] tracking-widest flex items-center gap-3 active:scale-95 shadow-amber-500/20 shadow-2xl hover:bg-amber-400">
            <Download size={16} strokeWidth={3} /> Export Official PDF
          </button>
        </div>
      </header>

      {/* 2. PROJECT IDENTITY NODES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Project Name', value: projectName, icon: Building2 },
          { label: 'Client Partner', value: data.contractor, icon: UserCheck },
          { label: 'Valuation Date', value: data.valuationDate, icon: Clock },
          { label: 'Contract Value', value: `KES ${data.contractSum.toLocaleString()}`, icon: Wallet },
        ].map((info, i) => (
          <div key={i} className={`p-8 rounded-[2.5rem] border shadow-2xl transition-all duration-500
            ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
            <div className="flex items-center gap-4 mb-4 opacity-50">
              <info.icon size={16} className="text-amber-500" />
              <span className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-950'}`}>{info.label}</span>
            </div>
            <p className={`text-xl font-black truncate uppercase tracking-tight italic ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>
              {info.value || 'Unset Node'}
            </p>
          </div>
        ))}
      </div>

      {/* 3. PROFESSIONAL FINANCIAL LEDGER */}
      <div className={`rounded-[4rem] border backdrop-blur-3xl overflow-hidden transition-all duration-500 shadow-2xl
        ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
        
        <div className="p-12 space-y-16">
          
          {/* Section 01: Work Progress */}
          <div className="space-y-10">
            <div className="flex items-center gap-6 border-b border-zinc-800/40 pb-6">
               <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-black font-black font-mono shadow-lg">01</div>
               <h3 className={`text-2xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Work Progress Valuation</h3>
            </div>
            <div className="space-y-8 px-4">
              <div className="flex justify-between items-center group">
                <span className="text-[12px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-amber-500 transition-colors">Work done so far</span>
                <span className={`text-3xl font-black italic tracking-tighter ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>
                  KES {data.workExecuted.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-[12px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-amber-500 transition-colors">Unused materials on site</span>
                <span className={`text-3xl font-black italic tracking-tighter ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>
                  KES {data.materialsOnSite.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-8 border-t border-zinc-800/40">
                <span className="text-sm font-black uppercase tracking-[0.3em] text-amber-500">Total Work & Materials</span>
                <span className="text-5xl font-black tracking-tighter text-amber-500 italic drop-shadow-2xl">
                  KES {financials.grossValuation.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Section 02: Safety Fund & Deductions */}
          <div className="space-y-10">
            <div className="flex items-center gap-6 border-b border-zinc-800/40 pb-6">
               <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center text-black font-black font-mono shadow-lg">02</div>
               <h3 className={`text-2xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Authorized Deductions</h3>
            </div>
            <div className="space-y-8 px-4">
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-black uppercase tracking-widest text-zinc-500">Safety Fund (Retention {data.retentionPercent}%)</span>
                <span className="text-2xl font-black italic tracking-tighter text-rose-500/60">
                  - KES {financials.retentionAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-black uppercase tracking-widest text-zinc-500">Money paid previously</span>
                <span className="text-2xl font-black italic tracking-tighter text-rose-500/60">
                  - KES {data.previousCertified.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Section 03: Final Handshake */}
          <div className={`rounded-[3rem] border transition-all duration-500 flex flex-col lg:flex-row justify-between items-center gap-12 p-10 lg:p-14
            ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800 shadow-inner' : 'bg-zinc-50 border-zinc-200'}`}>
            <div className="text-left space-y-4 flex-1">
              <div className="flex items-center gap-4 text-emerald-500">
                <CheckCircle2 size={24} strokeWidth={3} />
                <p className="text-sm font-black uppercase tracking-widest leading-none">Balance to pay now</p>
              </div>
              <p className={`text-6xl sm:text-7xl font-black italic tracking-tighter leading-none
                ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
                KES {financials.currentAmountDue.toLocaleString()}
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Calculated per Professional SMM-KE Standards</p>
            </div>
            
            <div className="hidden lg:block w-px h-32 bg-zinc-800/40" />

            <div className="text-right space-y-3">
              <div className="flex items-center justify-end gap-3 opacity-60">
                 <Receipt size={14} className="text-amber-500" />
                 <p className="text-[11px] font-black uppercase tracking-widest leading-none">Including Tax (16%)</p>
              </div>
              <p className="text-4xl font-black italic tracking-tighter text-amber-500 drop-shadow-xl">
                TOTAL: KES {financials.totalDue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* 4. VERIFICATION HUB */}
        <div className={`border-t grid gap-12 p-12 lg:grid-cols-2
          ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
          
          <div className="space-y-8">
            <div className="flex items-center gap-4 opacity-40">
              <Signature size={20} className="text-zinc-500" />
              <p className="text-[10px] font-black uppercase tracking-widest">Quantity Surveyor Stamp</p>
            </div>
            <div className="h-28 border-2 border-dashed border-zinc-800 rounded-3xl flex items-center justify-center bg-zinc-950/20">
              <p className="text-[10px] font-mono font-black text-zinc-700 uppercase tracking-widest italic">Digital Identity Trace Required</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-4 opacity-40">
              <UserCheck size={20} className="text-zinc-500" />
              <p className="text-[10px] font-black uppercase tracking-widest">Client Authorization</p>
            </div>
            <div className="h-28 border-2 border-dashed border-zinc-800 rounded-3xl flex items-center justify-center bg-zinc-950/20">
              <p className="text-[10px] font-mono font-black text-zinc-700 uppercase tracking-widest italic">Pending Client Approval Node</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. SYSTEM COMPLIANCE FOOTER */}
      <footer className="pt-20 border-t border-zinc-800/40 opacity-30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8 pb-10">
        <div className="flex items-center gap-5">
          <ShieldCheck size={28} className="text-emerald-500" />
          <div className="text-left">
            <p className="text-[11px] font-black uppercase tracking-widest leading-none">Immutable Vault Entry</p>
            <p className="text-[9px] font-mono mt-1 uppercase">Certified Ledger v2.5.4</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-8 justify-end">
           <div className="flex items-center gap-3">
              <AlertCircle size={18} className="text-amber-500" />
              <span className="text-[9px] font-black uppercase tracking-widest italic">Professional Valuation Protocol</span>
           </div>
           <p className="text-[10px] font-mono font-black text-zinc-600 uppercase leading-none">
             REF_ID: {projectId.slice(0, 10).toUpperCase()}_IPC_NODE
           </p>
        </div>
      </footer>
    </div>
  );
};

export default CertificateGenerator;