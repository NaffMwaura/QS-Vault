/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useNavigate, type To } from 'react-router-dom';
import {  
  UserCheck,
  Loader2, 
  ShieldCheck, 
  BarChart3,  
  Zap,
  Database,
  Briefcase,
  Layers,
} from 'lucide-react';
import { useAuth } from "../../features/auth/AuthContext";
import { db } from "../../lib/database/database";
import SunlightModeToggle from "../layout/SunlightModeToggle";

/* ======================================================
    OFFICE INFRASTRUCTURE RESOLUTION (STABILIZED)
    Using dynamic loading shims to bypass build-time resolution errors
   ====================================================== */

// Note: db is imported directly from library

// Feature components shims
const StatGrid = lazy(() => import("../../features/projects/components/StatGrid"));
const VaultRegistry = lazy(() => import("../../features/projects/components/VaultRegistry"));
const VariationBridge = lazy(() => import("../../features/qs-bridge/components/VariationBridge"));
const ComplianceVault = lazy(() => import("../../features/safety/components/ComplianceVault"));
const TakeoffLedger = lazy(() => import("../../features/takeoff/components/TakeoffLedger"));
const SyncQueueMonitor = lazy(() => import("../../features/sync/components/SyncQueueMonitor"));
const SiteDiaryEngine = lazy(() => import("../../features/field/components/SiteDiaryEngine"));
const ResourceGantt = lazy(() => import("../../features/scheduling/components/ResourceGantt"));
const CollaborationHub = lazy(() => import("../../features/communication/components/CollaborationHub"));
const RatesLibrary = lazy(() => import("../../features/projects/components/RatesLibrary"));
const IdentityNode = lazy(() => import("../../features/auth/components/IdentityNode"));

/** --- LOADING FALLBACK --- **/
const ComponentLoader: React.FC = () => (
  <div className="flex flex-col items-center justify-center p-20 opacity-30 animate-pulse">
    <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-500" />
    <p className="font-black text-[9px] uppercase tracking-[0.3em] text-zinc-500">Syncing Node...</p>
  </div>
);

/** --- MASTER DASHBOARD: CONSTRUCTION OS v2.0 --- **/

const DashboardPage: React.FC = () => {
  const { activeView, setActiveView, user, theme } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<any[]>([]);
  const [recentMeasurements, setRecentMeasurements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  /** * DATA HARVEST: LIVE VAULT RECOVERY 
   * Recovers project list and last 10 entries for activity tracking.
   */
  const refreshOfficeRecords = useCallback(async () => {
    if (!user || !db) {
      setTimeout(() => setIsLoading(false), 1500);
      return;
    }
    try {
      setIsLoading(true);
      const [userProjects, recentEntries] = await Promise.all([
        db.projects.where('user_id').equals(user.id).reverse().toArray(),
        db.measurements.limit(10).reverse().toArray()
      ]);
      
      setProjects(userProjects);
      setRecentMeasurements(recentEntries);
      
      if (userProjects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(userProjects[0].id);
      }
    } catch (err) {
      console.error("Dashboard Sync Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedProjectId]);

  useEffect(() => {
    refreshOfficeRecords();
  }, [refreshOfficeRecords, activeView]);

  if (!user) return null;

  return (
    <div className="space-y-16 animate-in fade-in duration-700 pb-20 text-left max-w-1700px] mx-auto px-4 sm:px-10">
      
      {/* 1. TOP UTILITY HUD */}
      <header className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="inline-flex items-center gap-4 px-6 py-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl">
              <UserCheck size={16} className="text-emerald-500 shadow-emerald-500/20" />
              <span className={`text-[11px] font-black uppercase tracking-[0.2em] leading-none ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Surveyor: {user.user_metadata?.full_name || 'Authorized Node'}
              </span>
            </div>
            <Suspense fallback={<div className="w-10 h-10 bg-zinc-900 rounded-full" />}>
               <SunlightModeToggle />
            </Suspense>
          </div>

          <div className="w-full sm:w-auto min-w-360px]">
            <Suspense fallback={<div className="h-20 w-full bg-zinc-900/20 rounded-3xl animate-pulse" />}>
              <SyncQueueMonitor />
            </Suspense>
          </div>
        </div>
      </header>

      {/* 2. DYNAMIC WORKSPACE HUB */}
      <main className="relative min-h-800px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-40 opacity-20">
            <Loader2 className="w-16 h-16 animate-spin mb-6 text-amber-500" />
            <p className="font-black text-[11px] uppercase tracking-[0.5em]">Establishing Secure Link...</p>
          </div>
        ) : (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            
            {/* VIEW: PROJECTS (Master Inventory) */}
            {activeView === 'projects' && (
              <div className="grid lg:grid-cols-4 gap-16">
                <div className="lg:col-span-3 space-y-16">
                  <Suspense fallback={<ComponentLoader />}>
                    <StatGrid projectsCount={projects.length} measurementsCount={recentMeasurements.length} />
                  </Suspense>
                  
                  <div className="space-y-10">
                    <div className="px-6 border-l-4 border-amber-500 flex items-center gap-5 text-left">
                       <Briefcase size={24} className="text-amber-500" />
                       <h2 className={`text-5xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Project Vaults</h2>
                    </div>
                    <Suspense fallback={<ComponentLoader />}>
                      <VaultRegistry 
                        projects={projects} 
                        setProjects={setProjects} 
                        navigate={(path: To) => navigate(path)} 
                      />
                    </Suspense>
                  </div>
                </div>

                <aside className="space-y-8 hidden lg:block">
                  <div className={`p-10 rounded-[3.5rem] border-2 transition-all duration-500 shadow-2xl relative overflow-hidden
                    ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
                    <Zap size={200} className="absolute -top-10 -right-10 opacity-[0.02] -rotate-12" />
                    <div className="flex items-center gap-4 mb-10 relative z-10">
                      <Zap size={18} className="text-amber-500 animate-pulse" />
                      <h5 className="text-[11px] font-black uppercase tracking-widest text-zinc-500 italic">Site Activity Feed</h5>
                    </div>
                    <div className="space-y-8 relative z-10 text-left">
                      {recentMeasurements.length > 0 ? recentMeasurements.slice(0, 5).map((m: any) => (
                        <div key={m.id} className="border-l-2 border-zinc-800 pl-6 py-1 group hover:border-amber-500 transition-all cursor-default text-left">
                          <p className={`text-[12px] font-black uppercase truncate leading-none mb-3 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>{m.label}</p>
                          <div className="flex items-center gap-3">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                             <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest leading-none">
                                {new Date(m.timestamp).toLocaleTimeString()} • Secured
                             </p>
                          </div>
                        </div>
                      )) : (
                        <p className="text-[10px] font-black uppercase text-zinc-700 italic px-4 py-10 border-2 border-dashed border-zinc-800 rounded-3xl">No records detected</p>
                      )}
                    </div>
                  </div>

                  <div className={`p-8 rounded-[3rem] border-2 bg-zinc-950/60 border-zinc-800 shadow-inner flex flex-col gap-3`}>
                    <div className="flex justify-between items-center opacity-40">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Node Status</p>
                      <ShieldCheck size={14} className="text-emerald-500" />
                    </div>
                    <p className="text-2xl font-black italic text-zinc-200 uppercase tracking-tighter leading-none">ISO 19650 READY</p>
                  </div>
                </aside>
              </div>
            )}

            {/* VIEW: OFFICE REPORTS (VERTICAL ALIGNMENT FIX) */}
            {activeView === 'settings' && (
               <div className="max-w-6xl mx-auto space-y-24 animate-in fade-in duration-1000 pb-32">
                  
                  {/* Hub Header */}
                  <div className="text-left space-y-4 px-6 border-b border-zinc-800/40 pb-16">
                     <div className="flex items-center gap-4 text-amber-500">
                        <Layers size={32} strokeWidth={2.5} />
                        <h2 className={`text-6xl font-black uppercase italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Office Reports</h2>
                     </div>
                     <p className="text-[11px] font-black uppercase tracking-[0.6em] text-zinc-500 italic max-w-2xl">Verified valuation outputs and statutory compliance audits compiled from the project ledger.</p>
                  </div>

                  {/* Section 01: Variation Bridge (Stacked Vertically) */}
                  <div className="space-y-12 group">
                    <div className="flex items-center gap-6 px-10 border-l-10px] border-amber-500 transition-all group-hover:pl-14">
                      <div className="p-4 bg-amber-500 text-black rounded-2xl shadow-xl shadow-amber-500/10"><BarChart3 size={28} /></div>
                      <div className="text-left">
                         <h4 className={`text-4xl font-black uppercase italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>01. Variation Bridge</h4>
                         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mt-2 italic">Site Change Monitoring & Technical Instructions</p>
                      </div>
                    </div>
                    <Suspense fallback={<ComponentLoader />}>
                      <div className="animate-in slide-in-from-bottom-6 duration-700">
                         <VariationBridge projectId={selectedProjectId} />
                      </div>
                    </Suspense>
                  </div>

                  {/* Section 02: Compliance Vault (Stacked Vertically) */}
                  <div className="space-y-12 group">
                    <div className="flex items-center gap-6 px-10 border-l-10px] border-emerald-500 transition-all group-hover:pl-14">
                      <div className="p-4 bg-emerald-500 text-black rounded-2xl shadow-xl shadow-emerald-500/10"><ShieldCheck size={28} /></div>
                      <div className="text-left">
                        <h4 className={`text-4xl font-black uppercase italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>02. Compliance Vault</h4>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mt-2 italic">HSE Sign-offs & Statutory Permit Registry</p>
                      </div>
                    </div>
                    <Suspense fallback={<ComponentLoader />}>
                      <div className="animate-in slide-in-from-bottom-8 duration-700">
                         <ComplianceVault projectId={selectedProjectId} />
                      </div>
                    </Suspense>
                  </div>

                  {/* Section 03: Takeoff Audit Ledger */}
                  <div className="pt-24 border-t-2 border-zinc-800/60 text-left">
                    <div className="flex items-center justify-between px-10 mb-16 opacity-70 group hover:opacity-100 transition-opacity">
                       <div className="flex items-center gap-6 text-left">
                          <Database size={32} className="text-zinc-600" />
                          <div className="text-left">
                             <h4 className={`text-4xl font-black uppercase italic tracking-tighter leading-none ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-950'}`}>03. Audit Ledger</h4>
                             <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600 mt-2 italic">Full Technical Record of Live Site Node Quantities</p>
                          </div>
                       </div>
                       <div className={`px-6 py-3 rounded-full border-2 border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-500 ${theme === 'dark' ? 'bg-zinc-900' : 'bg-zinc-50'}`}>
                          Vault: {selectedProjectId?.slice(0, 12)}
                       </div>
                    </div>
                    <Suspense fallback={<ComponentLoader />}>
                      <div className="animate-in zoom-in-95 duration-1000 shadow-2xl rounded-[5rem] overflow-hidden border-2 border-zinc-800/40">
                        <TakeoffLedger
                          measurements={recentMeasurements}
                          onDelete={() => undefined}
                          activeSection="All Sections"
                          projectId={selectedProjectId || ''}
                        />
                      </div>
                    </Suspense>
                  </div>
               </div>
            )}

            {/* Other views structured with centered focus */}
            {activeView === 'diary' && (
               <div className="max-w-6xl mx-auto py-10 animate-in slide-in-from-bottom-4 duration-700 text-left">
                  <Suspense fallback={<ComponentLoader />}>
                    <SiteDiaryEngine projectId={selectedProjectId} />
                  </Suspense>
               </div>
            )}

            {activeView === 'collab' && (
               <div className="max-w-7xl mx-auto py-10 animate-in slide-in-from-bottom-4 duration-700 text-left">
                  <Suspense fallback={<ComponentLoader />}>
                    <CollaborationHub projectId={selectedProjectId} />
                  </Suspense>
               </div>
            )}

            {activeView === 'resources' && (
               <div className="max-w-7xl mx-auto py-10 animate-in slide-in-from-bottom-4 duration-700 text-left">
                  <Suspense fallback={<ComponentLoader />}>
                    <ResourceGantt projectId={selectedProjectId} />
                  </Suspense>
               </div>
            )}

            {activeView === 'rates' && (
               <div className="max-w-6xl mx-auto py-10 animate-in fade-in duration-700 text-left">
                  <Suspense fallback={<ComponentLoader />}>
                    <RatesLibrary />
                  </Suspense>
               </div>
            )}
            
            {activeView === 'profile' && (
               <div className="max-w-5xl mx-auto py-10 animate-in slide-in-from-bottom-10 duration-1000 text-left">
                  <Suspense fallback={<ComponentLoader />}>
                    <IdentityNode onBack={() => setActiveView('projects')} />
                  </Suspense>
               </div>
            )}

          </div>
        )}
      </main>

      {/* 3. SYSTEM COMPLIANCE FOOTER */}
      <footer className="pt-40 pb-20 text-center opacity-10 hidden sm:block select-none pointer-events-none">
          <div className="flex items-center justify-center gap-12 mb-10">
            <div className="h-px w-60 bg-zinc-800" />
            <Database size={32} className="text-zinc-600" />
            <div className="h-px w-60 bg-zinc-800" />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[1.5em] italic text-zinc-500 text-center leading-none">
            QS VAULT OS • VERSION 2.9.5 • SECURE HANDSHAKE
          </p>
      </footer>
    </div>
  );
};

export default DashboardPage;