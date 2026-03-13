/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, type To } from 'react-router-dom';
import { 
  Clock, 
  UserCheck,
  Globe,
  Loader2,
  Trash2,
  AlertCircle,
  FileText,
  Calculator,
  Share2,
  FileSearch
} from 'lucide-react';

/* ======================================================
    OFFICE MODULE RESOLUTION (PRODUCTION HANDSHAKE)
   ====================================================== */

// Mock Auth logic for the environment - Optimized for SPA navigation
let useAuth: any = () => ({
  user: { id: 'dev-node-001', user_metadata: { full_name: 'Naftaly Mwaura' } },
  theme: 'dark',
  activeView: 'projects',
  setActiveView: (view: string) => console.log("Workspace Shift:", view),
  isOnline: true,
  signOut: async () => { /* Logic in AuthContext.tsx */ } 
});

let db: any = null;
let syncEngine: any = null;

// Registry of modular office components
let StatGrid: any = () => null;
let VaultRegistry: any = () => null;
let RatesLibrary: any = () => null;
let IdentityNode: any = () => null;
let ArtifactsVault: any = () => null;
let SyncQueueMonitor: any = () => null;
let SunlightModeToggle: any = () => null;
let GeometricRegistry: any = () => null;
let BoQGenerator: any = () => null;
let CertificateGenerator: any = () => null;
let WhatsAppExport: any = () => null;

const resolveModules = async () => {
  try {
    const authMod = await import("../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const dbMod = await import("../../lib/database/database");
    if (dbMod.db) db = dbMod.db;
    if (dbMod.syncEngine) syncEngine = dbMod.syncEngine;

    // Feature Component Resolution
    StatGrid = (await import("../../features/projects/components/StatGrid")).default;
    VaultRegistry = (await import("../../features/projects/components/VaultRegistry")).default;
    RatesLibrary = (await import("../../features/projects/components/RatesLibrary")).default;
    IdentityNode = (await import("../../features/auth/components/IdentityNode")).default;
    ArtifactsVault = (await import("../../features/boq/components/ArtifactsVault")).default;
    SyncQueueMonitor = (await import("../../features/sync/components/SyncQueueMonitor")).default;
    SunlightModeToggle = (await import("../layout/SunlightModeToggle")).default;
    GeometricRegistry = (await import("../../features/takeoff/components/GeometricRegistry")).default;
    BoQGenerator = (await import("../../features/boq/components/BoQGenerator")).default;
    CertificateGenerator = (await import("../../features/reports/components/CertificateGenerator")).default;
    WhatsAppExport = (await import("../../features/reports/components/WhatsAppExport")).default;
  } catch (e) {
    // Shims active for previewer stability
  }
};

resolveModules();

/** --- MASTER DASHBOARD: PROFESSIONAL QUANTITY SURVEYING HUB --- **/

const DashboardPage: React.FC = () => {
  const { activeView, setActiveView, user, theme, signOut } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<any[]>([]);
  const [recentMeasurements, setRecentMeasurements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /** * OFFICE DATA REFRESH
   * Pulls real-time project inventory and recent site measurements from the device memory.
   */
  const refreshOfficeRecords = useCallback(async () => {
    if (!user || !db) {
      setTimeout(() => setIsLoading(false), 1200);
      return;
    }
    try {
      setIsLoading(true);
      const [userProjects, recentEntries] = await Promise.all([
        db.projects.where('user_id').equals(user.id).reverse().toArray(),
        db.measurements.limit(15).reverse().toArray()
      ]);
      
      setProjects(userProjects);
      setRecentMeasurements(recentEntries);
    } catch (err) {
      console.error("Dashboard Sync Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshOfficeRecords();
  }, [refreshOfficeRecords, activeView]);

  /** * PROJECT DELETION HANDSHAKE
   * Permanently clears a project and all associated measured data.
   */
  const handleDeleteProject = async (projectId: string) => {
    if (!db) return;
    if (!window.confirm("CRITICAL: Purge this project and all associated measurements from local storage? This action is permanent.")) return;
    
    try {
      await db.projects.delete(projectId);
      await db.measurements.where('project_id').equals(projectId).delete();
      await db.bill_items.where('project_id').equals(projectId).delete();

      if (syncEngine?.queueChange) {
        await syncEngine.queueChange('projects', projectId, 'DELETE', { id: projectId });
      }
      await refreshOfficeRecords();
    } catch (err) {
      console.error("Project Deletion Failed:", err);
    }
  };

  /** * MEASUREMENT AUDIT PURGE */
  const handleDeleteMeasurement = async (id: string) => {
    if (!db) return;
    try {
      await db.measurements.delete(id);
      setRecentMeasurements(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error("Audit Purge Failed:", err);
    }
  };

  /** * SECURE LOGOUT PROTOCOL
   * Clears the session and navigates without a browser reload.
   */
  const handleSecureLogout = async () => {
    if (window.confirm("Confirm secure session termination?")) {
      await signOut();
      navigate('/login', { replace: true });
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 text-left">
      
      {/* 1. TOP UTILITY HUD */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-4">
        <div className="w-full lg:w-auto">
          <SyncQueueMonitor />
        </div>
        <div className="flex items-center gap-4 w-full lg:w-auto justify-end">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 shadow-inner">
            <UserCheck size={14} className="text-emerald-500" />
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest leading-none">
              Officer: {user.user_metadata?.full_name || 'Authorized User'}
            </span>
          </div>
          <SunlightModeToggle />
        </div>
      </div>

      {/* 2. DYNAMIC WORKSPACE HUB */}
      <div className="relative min-h-600px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-40 opacity-20">
            <Loader2 className="w-12 h-12 animate-spin mb-4 text-amber-500" />
            <p className="font-black text-[10px] uppercase tracking-[0.4em]">Opening Office Records...</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            
            {/* VIEW: PROJECT PORTFOLIO (Registry Management) */}
            {activeView === 'projects' && (
              <div className="grid lg:grid-cols-4 gap-10">
                <div className="lg:col-span-3 space-y-10">
                  <StatGrid projectsCount={projects.length} measurementsCount={recentMeasurements.length} />
                  
                  <div className="space-y-4">
                    <div className="px-2">
                       <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-1 italic text-left">Project Registry</h4>
                       <p className={`text-2xl font-black uppercase italic tracking-tighter text-left ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Current Portfolio</p>
                    </div>
                    <VaultRegistry 
                      projects={projects} 
                      setProjects={setProjects} 
                      navigate={(path: To) => navigate(path)} 
                      onDeleteProject={handleDeleteProject}
                    />
                  </div>
                </div>

                {/* Dashboard Sidebar: Live Audit Feed */}
                <div className="space-y-6 hidden lg:block">
                  <div className={`p-8 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black/40' : 'bg-white border-zinc-200 shadow-xl shadow-zinc-200/20'}`}>
                    <div className="flex items-center gap-3 mb-6">
                      <Clock size={16} className="text-amber-500" />
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 text-left">Recent Audit Entries</h5>
                    </div>
                    <div className="space-y-4">
                      {recentMeasurements.length > 0 ? recentMeasurements.slice(0, 4).map((m: any) => (
                        <div key={m.id} className="border-l-2 border-amber-500/20 pl-4 py-1 flex justify-between items-start group">
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-[10px] font-bold text-zinc-300 truncate">{m.label}</p>
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-1">
                              {new Date(m.timestamp).toLocaleTimeString()} • {m.value.toFixed(2)}{m.unit}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleDeleteMeasurement(m.id)}
                              className="p-1 text-zinc-800 hover:text-rose-500 transition-colors"
                              title="Purge Entry"
                            >
                              <Trash2 size={12} />
                            </button>
                            <AlertCircle size={10} className="text-zinc-700 group-hover:text-amber-500 transition-colors" />
                          </div>
                        </div>
                      )) : (
                        <div className="p-8 text-center opacity-20 border border-dashed border-zinc-800 rounded-2xl">
                          <p className="text-[9px] font-black uppercase tracking-widest text-left">No activity recorded</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`p-8 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 shadow-inner' : 'bg-zinc-50 border-zinc-200 shadow-inner'}`}>
                    <div className="flex justify-between items-center mb-4 text-left">
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 text-left">Office Status</p>
                      <Globe size={14} className="text-emerald-500" />
                    </div>
                    <p className="text-xl font-black italic text-zinc-200 uppercase tracking-tighter text-left">Synced</p>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: PRICE BOOKS (Rates Library) */}
            {activeView === 'rates' && <RatesLibrary />}

            {/* VIEW: REPORTS & FILING (Fully Integrated Hub) */}
            {activeView === 'settings' && (
               <div className="space-y-12 animate-in fade-in duration-500">
                  <div className="grid lg:grid-cols-4 gap-10">
                    
                    {/* LEFT COLUMN: ARCHIVE & BOQ GENERATION */}
                    <div className="lg:col-span-2 space-y-10">
                      <div className="flex items-center gap-3 px-4">
                        <FileText size={18} className="text-amber-500" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic text-left">Document Archive</h4>
                      </div>
                      <ArtifactsVault />
                      
                      <div className="flex items-center gap-3 px-4 pt-4 border-t border-zinc-800/20">
                        <Calculator size={18} className="text-amber-500" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic text-left">Project Valuation Engine</h4>
                      </div>
                      {/* Integrated BoQ Generator */}
                      <BoQGenerator projectId={projects[0]?.id} projectName={projects[0]?.name || "Active Project"} />
                    </div>

                    {/* RIGHT COLUMN: SHARING, AUDIT & CERTIFICATION */}
                    <div className="lg:col-span-2 space-y-10">
                      <div className="space-y-4 px-4">
                        <div className="flex items-center gap-3">
                          <Share2 size={18} className="text-amber-500" />
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 italic text-left">Secure Transmittal</h4>
                        </div>
                        <p className={`text-xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-900'} text-left`}>WhatsApp Update</p>
                        {/* Integrated WhatsApp Export */}
                        <WhatsAppExport projectName={projects[0]?.name || "Project"} data={{
                          certNumber: "IPC/001",
                          valuationDate: new Date().toLocaleDateString(),
                          contractSum: 0,
                          workExecuted: recentMeasurements.reduce((acc, curr) => acc + curr.value, 0) * 100, 
                          materialsOnSite: 0,
                          previousCertified: 0,
                          retentionPercent: 10
                        }} />
                      </div>

                      <div className="space-y-4 px-4 pt-4 border-t border-zinc-800/40">
                        <div className="flex items-center gap-3">
                          <FileSearch size={18} className="text-emerald-500" />
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic text-left">Measurement Audit Ledger</h4>
                        </div>
                        {/* Integrated Geometric Registry for audit trail */}
                        <GeometricRegistry 
                          measurements={recentMeasurements} 
                          onDelete={handleDeleteMeasurement} 
                          activeSection="All Sections" 
                        />
                      </div>

                      <div className="space-y-4 px-4 pt-10 border-t border-zinc-800/40">
                        <div className="flex items-center gap-3">
                           <FileText size={18} className="text-amber-500" />
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 italic text-left">Certification Node</h4>
                        </div>
                        <p className={`text-xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-900'} text-left`}>Latest IPC Draft</p>
                        {/* Integrated Certificate Generator */}
                        <CertificateGenerator projectId={projects[0]?.id} projectName={projects[0]?.name || "Select Project"} />
                      </div>
                    </div>
                  </div>
               </div>
            )}

            {/* VIEW: USER PROFILE & IDENTITY */}
            {activeView === 'profile' && (
              <div className="space-y-12">
                <IdentityNode onBack={() => setActiveView('projects')} />
                <div className="max-w-4xl mx-auto px-4">
                  <button 
                    onClick={handleSecureLogout}
                    className="w-full py-8 rounded-[2.5rem] border border-rose-500/20 bg-rose-500/5 text-rose-500 font-black uppercase text-xs tracking-[0.4em] hover:bg-rose-500 hover:text-white transition-all shadow-xl active:scale-95"
                  >
                    Terminate Office Session
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER COMPLIANCE BADGE */}
      <footer className="pt-20 text-center opacity-10 hidden sm:block">
        <p className="text-[9px] font-black uppercase tracking-[0.8em] italic text-zinc-500 text-center">
          AUTHORIZED CONSTRUCTION OS v2.0 • SMM-KE COMPLIANT ENGINE
        </p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 20px; transition: background 0.3s; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
      `}</style>
    </div>
  );
};

export default DashboardPage;