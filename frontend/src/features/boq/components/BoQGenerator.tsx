/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Calculator,
  CheckCircle2,
  ShieldCheck,
  Database,
  Loader2
} from 'lucide-react';

/* ======================================================
   OFFICE MODULE RESOLUTION (STABILIZED)
   ====================================================== */

let useAuth: any = () => ({ theme: 'dark', user: null });
let db: any = null;

const resolveInfrastructure = async () => {
  try {
    const authMod = await import("../../auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;
  } catch (e) {}
  
  try {
    const dbMod = await import("../../../lib/database/database");
    if (dbMod.db) db = dbMod.db;
  } catch (e) {}
};

resolveInfrastructure();

interface BoQItem {
  id: string;
  code: string;
  description: string;
  unit: string;
  qty: number;
  rate: number;
}

interface BoQGeneratorProps {
  projectId: string;
  projectName: string;
  measurements?: any[]; 
}

/** --- MAIN COMPONENT: AUTOMATED BILL OF QUANTITIES --- **/
const BoQGenerator: React.FC<BoQGeneratorProps> = ({ 
  projectId, 
  projectName, 
  measurements: propMeasurements 
}) => {
  const { theme } = useAuth();
  const [internalMeasurements, setInternalMeasurements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /** * 1. THE HARVEST ENGINE (WITH IDENTITY LOCKDOWN)
   * This logic solves the "Data Leakage" issue. 
   * It ensures that even if the parent passes an array, we only use 
   * items that belong to THIS project ID.
   */
  const loadProjectNodes = useCallback(async () => {
    if (!projectId) return;

    // A. RESET: Immediately clear old data to prevent Project A showing in Project B
    setInternalMeasurements([]);

    // B. PROP-CHECK: If parent passed data, we filter it strictly by project_id
    if (propMeasurements && propMeasurements.length > 0) {
      const filteredProps = propMeasurements.filter(m => 
        (m.project_id === projectId || m.projectId === projectId)
      );
      
      // Only set if we actually found nodes for THIS project
      if (filteredProps.length > 0) {
        setInternalMeasurements(filteredProps);
        return;
      }
    }

    // C. VAULT-FALLBACK: If props are empty or irrelevant, go to the DB
    if (!db) {
       setTimeout(loadProjectNodes, 500);
       return;
    }

    try {
      setIsLoading(true);
      
      // Fetch fresh from the vault using the project_id index
      const vaultData = await db.measurements
        .where('project_id')
        .equals(projectId)
        .toArray();
      
      // Also check for legacy camelCase property names in old records
      const legacyData = await db.measurements
        .filter((m: any) => m.projectId === projectId)
        .toArray();

      const combined = [...vaultData, ...legacyData];
      
      // Final deduplication by unique ID
      const unique = Array.from(new Map(combined.map(m => [m.id, m])).values());
      
      setInternalMeasurements(unique);
    } catch (err) {
      console.error("BoQ Generator: Vault access denied.");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, propMeasurements]);

  useEffect(() => {
    loadProjectNodes();
  }, [loadProjectNodes]);

  /** * 2. THE CALCULATION ENGINE
   * Groups measurements by Trade Section using Case-Insensitive logic.
   * CRITICAL: Second-level safety filter ensures NO cross-project data leakage.
   */
  const items = useMemo(() => {
    const aggregated: Record<string, BoQItem> = {};

    // STRICT FILTER: Re-validate each measurement belongs to THIS project before processing
    internalMeasurements
      .filter(m => m.project_id === projectId || m.projectId === projectId)
      .forEach((m) => {
        const val = parseFloat(m.value);
        if (!val || isNaN(val)) return;

        const rawSection = m.sectionCode || "General Works";
        const sectionKey = rawSection.trim().toLowerCase();
        const unit = m.unit || "m";
        
        const key = `${sectionKey}_${unit}`;

        if (!aggregated[key]) {
          // Engineering Rate Logic
          let demoRate = 4500;
          if (sectionKey.includes('concrete')) demoRate = 14500;
          if (sectionKey.includes('walling')) demoRate = 2800;
          if (sectionKey.includes('finishes')) demoRate = 1800;
          if (sectionKey.includes('door') || sectionKey.includes('opening') || m.type === 'count') demoRate = 18500;
          if (sectionKey.includes('excavation')) demoRate = 850;

          aggregated[key] = {
            id: key,
            code: rawSection.slice(0, 3).toUpperCase(),
            description: rawSection,
            unit: unit,
            qty: 0,
            rate: demoRate
          };
        }
        aggregated[key].qty += val;
      });

    return Object.values(aggregated).filter(item => Math.abs(item.qty) > 0);
  }, [internalMeasurements, projectId]);

  const financials = useMemo(() => {
    const net = items.reduce((acc, curr) => acc + (curr.qty * curr.rate), 0);
    const tax = net * 0.16; 
    return { net, tax, total: net + tax };
  }, [items]);

  const handleExportExcel = () => {
    if (items.length === 0) return;
    const headers = ['Code', 'Description', 'Unit', 'Qty', 'Rate', 'Total'];
    const rows = items.map(item => [
      item.code, item.description, item.unit, 
      item.qty.toFixed(2), item.rate.toFixed(2), (item.qty * item.rate).toFixed(2)
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `BoQ_${projectName}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center opacity-30">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500 mb-6" />
        <p className="font-black uppercase text-[10px] tracking-[0.5em] italic">Locking Project Vault...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-12 animate-in fade-in duration-700 text-left transition-colors ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
      
      {/* 1. STATUS HEADER */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 p-4 sm:p-0">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-500">
                <Database size={16} />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic leading-none">Identity Linked: {projectId.slice(0,8)}</p>
          </div>
          <h2 className={`text-4xl sm:text-6xl font-black uppercase italic tracking-tighter leading-none`}>
            {projectName}<span className="text-amber-500">.</span>
          </h2>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{internalMeasurements.length} Nodes for this Project</span>
             </div>
             <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">SMM Aligned</span>
             </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <button onClick={() => window.print()} className={`px-8 py-4 rounded-xl border-2 transition-all font-black uppercase text-[10px] tracking-widest flex items-center gap-3 active:scale-95 shadow-xl
            ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600'}`}>
            <Printer size={16} /> Print BoQ
          </button>
          <button onClick={handleExportExcel} className="px-10 py-5 bg-amber-500 text-black font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-2xl hover:bg-amber-400 active:scale-95 transition-all flex items-center gap-4 italic border-2 border-amber-300">
            <FileSpreadsheet size={18} /> Export Excel
          </button>
        </div>
      </header>

      {/* 2. THE BOQ TABLE */}
      <div className={`rounded-[3.5rem] border-2 backdrop-blur-3xl overflow-hidden flex flex-col transition-all duration-500 shadow-2xl
        ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-zinc-200/40'}`}>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-900px]">
            <thead className={`border-b-2 ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <tr className={`text-[10px] font-black uppercase tracking-[0.3em] italic text-zinc-500`}>
                <th className="p-10">Code</th>
                <th className="p-10 w-1/3">Work Description</th>
                <th className="p-8 text-center">Unit</th>
                <th className="p-10 text-right">Quantity</th>
                <th className="p-10 text-right">Amount (KES)</th>
              </tr>
            </thead>
            <tbody className={`divide-y-2 ${theme === 'dark' ? 'divide-zinc-800/40' : 'divide-zinc-100'}`}>
              {items.length > 0 ? items.map((item) => (
                <tr key={item.id} className="group hover:bg-amber-500/2 transition-colors">
                  <td className="p-10 text-left">
                    <span className="px-4 py-2 rounded-xl border-2 text-[10px] font-mono font-black text-zinc-500 bg-zinc-950 border-zinc-800 uppercase italic">
                      {item.code}
                    </span>
                  </td>
                  <td className="p-10 text-left font-bold uppercase text-sm tracking-tight leading-none italic">{item.description}</td>
                  <td className="p-8 text-center text-[10px] font-black text-amber-500">{item.unit}</td>
                  <td className="p-10 text-right text-2xl font-black italic tracking-tighter">{item.qty.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="p-10 text-right text-3xl font-black text-amber-500 italic tracking-tighter">{(item.qty * item.rate).toLocaleString(undefined, { minimumFractionDigits: 0 })}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="p-40 text-center opacity-20">
                    <Calculator size={64} className="mx-auto mb-6" />
                    <p className="font-black uppercase text-sm tracking-[0.5em]">No Data in this Project Vault</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 3. TOTALS */}
        <div className={`p-10 sm:p-16 border-t-2 flex flex-col md:flex-row justify-between items-center gap-12
          ${theme === 'dark' ? 'bg-zinc-950/90 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
          
          <div className="flex items-center gap-8 text-left w-full md:w-auto">
             <div className="p-6 rounded-3xl bg-emerald-500/10 text-emerald-500 border-2 border-emerald-500/20 shadow-xl">
                <ShieldCheck size={36} strokeWidth={3} />
             </div>
             <div>
                <h4 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Verified Valuation</h4>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em] mt-2 italic">Project Vault Secured</p>
             </div>
          </div>
          
          <div className="w-full md:w-400px] space-y-4">
            <div className="flex justify-between items-center opacity-60">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Sub-Total</span>
              <span className="text-xl font-black italic">KES {financials.net.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center opacity-60">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">VAT (16%)</span>
              <span className="text-xl font-black italic">KES {financials.tax.toLocaleString()}</span>
            </div>
            <div className="h-px w-full bg-zinc-800" />
            <div className="flex justify-between items-center pt-2 text-amber-500">
              <p className="text-sm font-black uppercase italic leading-none">Final BoQ Sum</p>
              <p className={`text-5xl font-black italic tracking-tighter leading-none`}>KES {financials.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="pt-24 pb-12 text-center opacity-20 select-none">
         <p className="text-[10px] font-black uppercase tracking-[2.5em] text-zinc-600 italic">
           BOQ VALUATION ENGINE • QS VAULT
         </p>
      </footer>
    </div>
  );
};

export default BoQGenerator;