/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  AlertTriangle,
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
  Gavel
} from "lucide-react";

/* ======================================================
    OFFICE MODULE RESOLUTION
   ====================================================== */

let useAuth: any = () => ({ theme: 'dark', user: null });
let db: any = null;
let syncEngine: any = null;

const resolveModules = async () => {
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

resolveModules();

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
}

interface ComplianceVaultProps {
  projectId: string | null;
}

/** --- MAIN COMPONENT: COMPLIANCE & SAFETY HUB --- **/

const ComplianceVault: React.FC<ComplianceVaultProps> = ({ projectId: initialId }) => {
  const { theme, user } = useAuth();
  
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
        setTimeout(() => setIsLoading(false), 800);
        return;
    }

    try {
      setIsLoading(true);
      
      const projects = await db.projects.where('user_id').equals(user.id).toArray();
      setAvailableProjects(projects);

      if (selectedId) {
        const [storedChecks, storedPermits] = await Promise.all([
          db.compliance_checks.where("project_id").equals(selectedId).reverse().toArray(),
          db.permits.where("project_id").equals(selectedId).toArray(),
        ]);
        setChecks(storedChecks);
        setPermits(storedPermits);
      } else if (projects.length > 0) {
        setSelectedId(projects[0].id);
      }
    } catch (err) {
      console.error("Compliance Vault access failed.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedId, user]);

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

  /** * 3. COMMIT PERMIT/LICENSE TO VAULT */
  const handleCommitPermit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !db || !newPermit.title) return;

    setIsSaving(true);
    const permitId = crypto.randomUUID();
    
    // Logic: Determine status based on date
    const today = new Date();
    const expiry = new Date(newPermit.expiry_date);
    const status = expiry < today ? 'expired' : 'active';

    const permitData: Permit = {
      id: permitId,
      project_id: selectedId,
      title: newPermit.title,
      expiry_date: newPermit.expiry_date,
      status: status
    };

    try {
      await db.permits.add(permitData);
      if (syncEngine) await syncEngine.queueChange("permits", permitId, "INSERT", permitData);

      setNewPermit({ title: "", expiry_date: "" });
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
    if (!window.confirm("Remove this license/permit from the vault?")) return;
    await db.permits.delete(id);
    if (syncEngine) await syncEngine.queueChange("permits", id, "DELETE", null);
    syncComplianceWorkspace();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-40 opacity-30">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-amber-500" />
        <p className={`font-black text-[10px] uppercase tracking-[0.5em] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-950'}`}>Opening Audit Vault...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 text-left pb-10">
      
      {/* 1. MASTER CONTEXT SWITCHER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-4">
        <div className="space-y-3">
          <h3 className={`text-4xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Compliance Node</h3>
          <div className="flex items-center gap-4">
             <div className="relative group">
                <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                <select 
                  value={selectedId || ''} 
                  onChange={(e) => setSelectedId(e.target.value)}
                  className={`pl-12 pr-10 py-3 rounded-xl border appearance-none font-black uppercase text-[10px] tracking-widest cursor-pointer outline-none transition-all
                    ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white hover:border-emerald-500' : 'bg-white border-zinc-200 text-zinc-950 hover:border-emerald-500 shadow-sm'}`}
                >
                  {availableProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">Security Link Active</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* 2. SIDEBAR CONTROL NODES */}
        <div className="lg:w-80 space-y-6 shrink-0">
          <div className={`p-8 rounded-[3rem] border shadow-2xl transition-all duration-500 ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-8 italic text-left">Compliance Control</p>
            <div className="space-y-3">
              <button onClick={() => { setActiveTab("audits"); setShowAddPermit(false); }} className={`w-full flex items-center justify-between p-6 rounded-2xl border transition-all active:scale-95 ${activeTab === "audits" ? "bg-amber-500 border-amber-500 text-black shadow-xl" : "bg-zinc-950/20 border-zinc-800 text-zinc-500"}`}>
                <div className="flex items-center gap-4"><ClipboardCheck size={20} /><span className="text-[11px] font-black uppercase tracking-widest">Safety Audits</span></div>
                <ChevronRight size={14} className={activeTab === 'audits' ? 'rotate-90' : ''} />
              </button>
              <button onClick={() => { setActiveTab("permits"); setShowAddCheck(false); }} className={`w-full flex items-center justify-between p-6 rounded-2xl border transition-all active:scale-95 ${activeTab === "permits" ? "bg-amber-500 border-amber-500 text-black shadow-xl" : "bg-zinc-950/20 border-zinc-800 text-zinc-500"}`}>
                <div className="flex items-center gap-4"><FileText size={20} /><span className="text-[11px] font-black uppercase tracking-widest">Site Permits</span></div>
                <ChevronRight size={14} className={activeTab === 'permits' ? 'rotate-90' : ''} />
              </button>
            </div>
          </div>

          {/* RISK ALERT NODE (Now logical) */}
          <div className={`p-8 rounded-[3rem] border shadow-xl flex flex-col gap-5 ${permits.some(p => p.status === 'expired') ? 'bg-rose-500/10 border-rose-500/20' : 'bg-zinc-950/40 border-zinc-800 opacity-40'}`}>
            <div className="flex items-center gap-4">
              <AlertTriangle size={24} className={permits.some(p => p.status === 'expired') ? 'text-rose-500 animate-pulse' : 'text-zinc-600'} />
              <p className={`text-[10px] font-black uppercase tracking-widest ${permits.some(p => p.status === 'expired') ? 'text-rose-500' : 'text-zinc-500'}`}>Site Risk Status</p>
            </div>
            <p className={`text-[11px] font-bold leading-relaxed text-left ${permits.some(p => p.status === 'expired') ? 'text-rose-400' : 'text-zinc-600'}`}>
              {permits.filter(p => p.status === "expired").length} Expired Documents detected. Immediate archival renewal required to maintain site legality.
            </p>
          </div>
        </div>

        {/* 3. MAIN WORKSPACE */}
        <div className={`flex-1 rounded-[4rem] border backdrop-blur-3xl overflow-hidden flex flex-col transition-all duration-500 shadow-2xl ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
          
          {activeTab === "audits" ? (
            <div className="flex-1 flex flex-col">
              <header className="p-12 border-b border-zinc-800/40 flex justify-between items-center bg-white/1">
                <div className="text-left space-y-2">
                  <h4 className={`text-3xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Inspection Ledger</h4>
                  <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em]">Verified HSE & Quality Sign-offs</p>
                </div>
                <button onClick={() => setShowAddCheck(!showAddCheck)} className="px-10 py-6 bg-amber-500 text-black font-black uppercase text-xs rounded-2xl italic tracking-widest shadow-2xl hover:bg-amber-400 transition-all flex items-center gap-4 active:scale-95">
                  {showAddCheck ? <X size={20} /> : <Plus size={20} strokeWidth={3} />}
                  {showAddCheck ? 'Cancel' : 'Log Inspection'}
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-12 space-y-8 custom-scrollbar">
                {showAddCheck ? (
                  <form onSubmit={handleCommitCheck} className="space-y-10 animate-in slide-in-from-top-4 max-w-3xl mx-auto py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4 text-left">
                        <label className="text-[11px] font-black uppercase text-zinc-600 ml-4 tracking-widest italic">Inspection Focus</label>
                        <select value={newCheck.category} onChange={(e) => setNewCheck({ ...newCheck, category: e.target.value as any })}
                          className={`w-full p-8 rounded-4xl border appearance-none font-bold text-sm outline-none transition-all shadow-inner
                            ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-950'}`}>
                          <option value="Safety">Safety (HSE)</option><option value="Quality">Quality Control</option><option value="Structure">Structural Check</option>
                        </select>
                      </div>
                      <div className="space-y-4 text-left">
                        <label className="text-[11px] font-black uppercase text-zinc-600 ml-4 tracking-widest italic">Status Pass/Fail</label>
                        <div className={`p-2 rounded-4xl border flex gap-2 ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
                          <button type="button" onClick={() => setNewCheck({ ...newCheck, is_compliant: true })} className={`flex-1 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all ${newCheck.is_compliant ? "bg-emerald-500 text-black shadow-lg" : "text-zinc-600 hover:text-zinc-400"}`}>PASS</button>
                          <button type="button" onClick={() => setNewCheck({ ...newCheck, is_compliant: false })} className={`flex-1 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all ${!newCheck.is_compliant ? "bg-rose-500 text-black shadow-lg" : "text-zinc-600 hover:text-zinc-400"}`}>FAIL</button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4 text-left">
                      <label className="text-[11px] font-black uppercase text-zinc-600 ml-4 tracking-widest italic">Inspection Description</label>
                      <input required placeholder="e.g. Scaffolding Load Test - Wing A" value={newCheck.title} onChange={(e) => setNewCheck({ ...newCheck, title: e.target.value })}
                        className={`w-full p-8 rounded-4xl border font-bold text-lg outline-none transition-all shadow-inner
                          ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-950'}`} />
                    </div>
                    <div className="space-y-4 text-left">
                      <label className="text-[11px] font-black uppercase text-zinc-600 ml-4 tracking-widest italic">Observations & Defect Notes</label>
                      <textarea rows={5} placeholder="Detail remedial actions required..." value={newCheck.notes} onChange={(e) => setNewCheck({ ...newCheck, notes: e.target.value })}
                        className={`w-full p-10 rounded-[3rem] border outline-none font-medium text-sm leading-relaxed shadow-inner
                          ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-950'}`} />
                    </div>
                    <button type="submit" disabled={isSaving} className="w-full h-24 bg-amber-500 text-black font-black uppercase text-sm tracking-[0.6em] rounded-[2.5rem] shadow-2xl hover:bg-amber-400 transition-all flex items-center justify-center gap-6 italic active:scale-95">
                      {isSaving ? <Loader2 size={32} className="animate-spin" /> : <Save size={32} strokeWidth={2.5} />}
                      Secure Audit Node
                    </button>
                  </form>
                ) : checks.length > 0 ? (
                  <div className="space-y-6">
                    {checks.map((check) => (
                      <div key={check.id} className={`p-10 rounded-[3.5rem] border group transition-all flex flex-col md:flex-row items-center justify-between gap-10 shadow-xl
                        ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800 hover:border-amber-500/20' : 'bg-zinc-50 border-zinc-100 hover:border-amber-500'}`}>
                        <div className="flex items-center gap-10 text-left flex-1">
                          <div className={`p-8 rounded-[2.5rem] border shadow-2xl flex flex-col items-center justify-center gap-2 min-w-120px] transition-transform group-hover:scale-105
                            ${check.is_compliant ? "bg-emerald-500 border-emerald-600 text-black" : "bg-rose-500 border-rose-600 text-black"}`}>
                            {check.is_compliant ? <CheckCircle2 size={32} strokeWidth={3} /> : <XCircle size={32} strokeWidth={3} />}
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{check.is_compliant ? 'PASS' : 'FAIL'}</span>
                          </div>
                          <div className="space-y-4 overflow-hidden">
                            <div className="flex items-center gap-4">
                              <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl border ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-white border-zinc-200 text-zinc-600'}`}>
                                {check.category}
                              </span>
                              <span className="text-[10px] font-mono text-zinc-700 font-bold uppercase tracking-tighter leading-none italic">{new Date(check.timestamp).toDateString()}</span>
                            </div>
                            <h5 className={`text-3xl font-black uppercase italic tracking-tighter leading-tight ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-950'}`}>{check.title}</h5>
                            <p className={`text-sm leading-relaxed font-medium line-clamp-2 italic ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-600'}`}>"{check.notes || "No defect observation logged"}"</p>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteCheck(check.id)} className="p-6 text-zinc-800 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 active:scale-90"><Trash2 size={24} /></button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-32 text-center opacity-10 flex flex-col items-center gap-10 border-2 border-dashed border-zinc-800 rounded-[4rem]">
                    <ShieldCheck size={100} />
                    <p className="font-black uppercase text-lg tracking-[0.6em] italic leading-none">Audit Ledger Empty</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <header className="p-12 border-b border-zinc-800/40 flex justify-between items-center bg-white/1">
                <div className="text-left space-y-2">
                  <h4 className={`text-3xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Site Permits</h4>
                  <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em]">Official Project Licenses & Statutory Clearances</p>
                </div>
                <button onClick={() => setShowAddPermit(!showAddPermit)} className="px-10 py-6 bg-amber-500 text-black font-black uppercase text-xs rounded-2xl italic tracking-widest shadow-2xl hover:bg-amber-400 transition-all flex items-center gap-4 active:scale-95">
                  {showAddPermit ? <X size={20} /> : <Plus size={20} strokeWidth={3} />}
                  {showAddPermit ? 'Cancel' : 'Add New Permit'}
                </button>
              </header>

              <div className="p-12 overflow-y-auto custom-scrollbar">
                {showAddPermit ? (
                  <form onSubmit={handleCommitPermit} className="space-y-10 animate-in slide-in-from-top-4 max-w-3xl mx-auto py-10">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4 text-left ">
                           <label className="text-[11px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic">Document Identity</label>
                           <input required placeholder="e.g. NCA Site License" value={newPermit.title} onChange={e => setNewPermit({...newPermit, title: e.target.value})}
                             className={`w-full h-20 px-8 rounded-3xl border font-bold text-xl outline-none transition-all shadow-inner
                               ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-950'}`} />
                        </div>
                        <div className="space-y-4 text-left ">
                           <label className="text-[11px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic">Expiration Date</label>
                           <input required type="date" value={newPermit.expiry_date} onChange={e => setNewPermit({...newPermit, expiry_date: e.target.value})}
                             className={`w-full h-20 px-8 rounded-3xl border font-bold text-sm outline-none transition-all shadow-inner
                               ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-950'}`} />
                        </div>
                     </div>
                     <button type="submit" disabled={isSaving} className="w-full h-24 bg-amber-500 text-black font-black uppercase text-sm tracking-[0.6em] rounded-3xl shadow-2xl hover:bg-amber-400 transition-all flex items-center justify-center gap-6 italic active:scale-95">
                        {isSaving ? <Loader2 size={32} className="animate-spin" /> : <Save size={32} strokeWidth={2.5} />}
                        Secure License Node
                     </button>
                  </form>
                ) : permits.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-8">
                    {permits.map((permit) => (
                      <div key={permit.id} className={`p-10 rounded-[3.5rem] border group transition-all flex flex-col justify-between h-72 shadow-xl ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800 hover:border-amber-500/20' : 'bg-zinc-50 border-zinc-100 hover:border-amber-500'}`}>
                        <div className="flex justify-between items-start">
                          <div className={`p-5 rounded-3xl border shadow-lg ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-amber-500' : 'bg-white border-zinc-100 text-amber-600'}`}>
                            <Gavel size={28} />
                          </div>
                          <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-xl ${permit.status === "active" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500"}`}>
                            {permit.status}
                          </span>
                        </div>
                        <div className="text-left space-y-3">
                          <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest leading-none italic">Statutory Node</p>
                          <h6 className={`font-black uppercase italic text-2xl leading-tight ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-950'}`}>{permit.title}</h6>
                        </div>
                        <div className="flex justify-between items-center pt-6 border-t border-zinc-800/40">
                           <div className="flex items-center gap-3 opacity-40">
                              <Calendar size={14} />
                              <span className="text-[10px] font-black uppercase tracking-widest">Expires: {new Date(permit.expiry_date).toDateString()}</span>
                           </div>
                           <button onClick={() => handleDeletePermit(permit.id)} className="text-zinc-700 hover:text-rose-500 p-2 transition-colors active:scale-90"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="col-span-full py-32 text-center opacity-10 flex flex-col items-center gap-10 border-2 border-dashed border-zinc-800 rounded-[4rem]">
                    <FileText size={100} />
                    <p className="font-black uppercase text-lg tracking-[0.5em] italic leading-none">Statutory Ledger Empty</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. IMMUTABLE FOOTER */}
          <div className={`p-10 border-t border-zinc-800/40 flex items-center justify-between opacity-30 ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100 shadow-inner'}`}>
             <div className="flex items-center gap-4">
                <ShieldCheck size={20} className="text-emerald-500" />
                <p className={`text-[10px] font-black uppercase tracking-widest text-zinc-500 leading-none ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-950'}`}>Immutable Audit Handshake Active</p>
             </div>
             <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest leading-none">SAFETY_VAULT_v4.2 • ISO_19650</p>
          </div>
        </div>
      </div>

      <footer className="pt-24 pb-12 text-center opacity-20 select-none flex flex-col items-center gap-8">
         <div className="h-px w-80 bg-zinc-800" />
         <p className="text-[10px] font-black uppercase tracking-[2.5em] text-zinc-600 italic leading-none text-center">COMPLIANCE ENGINE • QS VAULT</p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 20px; }
      `}</style>
    </div>
  );
};

export default ComplianceVault;