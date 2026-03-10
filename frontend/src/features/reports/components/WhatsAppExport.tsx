/* eslint-disable @typescript-eslint/no-unused-vars */
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

/** --- MAIN COMPONENT --- **/

const WhatsAppExport: React.FC<WhatsAppExportProps> = ({ data, projectName }) => {
  const { theme } = useAuth();
  const [copied, setCopied] = useState(false);

  // Distill financial node for transmission
  const netDue = (data.workExecuted + data.materialsOnSite) * (1 - data.retentionPercent / 100) - data.previousCertified;
  const totalWithVat = netDue * 1.16;

  // Generate Professional QS Message Template
  const generateMessage = () => {
    return `*QS VAULT: PAYMENT CERTIFICATION NODE*%0A` +
           `----------------------------------------%0A` +
           `*Project:* ${projectName.toUpperCase()}%0A` +
           `*Cert No:* ${data.certNumber}%0A` +
           `*Valuation Date:* ${data.valuationDate}%0A%0A` +
           `*Gross Value:* KES ${data.workExecuted.toLocaleString()}%0A` +
           `*Retention (${data.retentionPercent}%):* KES ${(data.workExecuted * data.retentionPercent / 100).toLocaleString()}%0A` +
           `----------------------------------------%0A` +
           `*NET AMOUNT DUE:* KES ${netDue.toLocaleString()}%0A` +
           `*TOTAL (INC. 16% VAT):* KES ${totalWithVat.toLocaleString()}%0A` +
           `----------------------------------------%0A` +
           `_Authorized via QS Vault Precision OS v2.0_`;
  };

  const handleWhatsAppTrigger = () => {
    const url = `https://wa.me/?text=${generateMessage()}`;
    window.open(url, '_blank');
  };

  const handleCopyProtocol = () => {
    const rawText = decodeURIComponent(generateMessage()).replace(/\*/g, '');
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
      ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-xl'}`}>
      
      <div className="space-y-8">
        {/* 1. Export Node Header */}
        <div className="flex justify-between items-start">
          <div className="text-left space-y-1">
            <h4 className={`text-xl font-black uppercase italic tracking-tighter leading-none
              ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              Communication Node
            </h4>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">
              Site Handshake Protocol
            </p>
          </div>
          <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-zinc-950 border border-zinc-800' : 'bg-zinc-50 border border-zinc-100'}`}>
            <Smartphone size={18} className="text-amber-500" />
          </div>
        </div>

        {/* 2. Message Preview Box (Sunlight Optimized) */}
        <div className={`p-6 rounded-4xl border relative group text-left
          ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
          <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-100 transition-opacity">
            <MessageSquare size={14} className="text-amber-500" />
          </div>
          <p className={`text-[10px] font-mono leading-relaxed whitespace-pre-wrap
            ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {decodeURIComponent(generateMessage()).replace(/\*/g, '')}
          </p>
        </div>

        {/* 3. Action Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={handleCopyProtocol}
            className={`flex items-center justify-center gap-3 py-5 rounded-2xl border transition-all active:scale-95
              ${copied 
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' 
                : theme === 'dark' 
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white' 
                  : 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:text-zinc-900'}`}
          >
            {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {copied ? 'Node Copied' : 'Copy Payload'}
            </span>
          </button>

          <button 
            onClick={handleWhatsAppTrigger}
            className="flex items-center justify-center gap-3 py-5 bg-[#25D366] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all shadow-[#25D366]/20"
          >
            <Send size={16} className="fill-current" />
            WhatsApp Node
          </button>
        </div>

        {/* 4. Integrity Handshake Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800/40 opacity-40">
          <div className="flex items-center gap-2">
            <ShieldCheck size={12} className="text-emerald-500" />
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 italic">
              Authenticated Transmission
            </span>
          </div>
          <div className="flex items-center gap-2">
             <Share2 size={12} className="text-zinc-500" />
             <span className="text-[8px] font-bold uppercase text-zinc-500">Node-L4 Share active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppExport;