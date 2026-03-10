import React, { useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  FileCheck, 
  Hash,
 
  TrendingUp,
  Receipt
} from 'lucide-react';

/* ======================================================
    MODULE RESOLUTION HANDLER (SANDBOX COMPATIBILITY)
   ====================================================== */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let useAuth: any = () => ({
  theme: 'dark',
});

const resolveModules = async () => {
  try {
    const authMod = await import("../../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // Sandbox fallback
  }
};

resolveModules();

/** --- TYPES --- **/

interface BoQItem {
  id: string;
  code: string;
  description: string;
  unit: string;
  qty: number;
  rate: number;
}

interface BoQGeneratorProps {
  items: BoQItem[];
  projectName: string;
}

/** --- MAIN COMPONENT --- **/

const BoQGenerator: React.FC<BoQGeneratorProps> = ({ items, projectName }) => {
  const { theme } = useAuth();

  // Financial Computation Matrix
  const totals = useMemo(() => {
    const net = items.reduce((acc, curr) => acc + (curr.qty * curr.rate), 0);
    const vat = net * 0.16; // Standard Kenya VAT node
    return { net, vat, total: net + vat };
  }, [items]);

  return (
    <section className="flex-1 flex flex-col p-6 sm:p-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden">
      
      {/* 1. Pricing HUD Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 shrink-0">
        <div className="text-left space-y-2">
          <h2 className={`text-4xl sm:text-6xl font-black uppercase italic tracking-tighter leading-none
            ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
            Bill of <span className="text-amber-500">Quantities.</span>
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 italic">
            SMM-Kenya Standard Compliance Engine • {projectName}
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <button className={`flex items-center gap-3 px-8 py-5 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95
            ${theme === 'dark' ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>
            <Printer size={16} /> Print Draft
          </button>
          <button className="flex items-center gap-3 px-10 py-5 bg-amber-500 text-black rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-amber-500/20 hover:bg-amber-400 active:scale-95 transition-all">
            <FileSpreadsheet size={16} /> Export Excel
          </button>
        </div>
      </header>

      {/* 2. Professional BoQ Ledger Table */}
      <div className={`flex-1 rounded-[3.5rem] border backdrop-blur-3xl overflow-hidden flex flex-col transition-all duration-500
        ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200 shadow-2xl'}`}>
        
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className={`sticky top-0 z-10 border-b ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <tr className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">
                <th className="p-10">Code</th>
                <th className="p-10">Work Description</th>
                <th className="p-8">Unit</th>
                <th className="p-10 text-right">Qty</th>
                <th className="p-10 text-right">Rate</th>
                <th className="p-10 text-right">Amount (KES)</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-zinc-800/40' : 'divide-zinc-200'}`}>
              {items.map((item) => (
                <tr key={item.id} className="group hover:bg-amber-500/5 transition-colors">
                  <td className="p-10">
                    <span className="text-zinc-500 font-mono text-xs italic font-black uppercase tracking-tighter">
                      {item.code}
                    </span>
                  </td>
                  <td className="p-10 max-w-xl">
                    <p className={`text-sm font-bold uppercase tracking-tight leading-relaxed group-hover:text-amber-500 transition-colors
                      ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                      {item.description}
                    </p>
                  </td>
                  <td className="p-8">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border
                      ${theme === 'dark' ? 'bg-zinc-800 text-zinc-500 border-zinc-700' : 'bg-zinc-50 text-zinc-400 border-zinc-200'}`}>
                      {item.unit}
                    </span>
                  </td>
                  <td className="p-10 text-right">
                    <p className={`text-xl font-black tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                      {item.qty.toFixed(3)}
                    </p>
                  </td>
                  <td className="p-10 text-right text-zinc-500 italic font-medium text-xs">
                    {item.rate.toLocaleString()}
                  </td>
                  <td className="p-10 text-right">
                    <p className="text-2xl font-black text-amber-500 tracking-tighter leading-none italic">
                      {(item.qty * item.rate).toLocaleString()}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3. Carry to Summary Footer Node */}
        <div className={`p-10 sm:p-14 border-t flex flex-col md:flex-row justify-end items-center gap-12
          ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
          
          <div className="w-full md:w-96 space-y-6">
            <div className="flex justify-between items-center opacity-40">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Net Construction Node</span>
              <span className="text-xl font-black italic tracking-tighter">KES {totals.net.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center opacity-40">
              <div className="flex items-center gap-2">
                <Receipt size={12} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">VAT Handshake (16%)</span>
              </div>
              <span className="text-xl font-black italic tracking-tighter">KES {totals.vat.toLocaleString()}</span>
            </div>
            
            <div className="h-px bg-zinc-800" />
            
            <div className="flex justify-between items-center group cursor-default">
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-500 italic mb-1">Carried to Summary</p>
                <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest leading-none">Standard RICS/PPRA Finalization</p>
              </div>
              <div className="text-right">
                <p className={`text-4xl sm:text-5xl font-black italic tracking-tighter group-hover:scale-105 transition-transform duration-500
                  ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                  KES {totals.total.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Audit Badge Node */}
      <div className="flex flex-col sm:flex-row justify-between items-center opacity-30 gap-6">
        <div className="flex items-center gap-3">
          <FileCheck size={18} className="text-emerald-500" />
          <p className="text-[9px] font-black uppercase tracking-[0.5em] italic">Authorized Valuation Protocol v2.0</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Hash size={12} />
            <span className="text-[8px] font-black uppercase tracking-widest leading-none">NODE_REF: {projectName.slice(0,3).toUpperCase()}-LEGAL</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={12} className="text-amber-500" />
            <span className="text-[8px] font-black uppercase tracking-widest leading-none">SMM-KE Compliant Summary</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BoQGenerator;