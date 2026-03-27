/* eslint-disable @typescript-eslint/no-unused-vars */
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
import Button from "../../../components/ui/Button";
import GlassCard from "../../../components/ui/GlassCard";

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
    <GlassCard className="border p-5 sm:p-6 text-left">
      
      <div className="space-y-6">
        {/* 1. Module Header */}
        <div className="flex justify-between items-start">
          <div className="text-left space-y-1">
            <h4 className="theme-admin-subheading uppercase italic">
              Instant Update
            </h4>
            <p className="theme-admin-label">
              Site Transmittal Protocol
            </p>
          </div>
          <div className="theme-surface-inset flex h-11 w-11 items-center justify-center rounded-2xl border">
            <Smartphone size={17} className="text-amber-500" />
          </div>
        </div>

        {/* 2. Message Preview Area */}
        <div className="theme-surface-inset relative rounded-[1.5rem] border p-5 text-left shadow-inner group">
          <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-100 transition-opacity">
            <MessageSquare size={14} className="text-amber-500" />
          </div>
          <p className="theme-admin-meta font-mono leading-relaxed whitespace-pre-wrap">
            {generatePlainMessage()}
          </p>
        </div>

        {/* 3. Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button 
            variant="outline"
            onClick={handleCopyText}
            className="theme-admin-control py-0"
            leftIcon={copied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
          >
            {copied ? 'Copied to Clipboard' : 'Copy Message'}
          </Button>

          <Button 
            variant="primary"
            onClick={handleWhatsAppTrigger}
            className="theme-admin-control py-0 bg-[#25D366]! text-white! hover:bg-[#22c35e]! border-none shadow-[#25D366]/20"
            leftIcon={<Send size={16} className="fill-current" />}
          >
            Share via WhatsApp
          </Button>
        </div>

        {/* 4. Security Footnote */}
        <div className="flex flex-col gap-3 border-t border-zinc-800/20 pt-5 opacity-60 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span className="theme-admin-label italic">
              Verified Distribution
            </span>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2">
               <Zap size={10} className="text-amber-500" />
               <span className="theme-admin-meta text-[0.72rem] uppercase">Fast Export</span>
             </div>
             <Share2 size={12} className="text-zinc-500" />
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default WhatsAppExport;
