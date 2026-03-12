/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { 
  MessageSquare, 
  Share2, 
  Send, 
  CheckCircle2, 
  Copy,
  Smartphone,
  ShieldCheck
} from 'lucide-react';

/* ======================================================
    MODULE RESOLUTION HANDLER (SANDBOX COMPATIBILITY)
   ====================================================== */

let useAuth: any = () => ({
  theme: 'dark',
});

const resolveModules = async () => {
  try {
    const authMod = await import("../../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;
  } catch (e) {
    // Sandbox fallback active
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
  data: IPCData;
  projectName: string;
}

/** --- MAIN COMPONENT: QUICK PROJECT SHARE --- **/

const WhatsAppExport: React.FC<WhatsAppExportProps> = ({ data, projectName }) => {
  const { theme } = useAuth();
  const [copied, setCopied] = useState(false);

  // Financial computation for the summary text
  const netDue = (data.workExecuted + data.materialsOnSite) * (1 - data.retentionPercent / 100) - data.previousCertified;
  const totalWithVat = netDue * 1.16;

  /** * MESSAGE GENERATOR
   * Uses standard template strings with newlines. 
   * We avoid manual %0A encoding here to prevent decode URI errors.
   */
  const generatePlainMessage = () => {
    return `QS VAULT: VALUATION UPDATE\n` +
           `----------------------------------------\n` +
           `Project: ${projectName.toUpperCase()}\n` +
           `Cert No: ${data.certNumber}\n` +
           `Date: ${data.valuationDate}\n\n` +
           `Measured Value: KES ${data.workExecuted.toLocaleString()}\n` +
           `Retention (${data.retentionPercent}%): KES ${(data.workExecuted * data.retentionPercent / 100).toLocaleString()}\n` +
           `----------------------------------------\n` +
           `NET AMOUNT DUE: KES ${netDue.toLocaleString()}\n` +
           `TOTAL (INC. VAT): KES ${totalWithVat.toLocaleString()}\n` +
           `----------------------------------------\n` +
           `Shared via QS Vault Construction OS v2.0`;
  };

  const handleWhatsAppTrigger = () => {
    // We encode the entire string at the point of transmission
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

  return (
    <div className={`p-8 rounded-[3rem] border backdrop-blur-3xl transition-all duration-500
      ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-2xl shadow-black/40' : 'bg-white border-zinc-200 shadow-xl'}`}>
      
      <div className="space-y-8">
        <div className="flex justify-between items-start">
          <div className="text-left space-y-1">
            <h4 className={`text-xl font-black uppercase italic tracking-tighter leading-none
              ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              Quick Share
            </h4>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">
              Construction Update Protocol
            </p>
          </div>
          <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-zinc-950 border border-zinc-800' : 'bg-zinc-50 border border-zinc-100'}`}>
            <Smartphone size={18} className="text-amber-500" />
          </div>
        </div>

        {/* Message Preview Box */}
        <div className={`p-6 rounded-4xl border relative group text-left
          ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800 shadow-inner' : 'bg-zinc-50 border-zinc-200 shadow-inner'}`}>
          <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-100 transition-opacity">
            <MessageSquare size={14} className="text-amber-500" />
          </div>
          <p className={`text-[10px] font-mono leading-relaxed whitespace-pre-wrap
            ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {generatePlainMessage()}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            type="button"
            onClick={handleCopyText}
            className={`flex items-center justify-center gap-3 py-5 rounded-2xl border transition-all active:scale-95
              ${copied 
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' 
                : theme === 'dark' 
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white' 
                  : 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:text-zinc-900'}`}
          >
            {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {copied ? 'Copied' : 'Copy Text'}
            </span>
          </button>

          <button 
            type="button"
            onClick={handleWhatsAppTrigger}
            className="flex items-center justify-center gap-3 py-5 bg-[#25D366] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all shadow-[#25D366]/20"
          >
            <Send size={16} className="fill-current" />
            WhatsApp
          </button>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-zinc-800/40 opacity-40">
          <div className="flex items-center gap-2">
            <ShieldCheck size={12} className="text-emerald-500" />
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 italic">
              Authorized Transmittal
            </span>
          </div>
          <div className="flex items-center gap-2">
             <Share2 size={12} className="text-zinc-500" />
             <span className="text-[8px] font-bold uppercase text-zinc-500">Live Secure Share</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppExport;