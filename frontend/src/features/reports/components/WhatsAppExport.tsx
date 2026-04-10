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

// STANDARD IMPORTS: Guaranteed to be stable for your presentation
import { useAuth } from "../../auth/AuthContext";

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
  projectId?: string; // Optional: If provided, it fetches from DB
  projectName: string;
  data?: IPCData;     // Optional: If provided, it uses this manual data (Fixes Admin Dashboard Error)
}

/** --- MAIN COMPONENT: QUICK PROJECT SHARE --- **/

const WhatsAppExport: React.FC<WhatsAppExportProps> = ({ projectId, projectName, data: manualData }) => {
  const { theme } = useAuth();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(manualData ? false : true);

  // Local State (Used only if manualData is not provided)
  const [fetchedData, setFetchedData] = useState<IPCData>({
    certNumber: "IPC/001",
    valuationDate: new Date().toLocaleDateString(),
    contractSum: 0,
    workExecuted: 0,
    materialsOnSite: 0,
    previousCertified: 0,
    retentionPercent: 10 
  });

  /** * DATA HARVEST: SYNCHRONIZED WITH CERTIFICATE ENGINE */
  const loadFinancials = useCallback(async () => {
    // Skip if we already have manual data or no DB connection
    const dbMod = await import("../../../lib/database/database");
    const db = dbMod.db;

    if (!db || manualData) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const rawMeasurements = await db.measurements.toArray();
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
      console.error("Valuation Error: Data harvest failed.", err);
    } finally {
      setLoading(false);
    }
  }, [manualData]);

  useEffect(() => {
    loadFinancials();
  }, [loadFinancials]);

  /** * FINANCIAL HANDSHAKE
   * Uses manualData if passed from Admin Dashboard, otherwise uses fetched data.
   */
  const activeData = manualData || fetchedData;

  const financials = useMemo(() => {
    const grossValuation = activeData.workExecuted + activeData.materialsOnSite;
    const retentionAmount = grossValuation * (activeData.retentionPercent / 100);
    const netValuation = grossValuation - retentionAmount;
    const currentAmountDue = netValuation - activeData.previousCertified;
    const taxAmount = currentAmountDue * 0.16; 
    
    return {
      grossValuation,
      retentionAmount,
      netValuation,
      currentAmountDue,
      taxAmount,
      totalDue: currentAmountDue + taxAmount
    };
  }, [activeData]);

  /** * MESSAGE GENERATOR */
  const generatePlainMessage = () => {
    return `*QS VAULT: PAYMENT CERTIFICATE SUMMARY*\n` +
           `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
           `*PROJECT:* ${projectName.toUpperCase()}\n` +
           `*CERT NO:* ${activeData.certNumber}\n` +
           `*DATE:* ${activeData.valuationDate}\n\n` +
           `*GROSS VALUATION:* KES ${financials.grossValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}\n` +
           `*LESS RETENTION (${activeData.retentionPercent}%):* - KES ${financials.retentionAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}\n` +
           `*LESS PREVIOUS PAYMENTS:* - KES ${activeData.previousCertified.toLocaleString(undefined, { minimumFractionDigits: 2 })}\n` +
           `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
           `*NET AMOUNT DUE:* KES ${financials.currentAmountDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}\n` +
           `*VAT (16%):* KES ${financials.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}\n` +
           `*TOTAL (INC. VAT):* KES ${financials.totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}\n` +
           `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
           `_Generated & Secured via QS Vault Precision OS_`;
  };

  const handleWhatsAppTrigger = () => {
    const encodedText = encodeURIComponent(generatePlainMessage());
    const url = `https://wa.me/?text=${encodedText}`;
    window.open(url, '_blank');
  };

  const handleCopyText = () => {
    const rawText = generatePlainMessage();
    const dummy = document.createElement("textarea");
    document.body.appendChild(dummy);
    dummy.value = rawText;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
    
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className={`p-10 rounded-[2.5rem] border-2 transition-all duration-500 w-full flex flex-col items-center justify-center
        ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-amber-500" />
        <p className={`font-black text-[9px] uppercase tracking-[0.4em] italic ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
          Compiling Shareable Link...
        </p>
      </div>
    );
  }

  return (
    <div className={`p-8 sm:p-10 rounded-[3rem] border-2 shadow-2xl transition-all duration-500 w-full text-left
      ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
      
      <div className="space-y-6">
        {/* 1. Module Header */}
        <div className="flex justify-between items-start">
          <div className="text-left space-y-1.5">
            <h4 className={`text-xl font-black uppercase italic tracking-tighter leading-none
              ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              Instant Update
            </h4>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">
              Site Transmittal Protocol
            </p>
          </div>
          <div className={`p-3 rounded-xl shadow-inner border-2 ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
            <Smartphone size={20} className="text-amber-500" />
          </div>
        </div>

        {/* 2. Message Preview Area */}
        <div className={`p-6 rounded-2xl border-2 relative group text-left overflow-hidden transition-colors
          ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800 shadow-inner' : 'bg-zinc-50 border-zinc-200 shadow-inner'}`}>
          <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-100 transition-opacity">
            <MessageSquare size={14} className="text-amber-500" />
          </div>
          <p className={`text-[11px] font-mono leading-relaxed whitespace-pre-wrap break-words
            ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {generatePlainMessage()}
          </p>
        </div>

        {/* 3. Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0 pt-2">
          <button 
            onClick={handleCopyText}
            className={`px-4 py-4 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all border-2 flex items-center justify-center gap-2 active:scale-95 shadow-xl
              ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900 shadow-sm'}`}
          >
            {copied ? <CheckCircle2 size={14} className="text-emerald-500" strokeWidth={2.5} /> : <Copy size={14} strokeWidth={2.5} />}
            {copied ? 'Copied' : 'Copy Message'}
          </button>

          <button 
            onClick={handleWhatsAppTrigger}
            className="px-4 py-4 bg-[#25D366] text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-2xl hover:bg-[#22c35e] active:scale-95 transition-all flex items-center justify-center gap-2 border-2 border-[#45e07e] shadow-[#25D366]/20"
          >
            <Send size={14} className="fill-current" />
            Share WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppExport;