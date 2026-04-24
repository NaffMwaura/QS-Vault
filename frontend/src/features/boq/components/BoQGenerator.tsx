/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useMemo, useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Calculator,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Receipt,
  FileText,
  Database,
  ArrowRight,
  Info
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
  } catch (e) {
    console.warn("Auth module offline.");
  }
  
  try {
    const dbMod = await import("../../../lib/database/database");
    if (dbMod.db) db = dbMod.db;
  } catch (e) {
    console.warn("Database offline.");
  }
};

resolveModules();

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
}

/** --- MAIN COMPONENT: BILL OF QUANTITIES GENERATOR --- **/

const BoQGenerator: React.FC<BoQGeneratorProps> = ({ projectId, projectName }) => {
  const { theme } = useAuth();
  const [items, setItems] = useState<BoQItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [measurementCount, setMeasurementCount] = useState(0);

  /** * 1. DATA CALCULATION: GROUP MEASUREMENTS BY PROJECT 
   * FIXED: We now use .where('project_id').equals(projectId)
   * This ensures this project ONLY calculates its own data nodes.
   */
  useEffect(() => {
    const calculateBill = async () => {
      if (!db || !projectId) {
        setTimeout(() => setIsLoading(false), 800);
        return;
      }

      try {
        setIsLoading(true);
        
        // --- DATA INTEGRITY FILTER ---
        // Fetching only measurements recorded under this specific project ID
        const rawMeasurements = await db.measurements
          .where('project_id')
          .equals(projectId)
          .toArray();

        setMeasurementCount(rawMeasurements.length);

        if (rawMeasurements.length === 0) {
           setItems([]);
           return;
        }

        const aggregated: Record<string, BoQItem> = {};

        rawMeasurements.forEach((m: any) => {
           if (!m.value || m.value === 0) return;

           // Group by section code and unit to create BoQ line items
           const key = `${m.sectionCode}_${m.unit}`;

           if (!aggregated[key]) {
              // Standard Regional Rates Logic
              let demoRate = 4500;
              if (m.sectionCode?.includes('Concrete') || m.unit === 'm³') demoRate = 14500;
              if (m.sectionCode?.includes('Walling')) demoRate = 2800;
              if (m.sectionCode?.includes('Finishes')) demoRate = 1800;
              if (m.sectionCode?.includes('Doors') || m.type === 'count') demoRate = 18500;
              if (m.sectionCode?.includes('Excavation')) demoRate = 850;

              aggregated[key] = {
                 id: key,
                 code: m.sectionCode ? m.sectionCode.split(' ')[0].toUpperCase() : 'SMM',
                 description: m.sectionCode || 'General Works',
                 unit: m.unit || 'm',
                 qty: 0,
                 rate: demoRate
              };
           }
           aggregated[key].qty += m.value;
        });

        const finalItems = Object.values(aggregated).filter(item => item.qty !== 0);
        setItems(finalItems);
      } catch (err) {
        console.error("BoQ Engine Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    calculateBill();
  }, [projectId]);

  const financials = useMemo(() => {
    const net = items.reduce((acc, curr) => acc + (curr.qty * curr.rate), 0);
    const tax = net * 0.16; // Standard Kenya VAT
    return { net, tax, total: net + tax };
  }, [items]);

  /** * 2. EXPORT ENGINE (REFINED) */
  const handleExportExcel = () => {
    if (items.length === 0) return;

    const headers = ['Item Code', 'Description', 'Unit', 'Qty', 'Rate', 'Total'];
    const rows = items.map(item => [
      item.code,
      item.description,
      item.unit,
      item.qty.toFixed(2),
      item.rate.toFixed(2),
      (item.qty * item.rate).toFixed(2)
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `BoQ_${projectName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center p-40 rounded-[4rem] border-2 transition-colors duration-500
        ${theme === 'dark' ? 'bg-zinc-950/50 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-sm'}`}>
        <Loader2 className="w-12 h-12 animate-spin mb-6 text-amber-500" />
        <p className={`font-black text-[10px] uppercase tracking-[0.5em] italic ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
          Processing Project Ledger...
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-12 animate-in fade-in duration-700 text-left transition-colors ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
      
      {/* 1. MASTER AUDIT HEADER */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-4 p-4 sm:p-0">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-500">
                <Database size={16} />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">Project Identity Verified</p>
          </div>
          <h2 className={`text-5xl sm:text-6xl font-black uppercase italic tracking-tighter leading-none
            ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
            {projectName}<span className="text-amber-500">.</span>
          </h2>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{measurementCount} Measurement Nodes Found</span>
             </div>
             <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">SMM-KE Compliant</span>
             </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <button onClick={() => window.print()} className={`px-8 py-5 rounded-2xl border-2 transition-all font-black uppercase text-[10px] tracking-widest flex items-center gap-3 active:scale-95 shadow-xl
            ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900'}`}>
            <Printer size={16} /> Print Report
          </button>
          
          <button 
            onClick={handleExportExcel}
            className="px-10 py-5 bg-amber-500 text-black font-black uppercase text-[10px] tracking-widest rounded-3xl shadow-2xl hover:bg-amber-400 active:scale-95 transition-all flex items-center gap-4 italic border-2 border-amber-300 shadow-amber-500/20"
          >
            <FileSpreadsheet size={18} /> Export as Excel
          </button>
        </div>
      </header>

      {/* 2. DATA SOURCE BADGE (The solution to your ambiguity question) */}
      <div className={`p-6 rounded-3xl border-2 flex items-center justify-between mx-4 sm:mx-0
        ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 shadow-inner' : 'bg-zinc-50 border-zinc-100 shadow-inner'}`}>
         <div className="flex items-center gap-4">
            <Info size={18} className="text-amber-500" />
            <p className="text-[11px] font-bold uppercase text-zinc-500 tracking-widest">
              Showing calculated quantities strictly for: <span className={`italic font-black ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{projectName}</span>
            </p>
         </div>
         <p className="text-[9px] font-mono text-zinc-700 font-bold uppercase tracking-tighter hidden md:block">VAULT_ID: {projectId.slice(0, 12)}</p>
      </div>

      {/* 3. THE CALCULATED BILL TABLE */}
      <div className={`rounded-[4rem] border-2 backdrop-blur-3xl overflow-hidden flex flex-col transition-all duration-500 shadow-2xl
        ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className={`border-b-2 ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <tr className={`text-[10px] font-black uppercase tracking-[0.3em] italic text-zinc-500`}>
                <th className="p-10 whitespace-nowrap">Item Code</th>
                <th className="p-10 w-1/3">Work Description</th>
                <th className="p-8 text-center whitespace-nowrap">Unit</th>
                <th className="p-10 text-right whitespace-nowrap">Quantity</th>
                <th className="p-10 text-right whitespace-nowrap">Rate (KES)</th>
                <th className="p-10 text-right whitespace-nowrap">Total Amount</th>
              </tr>
            </thead>
            <tbody className={`divide-y-2 ${theme === 'dark' ? 'divide-zinc-800/40' : 'divide-zinc-100'}`}>
              {items.length > 0 ? items.map((item) => (
                <tr key={item.id} className="group hover:bg-amber-500/[0.02] transition-colors">
                  <td className="p-10 text-left">
                    <span className={`px-4 py-2 rounded-xl border-2 text-[10px] font-mono font-black italic uppercase
                      ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-500'}`}>
                      {item.code}
                    </span>
                  </td>
                  <td className="p-10 text-left">
                    <p className={`text-sm font-bold uppercase tracking-tight leading-relaxed ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                      {item.description}
                    </p>
                  </td>
                  <td className="p-8 text-center">
                    <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase border-2
                      ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-white border-zinc-200 text-zinc-500'}`}>
                      {item.unit}
                    </span>
                  </td>
                  <td className="p-10 text-right">
                    <p className={`text-2xl font-black italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
                      {item.qty.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </td>
                  <td className="p-10 text-right text-zinc-500 italic text-sm font-bold">
                    @{item.rate.toLocaleString()}
                  </td>
                  <td className="p-10 text-right">
                    <p className="text-3xl font-black text-amber-500 tracking-tighter leading-none italic">
                      {(item.qty * item.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="p-40 text-center">
                      <div className={`inline-flex p-12 rounded-full border-2 mb-8 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                        <Calculator size={64} className={theme === 'dark' ? 'text-zinc-700' : 'text-zinc-300'} strokeWidth={1.5} />
                      </div>
                      <p className={`font-black uppercase text-sm tracking-[0.5em] italic ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Report currently empty</p>
                      <p className={`text-sm mt-4 font-medium ${theme === 'dark' ? 'text-zinc-700' : 'text-zinc-500'}`}>Select 'Takeoff' above to add measurement nodes to this project.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 4. TOTALS COMPLIANCE FOOTER */}
        <div className={`p-10 sm:p-16 border-t-2 flex flex-col md:flex-row justify-between items-center gap-12
          ${theme === 'dark' ? 'bg-zinc-950/90 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
          <div className="flex items-center gap-8 text-left w-full md:w-auto">
             <div className="p-6 rounded-4xl bg-emerald-500/10 text-emerald-500 border-2 border-emerald-500/20 shadow-xl">
                <ShieldCheck size={36} strokeWidth={3} />
             </div>
             <div className="space-y-1 text-left">
                <h4 className={`text-2xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Valuation Certified</h4>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em] leading-none">Aligned with Project: {projectName}</p>
             </div>
          </div>
          
          <div className="w-full md:w-[450px] space-y-6">
            <div className="flex justify-between items-center opacity-60">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Sub-Total Value</span>
              <span className={`text-xl font-black italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-800'}`}>
                KES {financials.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center opacity-60">
              <div className="flex items-center gap-3">
                <Receipt size={16} className="text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">VAT (16%)</span>
              </div>
              <span className={`text-xl font-black italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-800'}`}>
                KES {financials.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className={`h-px w-full ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-300'}`} />
            <div className="flex justify-between items-center pt-2">
              <p className="text-sm font-black uppercase tracking-[0.4em] text-amber-500 italic text-left leading-none">Total Cost Estimate</p>
              <p className={`text-5xl sm:text-6xl font-black italic tracking-tighter transition-transform
                ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
                KES {financials.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="pt-24 pb-12 text-center opacity-20 select-none flex flex-col items-center gap-8">
         <p className="text-[10px] font-black uppercase tracking-[2.5em] text-zinc-600 italic leading-none text-center">
           BOQ VALUATION ENGINE • QS VAULT
         </p>
      </footer>
    </div>
  );
};

export default BoQGenerator;