import React, { useState, useMemo } from 'react';
import { 
  Send, 
  CheckCircle2, 
  Copy,
  Smartphone,
  ShieldCheck,
  Zap
} from 'lucide-react';

// Standard Infrastructure
import { useAuth } from "../../auth/AuthContext";
import type { Measurement } from "../../takeoff/types/takeoff";

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
  projectId: string;
  projectName: string;
  measurements: Measurement[]; // PRO-DATA: Passed from parent to ensure synchronization
  data?: IPCData;              // OPTIONAL: Admin override
}

/** --- MAIN COMPONENT: INSTANT SITE UPDATE --- **/
const WhatsAppExport: React.FC<WhatsAppExportProps> = ({ 
  projectName, 
  measurements,
  data: manualData 
}) => {
  const { theme } = useAuth();
  const [copied, setCopied] = useState(false);

  /** * 1. THE CALCULATION ENGINE
   * We calculate the totals from the 'measurements' prop.
   * This is the same logic used in the BoQ, ensuring 100% consistency.
   */
  const calculatedTotals = useMemo(() => {
    // Group and calculate values based on trade rates
    let totalExecuted = 0;

    measurements.forEach((m) => {
      if (!m.value) return;
      
      // Industrial Rate Mapping (Aligned with BoQ Generator)
      let rate = 4500;
      if (m.sectionCode?.includes('Concrete') || m.unit === 'm³') rate = 14500;
      if (m.sectionCode?.includes('Walling')) rate = 2800;
      if (m.sectionCode?.includes('Finishes')) rate = 1800;
      if (m.sectionCode?.includes('Doors') || m.type === 'count') rate = 18500;
      if (m.sectionCode?.includes('Excavation')) rate = 850;

      totalExecuted += (m.value * rate);
    });

    const retentionPercent = manualData?.retentionPercent || 10;
    const workDone = totalExecuted + (manualData?.materialsOnSite || 0);
    const securityHold = workDone * (retentionPercent / 100);
    const amountDueNow = workDone - securityHold - (manualData?.previousCertified || 0);
    const tax = amountDueNow * 0.16;

    return {
      workDone,
      securityHold,
      amountDueNow,
      tax,
      grandTotal: amountDueNow + tax,
      retentionPercent,
      date: manualData?.valuationDate || new Date().toLocaleDateString()
    };
  }, [measurements, manualData]);

  /** * 2. MESSAGE TEMPLATE (High Contrast for Site Reading) */
  const generateMessage = () => {
    return `*QS VAULT: PROJECT UPDATE*\n` +
           `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
           `*PROJECT:* ${projectName.toUpperCase()}\n` +
           `*DATE:* ${calculatedTotals.date}\n\n` +
           `*VALUE OF WORK:* KES ${calculatedTotals.workDone.toLocaleString()}\n` +
           `*RETENTION (${calculatedTotals.retentionPercent}%):* - KES ${calculatedTotals.securityHold.toLocaleString()}\n` +
           `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
           `*NET PAYABLE:* KES ${calculatedTotals.amountDueNow.toLocaleString()}\n` +
           `*VAT (16%):* KES ${calculatedTotals.tax.toLocaleString()}\n\n` +
           `*TOTAL CLAIM:* KES ${calculatedTotals.grandTotal.toLocaleString()}\n` +
           `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
           `_Verified via QS Vault OS_`;
  };

  const handleWhatsAppTrigger = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(generateMessage())}`, '_blank');
  };

  const handleCopy = () => {
    const el = document.createElement('textarea');
    el.value = generateMessage();
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`p-8 sm:p-10 rounded-[3rem] border-2 shadow-2xl transition-all duration-500 w-full text-left
      ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800' : 'bg-white border-zinc-200'}`}>
      
      <div className="space-y-8">
        {/* Module Identity */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h4 className={`text-xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              Mobile Dispatch
            </h4>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">
              Push nodes to WhatsApp
            </p>
          </div>
          <div className={`p-3 rounded-xl border-2 ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100 shadow-inner'}`}>
            <Smartphone size={20} className="text-amber-500" />
          </div>
        </div>

        {/* Message Preview */}
        <div className={`p-6 rounded-2xl border-2 relative overflow-hidden transition-colors
          ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800 shadow-inner' : 'bg-zinc-50 border-zinc-200 shadow-inner'}`}>
          <div className="absolute top-4 right-4 opacity-10">
            <ShieldCheck size={14} className="text-emerald-500" />
          </div>
          <p className={`text-[11px] font-mono leading-relaxed whitespace-pre-wrap ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {generateMessage()}
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={handleCopy}
            className={`px-6 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border-2 flex items-center justify-center gap-3 active:scale-95
              ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600 shadow-sm'}`}
          >
            {copied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
            {copied ? 'Copied to Clipboard' : 'Copy Message'}
          </button>

          <button 
            onClick={handleWhatsAppTrigger}
            className="px-6 py-4 bg-[#25D366] text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-[#21b958] active:scale-95 transition-all flex items-center justify-center gap-3 border-2 border-[#45e07e]"
          >
            <Send size={16} className="fill-current" />
            Send via WhatsApp
          </button>
        </div>

        {/* Audit Status */}
        <div className="flex items-center gap-3 opacity-30 pt-2">
           <Zap size={14} className="text-amber-500" />
           <p className="text-[8px] font-black uppercase tracking-widest">Nodes Synchronized with Project Vault</p>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppExport;