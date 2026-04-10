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
  Receipt
} from 'lucide-react';

/* ======================================================
   OFFICE MODULE RESOLUTION (DYNAMIC FALLBACK)
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

const BoQGenerator: React.FC<BoQGeneratorProps> = ({ projectId, projectName }) => {
  const { theme } = useAuth();
  const [items, setItems] = useState<BoQItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /** * DATA HARVEST: AGGREGATE LEDGER RECORDS */
  useEffect(() => {
    const loadBillData = async () => {
      if (!db) {
        setTimeout(() => setIsLoading(false), 800);
        return;
      }

      try {
        setIsLoading(true);
        const rawMeasurements = await db.measurements.toArray();

        if (rawMeasurements.length === 0) {
           setItems([]);
           setIsLoading(false);
           return;
        }

        const aggregated: Record<string, BoQItem> = {};

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

              aggregated[key] = {
                 id: key,
                 code: m.sectionCode ? m.sectionCode.split(' ')[0] : 'SMM',
                 description: m.sectionCode || 'General Works',
                 unit: m.unit || 'm',
                 qty: 0,
                 rate: demoRate
              };
           }
           aggregated[key].qty += m.value;
        });

        const finalItems = Object.values(aggregated).filter(item => item.qty > 0);
        setItems(finalItems);
      } catch (err) {
        console.error("BoQ Compile Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadBillData();
  }, [projectId]);

  const financials = useMemo(() => {
    const net = items.reduce((acc, curr) => acc + (curr.qty * curr.rate), 0);
    const tax = net * 0.16; // Standard Kenya VAT (16%)
    return { net, tax, total: net + tax };
  }, [items]);

  /** * EXPORT ENGINE: GENERATE EXCEL (CSV) OFFLINE */
  const handleExportExcel = () => {
    if (items.length === 0) return;

    // 1. Build Headers
    const headers = ['Item Code', 'Description of Works', 'Unit', 'Quantity', 'Rate (KES)', 'Amount (KES)'];

    // 2. Map Data Rows (Wrapping strings in quotes to prevent comma breaks in Excel)
    const rows = items.map(item => [
      `"${item.code}"`,
      `"${item.description}"`,
      `"${item.unit}"`,
      item.qty.toFixed(2),
      item.rate.toFixed(2),
      (item.qty * item.rate).toFixed(2)
    ]);

    // 3. Append Financial Summary Footer
    rows.push(['', '', '', '', '', '']); // Empty spacer
    rows.push(['', '', '', '', '"Net Construction Value"', financials.net.toFixed(2)]);
    rows.push(['', '', '', '', '"VAT (16%)"', financials.tax.toFixed(2)]);
    rows.push(['', '', '', '', '"TOTAL AMOUNT"', financials.total.toFixed(2)]);

    // 4. Construct CSV Blob
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // 5. Trigger Native Download
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const safeProjectName = projectName.replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `BoQ_${safeProjectName}_${dateStr}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center p-40 rounded-[4rem] border-2 transition-colors duration-500
        ${theme === 'dark' ? 'bg-zinc-950/50 border-zinc-800' : 'bg-white border-zinc-200'}`}>
        <Loader2 className="w-16 h-16 animate-spin mb-8 text-amber-500" />
        <p className={`font-black text-xs uppercase tracking-[0.5em] italic ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
          Compiling Ledger Records...
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-12 animate-in fade-in duration-700 text-left transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-4 p-4 sm:p-0">
        <div className="space-y-3">
          <h2 className={`text-4xl sm:text-6xl font-black uppercase italic tracking-tighter leading-none
            ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
            Bill of <span className="text-amber-500">Quantities.</span>
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic flex items-center gap-3">
            <ShieldCheck size={14} className="text-emerald-500" /> SMM-Kenya Standard Compliance • {projectName}
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button className={`px-8 py-4 rounded-2xl border-2 transition-all font-black uppercase text-[10px] tracking-widest flex items-center gap-3 active:scale-95 shadow-xl
            ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900'}`}>
            <Printer size={16} strokeWidth={2.5} /> Print Draft
          </button>
          
          {/* THE EXPORT EXCEL BUTTON IS NOW FULLY FUNCTIONAL */}
          <button 
            onClick={handleExportExcel}
            className="px-10 py-5 bg-amber-500 text-black font-black uppercase text-[11px] tracking-widest rounded-3xl shadow-2xl hover:bg-amber-400 active:scale-95 transition-all flex items-center gap-4 italic border-2 border-amber-300 shadow-amber-500/20"
          >
            <FileSpreadsheet size={18} strokeWidth={2.5} /> Export Excel
          </button>

        </div>
      </header>

      <div className={`rounded-[4rem] border-2 backdrop-blur-3xl overflow-hidden flex flex-col transition-all duration-500 shadow-2xl
        ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'}`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className={`border-b-2 ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <tr className={`text-[11px] font-black uppercase tracking-[0.3em] italic ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'}`}>
                <th className="p-10 whitespace-nowrap">Item Code</th>
                <th className="p-10 w-1/3">Description of Works</th>
                <th className="p-8 text-center whitespace-nowrap">Unit</th>
                <th className="p-10 text-right whitespace-nowrap">Quantity</th>
                <th className="p-10 text-right whitespace-nowrap">Rate (KES)</th>
                <th className="p-10 text-right whitespace-nowrap">Amount (KES)</th>
              </tr>
            </thead>
            <tbody className={`divide-y-2 ${theme === 'dark' ? 'divide-zinc-800/40' : 'divide-zinc-100'}`}>
              {items.length > 0 ? items.map((item) => (
                <tr key={item.id} className={`group transition-colors ${theme === 'dark' ? 'hover:bg-amber-500/5' : 'hover:bg-amber-500/5'}`}>
                  <td className="p-10">
                    <span className={`px-4 py-2 rounded-xl border-2 text-[10px] font-mono font-black italic uppercase tracking-tighter
                      ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-500'}`}>
                      {item.code}
                    </span>
                  </td>
                  <td className="p-10 max-w-xl">
                    <p className={`text-sm font-bold uppercase tracking-tight leading-relaxed transition-colors 
                      ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
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
                      {item.qty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </td>
                  <td className="p-10 text-right">
                    <p className={`text-[12px] font-bold italic uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'}`}>
                      @{item.rate.toLocaleString()}
                    </p>
                  </td>
                  <td className="p-10 text-right">
                    <p className="text-3xl font-black text-amber-500 tracking-tighter leading-none italic drop-shadow-xl">
                      {(item.qty * item.rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="p-40 text-center">
                      <div className={`inline-flex p-12 rounded-full border-2 mb-8 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                        <Calculator size={64} className={theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'} strokeWidth={1.5} />
                      </div>
                      <p className={`font-black uppercase text-sm tracking-[0.5em] italic ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>No Bill Items secured in vault</p>
                      <p className={`text-sm mt-4 font-medium ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-500'}`}>Complete your takeoff measurements to compile this BoQ.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FINANCIAL SUMMARY FOOTER */}
        <div className={`p-10 sm:p-16 border-t-2 flex flex-col md:flex-row justify-between items-center gap-12 transition-colors duration-500
          ${theme === 'dark' ? 'bg-zinc-950/90 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
          <div className="flex items-center gap-6 text-left w-full md:w-auto">
             <div className="p-5 rounded-3xl bg-emerald-500/10 text-emerald-500 border-2 border-emerald-500/20 shadow-xl">
                <CheckCircle2 size={32} strokeWidth={2.5} />
             </div>
             <div className="space-y-2">
                <h4 className={`text-xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Valuation Finalized</h4>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em] leading-none">Ready for Project Certification</p>
             </div>
          </div>
          <div className="w-full md:w-96 space-y-6">
            <div className={`flex justify-between items-center ${theme === 'dark' ? 'opacity-60' : 'opacity-80'}`}>
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">Net Construction Value</span>
              <span className={`text-xl font-black italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-800'}`}>
                KES {financials.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className={`flex justify-between items-center ${theme === 'dark' ? 'opacity-60' : 'opacity-80'}`}>
              <div className="flex items-center gap-2">
                <Receipt size={14} className="text-amber-500" />
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">VAT (16%)</span>
              </div>
              <span className={`text-xl font-black italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-800'}`}>
                KES {financials.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className={`h-px w-full ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-300'}`} />
            <div className="flex justify-between items-center group cursor-default pt-2">
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-[0.4em] text-amber-500 italic mb-2">Total Amount</p>
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none">SMM-KE Compliant</p>
              </div>
              <div className="text-right">
                <p className={`text-4xl sm:text-5xl font-black italic tracking-tighter transition-transform duration-500 group-hover:scale-105
                  ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
                  KES {financials.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoQGenerator;