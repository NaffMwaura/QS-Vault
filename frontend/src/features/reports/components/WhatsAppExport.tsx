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
  ShieldCheck,
  Zap
} from 'lucide-react';

/* ======================================================
    OFFICE MODULE RESOLUTION (PRO-DEV SETUP)
   ====================================================== */

let useAuth: any = () => ({ theme: 'dark' });
let Button: any = ({ children, onClick, className}: any) => (
  <button onClick={onClick} className={className}>{children}</button>
);
let GlassCard: any = ({ children, className }: any) => (
  <div className={className}>{children}</div>
);

const resolveModules = async () => {
  try {
    const authMod = await import("../../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const btnMod = await import("../../../components/ui/Button");
    if (btnMod.default) Button = btnMod.default;

    const glassMod = await import("../../../components/ui/GlassCard");
    if (glassMod.default) GlassCard = glassMod.default;
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

  /** * FINANCIAL HANDSHAKE
   * Calculations aligned with the main Canvas valuation engine.
   */
  const netDue = (data.workExecuted + data.materialsOnSite) * (1 - data.retentionPercent / 100) - data.previousCertified;
  const totalWithVat = netDue * 1.16; // Standard 16% Kenya VAT

  /** * MESSAGE GENERATOR
   * Formats the site data into a professional industrial bulletin.
   */
  const generatePlainMessage = () => {
    return `QS VAULT: VALUATION SUMMARY\n` +
           `--------------------------------\n` +
           `PROJECT: ${projectName.toUpperCase()}\n` +
           `CERT NO: ${data.certNumber}\n` +
           `DATE: ${data.valuationDate}\n\n` +
           `WORK VALUE: KES ${data.workExecuted.toLocaleString()}\n` +
           `RETENTION (${data.retentionPercent}%): KES ${(data.workExecuted * data.retentionPercent / 100).toLocaleString()}\n` +
           `--------------------------------\n` +
           `NET PAYABLE: KES ${netDue.toLocaleString()}\n` +
           `TOTAL (INC. VAT): KES ${totalWithVat.toLocaleString()}\n` +
           `--------------------------------\n` +
           `Sent via QS Vault Precision OS`;
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

  return (
    <GlassCard className="p-8 sm:p-10 border text-left">
      
      <div className="space-y-8">
        {/* 1. Module Header */}
        <div className="flex justify-between items-start">
          <div className="text-left space-y-1">
            <h4 className={`text-xl font-black uppercase italic tracking-tighter leading-none
              ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              Instant Update
            </h4>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">
              Site Transmittal Protocol
            </p>
          </div>
          <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-zinc-950 border border-zinc-800' : 'bg-zinc-50 border border-zinc-100'}`}>
            <Smartphone size={18} className="text-amber-500" />
          </div>
        </div>

        {/* 2. Message Preview Area */}
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

        {/* 3. Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button 
            variant="outline"
            onClick={handleCopyText}
            className="py-5"
            leftIcon={copied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
          >
            {copied ? 'Copied to Clipboard' : 'Copy Message'}
          </Button>

          <Button 
            variant="primary"
            onClick={handleWhatsAppTrigger}
            className="py-5 bg-[#25D366]! text-white! hover:bg-[#22c35e]! border-none shadow-[#25D366]/20"
            leftIcon={<Send size={16} className="fill-current" />}
          >
            Share via WhatsApp
          </Button>
        </div>

        {/* 4. Security Footnote */}
        <div className="flex items-center justify-between pt-6 border-t border-zinc-800/40 opacity-40">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 italic">
              Verified Distribution
            </span>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2">
               <Zap size={10} className="text-amber-500" />
               <span className="text-[8px] font-black uppercase text-zinc-500">Fast Export</span>
             </div>
             <Share2 size={12} className="text-zinc-500" />
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default WhatsAppExport;