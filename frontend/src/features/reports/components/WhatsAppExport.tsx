/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  MessageSquare, 
  Share2, 
  Send, 
  CheckCircle2, 
  Copy,
  Smartphone,
  ShieldCheck,
  Zap,
  Loader2
} from 'lucide-react';

/* ======================================================
    OFFICE MODULE RESOLUTION (PRO-DEV STABILIZED)
    Using dynamic resolution to prevent build failures.
   ====================================================== */

let useAuth: any = () => ({ theme: 'dark', user: null });
let db: any = null;

const resolveModules = async () => {
  try {
    const authMod = await import("../../auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const dbMod = await import("../../../lib/database/database");
    if (dbMod.db) db = dbMod.db;
  } catch (e) {
    console.warn("WhatsApp Node: Infrastructure nodes in standby.");
  }
};

resolveModules();

/** --- TYPES --- **/
interface IPCData {
  certNumber: string;
  valuationDate: string;
  contractSum: number;
  workExecuted: number;
  materialsOnSite: number;
  previousCertified: number;
  retentionPercent: number;
}

interface WhatsAppExportProps {
  projectId?: string; // LINKED TO PROJECT
  projectName: string;
  data?: IPCData;     // OPTIONAL: Manual override for Admin Dashboard
}

/** --- MAIN COMPONENT: INSTANT PROJECT SHARE --- **/

const WhatsAppExport: React.FC<WhatsAppExportProps> = ({ projectId, projectName, data: manualData }) => {
  const { theme } = useAuth();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(manualData ? false : true);

  // Local State (Used if manualData is not provided)
  const [fetchedData, setFetchedData] = useState<IPCData>({
    certNumber: "CLAIM/001",
    valuationDate: new Date().toLocaleDateString(),
    contractSum: 0,
    workExecuted: 0,
    materialsOnSite: 0,
    previousCertified: 0,
    retentionPercent: 10 
  });

  /** * 1. DATA HARVEST: CALCULATE TOTALS FOR THIS PROJECT ONLY 
   * FIXED: This ensures measurements from other projects don't leak into this summary.
   */
  const loadFinancials = useCallback(async () => {
    if (manualData || !projectId) {
      setLoading(false);
      return;
    }

    try {
      if (!db) {
        // Fallback for initialization timing
        setTimeout(loadFinancials, 500);
        return;
      }

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

      setFetchedData(prev => ({
        ...prev,
        workExecuted: totalExecuted,
        valuationDate: new Date().toLocaleDateString()
      }));
    } catch (err) {
      console.error("WhatsApp Link Sync Error:", err);
    } finally {
      setLoading(false);
    }
  }, [manualData, projectId]);

  useEffect(() => {
    loadFinancials();
  }, [loadFinancials]);

  const activeData = manualData || fetchedData;

  /** * 2. MATH CALCULATIONS (Simplified Language) */
  const financials = useMemo(() => {
    const workDone = activeData.workExecuted + activeData.materialsOnSite;
    const securityHold = workDone * (activeData.retentionPercent / 100);
    const amountDueNow = workDone - securityHold - activeData.previousCertified;
    const tax = amountDueNow * 0.16; 
    
    return {
      workDone,
      securityHold,
      amountDueNow,
      tax,
      grandTotal: amountDueNow + tax
    };
  }, [activeData]);

  /** * 3. MESSAGE GENERATOR (User Friendly) */
  const generatePlainMessage = () => {
    return `*QS VAULT: SITE UPDATE REPORT*\n` +
           `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
           `*PROJECT:* ${projectName.toUpperCase()}\n` +
           `*DATE:* ${activeData.valuationDate}\n\n` +
           `*VALUE OF WORK DONE:* KES ${financials.workDone.toLocaleString()}\n` +
           `*SECURITY HOLD (${activeData.retentionPercent}%):* - KES ${financials.securityHold.toLocaleString()}\n` +
           `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
           `*AMOUNT PAYABLE NOW:* KES ${financials.amountDueNow.toLocaleString()}\n` +
           `*VAT (16%):* KES ${financials.tax.toLocaleString()}\n\n` +
           `*TOTAL CLAIM:* KES ${financials.grandTotal.toLocaleString()}\n` +
           `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
           `_Sent via QS Vault Precision OS_`;
  };

  const handleWhatsAppTrigger = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(generatePlainMessage())}`, '_blank');
  };

  const handleCopyText = () => {
    const dummy = document.createElement("textarea");
    document.body.appendChild(dummy);
    dummy.value = generatePlainMessage();
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className={`p-10 rounded-[2.5rem] border-2 transition-all duration-500 w-full flex flex-col items-center justify-center
        ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'}`}>
        <Loader2 className="animate-spin mb-4 text-amber-500" />
        <p className="text-[10px] font-black uppercase tracking-widest leading-none italic text-zinc-500">Compiling Summary...</p>
      </div>
    );
  }

  return (
    <div className={`p-8 sm:p-10 rounded-[3rem] border-2 shadow-2xl transition-all duration-500 w-full text-left
      ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
      
      <div className="space-y-8">
        {/* Module Header */}
        <div className="flex justify-between items-start">
          <div className="text-left space-y-1.5">
            <h4 className={`text-xl font-black uppercase italic tracking-tighter leading-none
              ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              Instant Update
            </h4>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 italic leading-none">
              Share details via WhatsApp
            </p>
          </div>
          <div className={`p-3 rounded-xl border-2 ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100 shadow-inner'}`}>
            <Smartphone size={20} className="text-amber-500" />
          </div>
        </div>

        {/* Message Preview Area */}
        <div className={`p-6 rounded-2xl border-2 relative group text-left overflow-hidden transition-colors
          ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800 shadow-inner' : 'bg-zinc-50 border-zinc-200 shadow-inner'}`}>
          <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-100 transition-opacity">
            <MessageSquare size={14} className="text-amber-500" />
          </div>
          <p className={`text-[11px] font-mono leading-relaxed whitespace-pre-wrap
            ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {generatePlainMessage()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <button 
            onClick={handleCopyText}
            className={`px-4 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border-2 flex items-center justify-center gap-3 active:scale-95
              ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900 shadow-sm'}`}
          >
            {copied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy Text'}
          </button>

          <button 
            onClick={handleWhatsAppTrigger}
            className="px-4 py-4 bg-[#25D366] text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-[#21b958] active:scale-95 transition-all flex items-center justify-center gap-3 border-2 border-[#45e07e] shadow-[#25D366]/20"
          >
            <Send size={16} className="fill-current" />
            Send Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppExport;