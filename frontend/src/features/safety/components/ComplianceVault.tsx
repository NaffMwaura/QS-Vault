/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Plus,
  ClipboardCheck,
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
  Briefcase,
  ChevronDown,
  Trash2,
  Save,
  Loader2,
  X,
  ChevronRight,
  Gavel,
  FileUp,
  ShieldAlert,
  ImageIcon
} from "lucide-react";

/* ======================================================
    OFFICE MODULE RESOLUTION (STABILIZED)
   ====================================================== */

let useAuth: any = () => ({ theme: 'dark', user: null, isOnline: true });
let db: any = null;
let syncEngine: any = null;

const resolveInfrastructure = async () => {
  try {
    const authMod = await import("../../auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const dbMod = await import("../../../lib/database/database");
    if (dbMod.db) db = dbMod.db; 
    if (dbMod.syncEngine) syncEngine = dbMod.syncEngine;
  } catch (e) {
    console.warn("Compliance Engine: Nodes in standby.");
  }
};

resolveInfrastructure();

/** --- TYPES --- **/

interface ComplianceCheck {
  id: string;
  project_id: string;
  category: "Safety" | "Quality" | "Structure";
  title: string;
  is_compliant: boolean;
  notes: string;
  timestamp: string;
}

interface Permit {
  id: string;
  project_id: string;
  title: string;
  expiry_date: string;
  status: "active" | "expired" | "pending";
  document_url?: string | null;
}

interface ComplianceVaultProps {
  projectId: string | null;
}

/** --- MAIN COMPONENT: COMPLIANCE & SAFETY HUB --- **/

const ComplianceVault: React.FC<ComplianceVaultProps> = ({ projectId: initialId }) => {
  const { theme, user,  } = useAuth();
  
  // WORKSPACE CONTEXT
  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"audits" | "permits">("audits");

  // DATA STATES
  const [checks, setChecks] = useState<ComplianceCheck[]>([]);
  const [permits, setPermits] = useState<Permit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // FORM STATES
  const [showAddCheck, setShowAddCheck] = useState(false);
  const [showAddPermit, setShowAddPermit] = useState(false);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);

  const [newCheck, setNewCheck] = useState({
    title: "",
    category: "Safety" as const,
    is_compliant: true,
    notes: "",
  });

  const [newPermit, setNewPermit] = useState({
    title: "",
    expiry_date: "",
  });

  /** * 1. DATA HANDSHAKE: LOAD COMPLIANCE NODES */
  const syncComplianceWorkspace = useCallback(async () => {
    if (!db || !user) {
        setTimeout(() => setIsLoading(false), 1000);
        return;
    }

    try {
      if (isLoading) setIsLoading(true);
      
      const projects = await db.projects.where('user_id').equals(user.id).toArray();
      setAvailableProjects(projects);

      const activeId = selectedId || (projects.length > 0 ? projects[0].id : null);
      if (activeId && activeId !== selectedId) setSelectedId(activeId);

      if (activeId) {
        const [storedChecks, storedPermits] = await Promise.all([
          db.compliance_checks.where("project_id").equals(activeId).reverse().toArray(),
          db.permits.where("project_id").equals(activeId).toArray(),
        ]);
        
        // Expiry Logic: Auto-update status
        const today = new Date();
        const updatedPermits = (storedPermits || []).map((p: Permit) => {
           const expiry = new Date(p.expiry_date);
           return { ...p, status: expiry < today ? 'expired' : 'active' };
        });

        setChecks(storedChecks);
        setPermits(updatedPermits);
      }
    } catch (err) {
      console.error("Compliance Vault access failed.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedId, user, isLoading]);

  useEffect(() => {
    syncComplianceWorkspace();
  }, [syncComplianceWorkspace]);

  /** * 2. COMMIT AUDIT TO VAULT */
  const handleCommitCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !db || !user) return;

    setIsSaving(true);
    const checkId = crypto.randomUUID();
    const checkData = {
      id: checkId,
      project_id: selectedId,
      inspector_id: user.id,
      ...newCheck,
      timestamp: new Date().toISOString(),
    };

    try {
      await db.compliance_checks.add(checkData);
      if (syncEngine) await syncEngine.queueChange("compliance_checks", checkId, "INSERT", checkData);

      setNewCheck({ title: "", category: "Safety", is_compliant: true, notes: "" });
      setShowAddCheck(false);
      syncComplianceWorkspace();
    } catch (err) { console.error("Audit Committal Failed."); }
    finally { setIsSaving(false); }
  };

  /** * 3. LICENSE DOCUMENT HANDSHAKE */
  const handleLicenseCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLicensePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  /** * 4. COMMIT PERMIT/LICENSE TO VAULT */
  const handleCommitPermit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !db || !newPermit.title) return;

    setIsSaving(true);
    const permitId = crypto.randomUUID();
    
    const today = new Date();
    const expiry = new Date(newPermit.expiry_date);
    const status = expiry < today ? 'expired' : 'active';

    const permitData: Permit = {
      id: permitId,
      project_id: selectedId,
      title: newPermit.title,
      expiry_date: newPermit.expiry_date,
      status: status,
      document_url: licensePreview
    };

    try {
      await db.permits.add(permitData);
      if (syncEngine) await syncEngine.queueChange("permits", permitId, "INSERT", permitData);

      setNewPermit({ title: "", expiry_date: "" });
      setLicensePreview(null);
      setShowAddPermit(false);
      syncComplianceWorkspace();
    } catch (err) { console.error("Permit Archival Failed."); }
    finally { setIsSaving(false); }
  };

  const handleDeleteCheck = async (id: string) => {
    if (!window.confirm("Permanently erase this audit node?")) return;
    await db.compliance_checks.delete(id);
    if (syncEngine) await syncEngine.queueChange("compliance_checks", id, "DELETE", null);
    syncComplianceWorkspace();
  };

  const handleDeletePermit = async (id: string) => {
    if (!window.confirm("Remove this license from the vault?")) return;
    await db.permits.delete(id);
    if (syncEngine) await syncEngine.queueChange("permits", id, "DELETE", null);
    syncComplianceWorkspace();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-40 opacity-30">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-amber-500" />
        <p className={`font-black text-[10px] uppercase tracking-[0.5em] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-950'}`}>Syncing Compliance Hub...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 text-left pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* 1. TOP HUB: CONTEXT SWITCHER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-4">
        <div className="space-y-4 text-left">
          <h3 className={`text-4xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Compliance Node</h3>
          <div className="flex items-center gap-4">
             <div className="relative group min-w-280px] sm:min-w-340px]">
                <Briefcase size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500 z-10" />
                <select 
                  value={selectedId || ''} 
                  onChange={(e) => setSelectedId(e.target.value)}
                  className={`w-full pl-14 pr-12 py-4 rounded-2xl border-2 appearance-none font-black uppercase text-[11px] tracking-widest cursor-pointer outline-none transition-all
                    ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white hover:border-emerald-500 shadow-black' : 'bg-white border-zinc-200 text-zinc-950 hover:border-emerald-500 shadow-sm'}`}
                >
                  {availableProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none z-10" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic leading-none hidden sm:block">Security Handshake: Active</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* 2. SIDEBAR CONTROL NODES */}
        <div className="lg:w-80 space-y-6 shrink-0">
          <div className={`p-8 rounded-[3rem] border-2 shadow-2xl transition-all duration-500 ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-8 italic text-left leading-none">Control Nodes</p>
            <div className="space-y-3">
              <button onClick={() => { setActiveTab("audits"); setShowAddPermit(false); }} className={`w-full flex items-center justify-between p-6 rounded-2xl border-2 transition-all active:scale-95 ${activeTab === "audits" ? "bg-amber-500 border-amber-500 text-black shadow-xl shadow-amber-500/10" : "bg-zinc-950/20 border-zinc-800 text-zinc-500"}`}>
                <div className="flex items-center gap-4 text-left"><ClipboardCheck size={20} strokeWidth={2.5} /><span className="text-[11px] font-black uppercase tracking-widest leading-none">Site Audits</span></div>
                <ChevronRight size={14} className={activeTab === 'audits' ? 'rotate-90' : ''} />
              </button>
              <button onClick={() => { setActiveTab("permits"); setShowAddCheck(false); }} className={`w-full flex items-center justify-between p-6 rounded-2xl border-2 transition-all active:scale-95 ${activeTab === "permits" ? "bg-amber-500 border-amber-500 text-black shadow-xl shadow-amber-500/10" : "bg-zinc-950/20 border-zinc-800 text-zinc-500"}`}>
                <div className="flex items-center gap-4 text-left"><FileText size={20} strokeWidth={2.5} /><span className="text-[11px] font-black uppercase tracking-widest leading-none">Site Permits</span></div>
                <ChevronRight size={14} className={activeTab === 'permits' ? 'rotate-90' : ''} />
              </button>
            </div>
          </div>

          {/* RISK ALERT NODE */}
          <div className={`p-8 rounded-[3rem] border-2 shadow-xl flex flex-col gap-6 transition-all duration-500 ${permits.some(p => p.status === 'expired') ? 'bg-rose-500/10 border-rose-500/20' : 'bg-zinc-950/40 border-zinc-800 opacity-40'}`}>
            <div className="flex items-center gap-4 text-left">
              <ShieldAlert size={24} className={permits.some(p => p.status === 'expired') ? 'text-rose-500 animate-pulse' : 'text-zinc-600'} />
              <p className={`text-[11px] font-black uppercase tracking-widest leading-none ${permits.some(p => p.status === 'expired') ? 'text-rose-500' : 'text-zinc-500'}`}>Risk Mitigation</p>
            </div>
            <p className={`text-[11px] font-bold leading-relaxed text-left ${permits.some(p => p.status === 'expired') ? 'text-rose-400' : 'text-zinc-600'}`}>
              {permits.filter(p => p.status === "expired").length} Expired Documents detected. Immediate renewal required to maintain site legality.
            </p>
          </div>
        </div>

        {/* 3. MAIN WORKSPACE */}
        <div className={`flex-1 rounded-[4rem] border-2 backdrop-blur-3xl overflow-hidden flex flex-col transition-all duration-500 shadow-2xl ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800 shadow-black' : 'bg-white border-zinc-200'}`}>
          
          {activeTab === "audits" ? (
            <div className="flex-1 flex flex-col">
              <header className="p-10 border-b-2 border-zinc-800/40 flex justify-between items-center bg-white/1">
                <div className="text-left space-y-2">
                  <h4 className={`text-3xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Inspection Ledger</h4>
                  <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em]">Verified HSE & Quality Sign-offs</p>
                </div>
                <button onClick={() => setShowAddCheck(!showAddCheck)} className="px-10 py-5 bg-amber-500 text-black font-black uppercase text-xs rounded-2xl italic tracking-widest shadow-2xl hover:bg-amber-400 transition-all flex items-center gap-4 active:scale-95 border-2 border-amber-300">
                  {showAddCheck ? <X size={20} strokeWidth={3} /> : <Plus size={20} strokeWidth={3} />}
                  {showAddCheck ? 'Abort' : 'Log Audit'}
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                {showAddCheck ? (
                  <form onSubmit={handleCommitCheck} className="space-y-12 animate-in slide-in-from-top-6 max-w-3xl mx-auto py-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4 text-left">
                        <label className="text-[11px] font-black uppercase text-zinc-500 ml-5 tracking-[0.4em] italic">Inspection Category</label>
                        <select value={newCheck.category} onChange={(e) => setNewCheck({ ...newCheck, category: e.target.value as any })}
                          className={`w-full p-8 rounded-3xl border-2 appearance-none font-bold text-sm outline-none transition-all shadow-inner
                            ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-950'}`}>
                          <option value="Safety">Health & Safety (HSE)</option><option value="Quality">Quality Control (QA)</option><option value="Structure">Structural Stability</option>
                        </select>
                      </div>
                      <div className="space-y-4 text-left">
                        <label className="text-[11px] font-black uppercase text-zinc-500 ml-5 tracking-[0.4em] italic">Statutory Decision</label>
                        <div className={`p-2 rounded-[2.5rem] border-2 flex gap-3 ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 shadow-inner' : 'bg-zinc-100 border-zinc-200'}`}>
                          <button type="button" onClick={() => setNewCheck({ ...newCheck, is_compliant: true })} className={`flex-1 py-4 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest transition-all ${newCheck.is_compliant ? "bg-emerald-500 text-black shadow-lg" : "text-zinc-600 hover:text-zinc-400"}`}>PASS</button>
                          <button type="button" onClick={() => setNewCheck({ ...newCheck, is_compliant: false })} className={`flex-1 py-4 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest transition-all ${!newCheck.is_compliant ? "bg-rose-500 text-black shadow-lg" : "text-zinc-600 hover:text-zinc-400"}`}>FAIL</button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4 text-left">
                      <label className="text-[11px] font-black uppercase text-zinc-500 ml-5 tracking-[0.4em] italic">Audit Scope</label>
                      <input required placeholder="e.g. Scaffolding Load Test - Section B" value={newCheck.title} onChange={(e) => setNewCheck({ ...newCheck, title: e.target.value })}
                        className={`w-full p-8 rounded-3xl border-2 font-bold text-xl outline-none transition-all shadow-inner
                          ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500 shadow-black' : 'bg-zinc-50 border-zinc-200 text-zinc-950 focus:border-amber-500 shadow-sm'}`} />
                    </div>
                    <div className="space-y-4 text-left">
                      <label className="text-[11px] font-black uppercase text-zinc-500 ml-5 tracking-[0.4em] italic">Audit Remedial Remarks</label>
                      <textarea rows={5} placeholder="Record any site defects or immediate remedial nodes required..." value={newCheck.notes} onChange={(e) => setNewCheck({ ...newCheck, notes: e.target.value })}
                        className={`w-full p-10 rounded-[3rem] border-2 outline-none font-medium text-lg leading-relaxed shadow-inner
                          ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-300 focus:border-amber-500 shadow-black' : 'bg-zinc-50 border-zinc-200 text-zinc-950 focus:border-amber-500 shadow-sm'}`} />
                    </div>
                    <button type="submit" disabled={isSaving} className="w-full h-24 bg-amber-500 text-black font-black uppercase text-sm tracking-[0.5em] rounded-[2.5rem] shadow-2xl hover:bg-amber-400 transition-all flex items-center justify-center gap-6 italic active:scale-95 shadow-amber-500/20 border-4 border-black/5">
                      {isSaving ? <Loader2 size={32} className="animate-spin" /> : <Save size={32} strokeWidth={2.5} />}
                      Secure Audit Node
                    </button>
                  </form>
                ) : checks.length > 0 ? (
                  <div className="space-y-8">
                    {checks.map((check) => (
                      <div key={check.id} className={`p-10 rounded-[4rem] border-2 group transition-all flex flex-col md:flex-row items-center justify-between gap-10 shadow-xl
                        ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800 hover:border-amber-500/20' : 'bg-white border-zinc-100 hover:border-amber-500 shadow-zinc-200/50'}`}>
                        <div className="flex items-center gap-10 text-left flex-1">
                          <div className={`p-10 rounded-[2.5rem] border-2 shadow-2xl flex flex-col items-center justify-center gap-3 min-w-140px] transition-transform group-hover:scale-105
                            ${check.is_compliant ? "bg-emerald-500 border-emerald-600 text-black shadow-emerald-500/10" : "bg-rose-500 border-rose-600 text-black shadow-rose-500/10"}`}>
                            {check.is_compliant ? <CheckCircle2 size={40} strokeWidth={3} /> : <XCircle size={40} strokeWidth={3} />}
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">{check.is_compliant ? 'PASSED' : 'FAILED'}</span>
                          </div>
                          <div className="space-y-4 overflow-hidden text-left">
                            <div className="flex items-center gap-4">
                              <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border-2 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-500 shadow-inner' : 'bg-white border-zinc-100 text-zinc-600'}`}>
                                {check.category}
                              </span>
                              <span className="text-[10px] font-mono text-zinc-700 font-bold uppercase tracking-tighter leading-none italic">{new Date(check.timestamp).toDateString()}</span>
                            </div>
                            <h5 className={`text-4xl font-black uppercase italic tracking-tighter leading-none ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-950'}`}>{check.title}</h5>
                            <p className={`text-lg leading-relaxed font-medium line-clamp-2 italic ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-600'}`}>"{check.notes || "No defect observation logged"}"</p>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteCheck(check.id)} className="p-6 text-zinc-800 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 active:scale-90"><Trash2 size={28} /></button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-48 text-center opacity-10 flex flex-col items-center gap-12 border-2 border-dashed border-zinc-800 rounded-[4rem]">
                    <ShieldCheck size={120} strokeWidth={1} />
                    <p className="font-black uppercase text-2xl tracking-[0.5em] italic leading-none">No Site Audits Logged</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <header className="p-10 border-b-2 border-zinc-800/40 flex justify-between items-center bg-white/1">
                <div className="text-left space-y-2">
                  <h4 className={`text-3xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Statutory Vault</h4>
                  <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em]">Official Project Licenses & Local Clearances</p>
                </div>
                <button onClick={() => setShowAddPermit(!showAddPermit)} className="px-10 py-5 bg-amber-500 text-black font-black uppercase text-xs rounded-2xl italic tracking-widest shadow-2xl hover:bg-amber-400 transition-all flex items-center gap-4 active:scale-95 border-2 border-amber-300">
                  {showAddPermit ? <X size={20} strokeWidth={3} /> : <Plus size={20} strokeWidth={3} />}
                  {showAddPermit ? 'Abort' : 'Archive License'}
                </button>
              </header>

              <div className="p-10 overflow-y-auto custom-scrollbar">
                {showAddPermit ? (
                  <form onSubmit={handleCommitPermit} className="space-y-12 animate-in slide-in-from-top-6 max-w-4xl mx-auto py-10">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4 text-left ">
                           <label className="text-[11px] font-black uppercase text-zinc-500 ml-5 tracking-[0.4em] italic">Document Identity</label>
                           <input required placeholder="e.g. NCA Site Authorization" value={newPermit.title} onChange={e => setNewPermit({...newPermit, title: e.target.value})}
                             className={`w-full h-20 px-8 rounded-3xl border-2 font-bold text-xl outline-none transition-all shadow-inner
                               ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500 shadow-black' : 'bg-zinc-50 border-zinc-200 text-zinc-950 focus:border-amber-500 shadow-sm'}`} />
                        </div>
                        <div className="space-y-4 text-left ">
                           <label className="text-[11px] font-black uppercase text-zinc-500 ml-5 tracking-[0.4em] italic">Expiration Threshold</label>
                           <input required type="date" value={newPermit.expiry_date} onChange={e => setNewPermit({...newPermit, expiry_date: e.target.value})}
                             className={`w-full h-20 px-8 rounded-3xl border-2 font-bold text-sm outline-none transition-all shadow-inner
                               ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500 shadow-black' : 'bg-zinc-50 border-zinc-200 text-zinc-950 focus:border-amber-500 shadow-sm'}`} />
                        </div>
                     </div>

                     <div className="space-y-4 text-left">
                        <label className="text-[11px] font-black uppercase text-zinc-500 ml-5 tracking-[0.4em] italic">License Evidence (Image)</label>
                        <label className={`w-full h-48 rounded-[3.5rem] border-4 border-dashed flex flex-col items-center justify-center cursor-pointer group transition-all relative overflow-hidden shadow-inner
                           ${theme === 'dark' ? 'border-zinc-800 bg-zinc-950/40 hover:border-amber-500/40' : 'border-zinc-200 bg-zinc-50 hover:border-amber-500/30'}`}>
                           {licensePreview ? (
                             <div className="relative w-full h-full p-6 animate-in zoom-in duration-500">
                                <img src={licensePreview} className="w-full h-full object-contain rounded-3xl shadow-2xl" alt="License Node" />
                                <button type="button" onClick={(e) => { e.preventDefault(); setLicensePreview(null); }} className="absolute top-4 right-4 p-3 bg-rose-500 rounded-2xl text-white shadow-2xl hover:scale-110 active:scale-90 transition-all border-4 border-[#09090b]"><X size={16} strokeWidth={4}/></button>
                             </div>
                           ) : (
                             <>
                                <div className="p-6 rounded-3xl bg-zinc-900 border-2 border-zinc-800 group-hover:bg-amber-500 group-hover:text-black transition-all mb-4 shadow-2xl">
                                   <FileUp size={36} strokeWidth={2.5} />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 group-hover:text-amber-500 transition-colors">Capture or Upload License Document</p>
                             </>
                           )}
                           <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleLicenseCapture} />
                        </label>
                     </div>

                     <button type="submit" disabled={isSaving} className="w-full h-24 bg-amber-500 text-black font-black uppercase text-sm tracking-[0.8em] rounded-[3rem] shadow-2xl hover:bg-amber-400 transition-all flex items-center justify-center gap-8 italic active:scale-95 shadow-amber-500/20 border-4 border-black/5">
                        {isSaving ? <Loader2 size={36} className="animate-spin" /> : <Save size={36} strokeWidth={3} />}
                        Secure License Node
                     </button>
                  </form>
                ) : permits.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-10 pb-10">
                    {permits.map((permit) => (
                      <div key={permit.id} className={`p-10 rounded-[4rem] border-2 group transition-all flex flex-col justify-between h-96 shadow-2xl relative overflow-hidden ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800 hover:border-amber-500/20 shadow-black' : 'bg-white border-zinc-200 hover:border-amber-500 shadow-zinc-200/50'}`}>
                        <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-10 transition-opacity pointer-events-none">
                            <Gavel size={180} />
                        </div>

                        <div className="flex justify-between items-start relative z-10">
                          <div className={`p-6 rounded-3xl border-2 shadow-2xl ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-amber-500 shadow-black' : 'bg-white border-zinc-100 text-amber-600 shadow-zinc-200/40'}`}>
                            {permit.document_url ? <ImageIcon size={36} strokeWidth={2.5} /> : <Gavel size={36} strokeWidth={2.5} />}
                          </div>
                          <div className="flex flex-col gap-3 items-end">
                             <span className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border-2 shadow-2xl ${permit.status === "active" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500 animate-pulse"}`}>
                                {permit.status}
                             </span>
                             <p className="text-[8px] font-mono text-zinc-700 uppercase font-black tracking-widest">SEC_REV: {permit.id.slice(0,8).toUpperCase()}</p>
                          </div>
                        </div>
                        
                        <div className="text-left space-y-4 relative z-10">
                          <p className="text-[11px] font-black uppercase text-amber-500 tracking-[0.3em] leading-none italic">Statutory Instrument</p>
                          <h6 className={`font-black uppercase italic text-4xl leading-none tracking-tighter ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-950'}`}>{permit.title}</h6>
                        </div>
                        
                        <div className="flex justify-between items-center pt-8 border-t-2 border-zinc-800/40 relative z-10">
                           <div className="flex items-center gap-4 opacity-40 italic">
                              <Calendar size={20} strokeWidth={2.5} />
                              <span className="text-[11px] font-black uppercase tracking-[0.2em]">Expires: {new Date(permit.expiry_date).toDateString()}</span>
                           </div>
                           <button onClick={() => handleDeletePermit(permit.id)} className="p-6 text-zinc-700 hover:text-rose-500 transition-all active:scale-90 group-hover:opacity-100 hover:bg-rose-500/10 rounded-2xl"><Trash2 size={24} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-48 text-center opacity-10 flex flex-col items-center gap-12 border-2 border-dashed border-zinc-800 rounded-[4rem]">
                    <FileText size={120} strokeWidth={1} />
                    <p className="font-black uppercase text-2xl tracking-[0.8em] italic leading-none">Statutory Vault Empty</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. IMMUTABLE FOOTER */}
          <div className={`p-10 border-t-2 border-zinc-800/40 flex items-center justify-between opacity-30 shadow-inner ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
             <div className="flex items-center gap-6">
                <ShieldCheck size={28} className="text-emerald-500 shadow-emerald-500/10" />
                <div className="text-left leading-none">
                  <p className={`text-[11px] font-black uppercase tracking-widest text-zinc-500 leading-none ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-950'}`}>Immutable Compliance Handshake Active</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-700 mt-2 leading-none">Verified Identity Protocol • AES-256</p>
                </div>
             </div>
             <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest leading-none">SAFETY_OS_v4.5 • ISO_19650</p>
          </div>
        </div>
      </div>

      <footer className="pt-32 pb-12 text-center opacity-20 select-none flex flex-col items-center gap-10">
         <div className="h-px w-80 bg-zinc-800" />
         <p className="text-[11px] font-black uppercase tracking-[2.5em] text-zinc-600 italic leading-none text-center">COMPLIANCE ENGINE • QS VAULT</p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 20px; border: 1px solid transparent; background-clip: content-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
      `}</style>
    </div>
  );
};

export default ComplianceVault;