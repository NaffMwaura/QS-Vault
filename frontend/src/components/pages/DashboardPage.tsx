/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, type To } from 'react-router-dom';
import {  
  UserCheck,
  Loader2,  
  ClipboardList, 
  MessageSquare, 
  ShieldCheck, 
  BarChart3, 
  Calendar, 
  Zap,
  Database,
} from 'lucide-react';
<<<<<<< HEAD

/* ======================================================
    ENGINE RESOLUTION (STABILIZED IMPORTS)
   ====================================================== */

let useAuth: any = () => ({
  user: { id: 'dev-node-001', user_metadata: { full_name: 'Naftaly Mwaura' } },
  theme: 'dark',
  activeView: 'projects',
  setActiveView: (view: string) => console.log("Workspace Shift:", view),
  isOnline: true
});

let db: any = null;

// Operational Nodes
let StatGrid: any = () => null;
let VaultRegistry: any = () => null;
let RatesLibrary: any = () => null;
let IdentityNode: any = () => null;
let SyncQueueMonitor: any = () => null;
let SunlightModeToggle: any = () => null;
let GeometricRegistry: any = () => null;
let SiteDiaryEngine: any = () => null;
let ResourceGantt: any = () => null;
let CollaborationHub: any = () => null;
let ComplianceVault: any = () => null;
let VariationBridge: any = () => null;



const resolveModules = async () => {
  try {
    const authMod = await import("../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;
    const dbMod = await import("../../lib/database/database");
    if (dbMod.db) db = dbMod.db;

    // Load Standard Components
    StatGrid = (await import("../../features/projects/components/StatGrid")).default;
    VaultRegistry = (await import("../../features/projects/components/VaultRegistry")).default;
    RatesLibrary = (await import("../../features/projects/components/RatesLibrary")).default;
    IdentityNode = (await import("../../features/auth/components/IdentityNode")).default;
    SyncQueueMonitor = (await import("../../features/sync/components/SyncQueueMonitor")).default;
    SunlightModeToggle = (await import("../layout/SunlightModeToggle")).default;
    GeometricRegistry = (await import("../../features/takeoff/components/GeometricRegistry")).default;

    // Load Field & Communication Engines
    SiteDiaryEngine = (await import("../../features/field/components/SiteDiaryEngine")).default;
    ResourceGantt = (await import("../../features/scheduling/components/ResourceGantt")).default;
    CollaborationHub = (await import("../../features/communication/components/CollaborationHub")).default;
    ComplianceVault = (await import("../../features/safety/components/ComplianceVault")).default;
    VariationBridge = (await import("../../features/qs-bridge/components/VariationBridge")).default;
  } catch (e) {
    console.warn("Dashboard: Operating in fallback mode.");
  }
};

resolveModules();
=======
import { useAuth } from "../../features/auth/AuthContext";
import IdentityNode from "../../features/auth/components/IdentityNode";
import CollaborationHub from "../../features/communication/components/CollaborationHub";
import SiteDiaryEngine from "../../features/field/components/SiteDiaryEngine";
import RatesLibrary from "../../features/projects/components/RatesLibrary";
import StatGrid from "../../features/projects/components/StatGrid";
import VaultRegistry from "../../features/projects/components/VaultRegistry";
import VariationBridge from "../../features/qs-bridge/components/VariationBridge";
import ComplianceVault from "../../features/safety/components/ComplianceVault";
import ResourceGantt from "../../features/scheduling/components/ResourceGantt";
import SyncQueueMonitor from "../../features/sync/components/SyncQueueMonitor";
import GeometricRegistry from "../../features/takeoff/components/GeometricRegistry";
import { db } from "../../lib/database/database";
import SunlightModeToggle from "../layout/SunlightModeToggle";
>>>>>>> 5672f133f38e4dbe54cbf2ed49ea9dee7913a4a8

/** --- MASTER DASHBOARD: CONSTRUCTION OS v2.0 --- **/

const DashboardPage: React.FC = () => {
  const { activeView, setActiveView, user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<any[]>([]);
  const [recentMeasurements, setRecentMeasurements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  /** * DATA HANDSHAKE: LIVE VAULT RECOVERY
   * Pulls your project registry and last 10 site measurements for the activity feed.
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
        db.measurements.limit(10).reverse().toArray()
      ]);
      
      setProjects(userProjects);
      setRecentMeasurements(recentEntries);
      
      // Auto-context: select first project if none selected
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
    <div className={`space-y-16 animate-in fade-in duration-700 pb-20 text-left max-w-1600px] mx-auto`}>
      
      {/* 1. TOP UTILITY HUD */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-inner">
            <UserCheck size={14} className="text-emerald-500" />
            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest leading-none">
              Officer: {user.user_metadata?.full_name || 'Naftaly Mwaura'}
            </span>
          </div>
          <SunlightModeToggle />
        </div>

        <div className="w-full">
          <SyncQueueMonitor />
        </div>
      </header>

      {/* 2. DYNAMIC WORKSPACE HUB */}
      <div className="relative min-h-700px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-40 opacity-20">
            <Loader2 className="w-16 h-16 animate-spin mb-6 text-amber-500" />
            <p className="font-black text-[11px] uppercase tracking-[0.5em]">Opening Vault Archives...</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            
            {/* VIEW: PROJECTS (The Master Inventory) */}
            {activeView === 'projects' && (
              <div className="grid lg:grid-cols-4 gap-12">
                <div className="lg:col-span-3 space-y-16">
                  <StatGrid projectsCount={projects.length} measurementsCount={recentMeasurements.length} />
                  
                  <div className="space-y-8">
                    <div className="px-4 border-l-4 border-amber-500">
                       <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-2 italic">Active Infrastructure Registry</h4>
                       <p className="theme-title text-4xl font-black uppercase italic tracking-tighter">Current Portfolio</p>
                    </div>
                    <VaultRegistry 
                      projects={projects} 
                      setProjects={setProjects} 
                      navigate={(path: To) => navigate(path)} 
                      onDeleteProject={async (id: any) => {
                        if (db) await db.projects.delete(id);
                        setProjects(prev => prev.filter(p => p.id !== id));
                      }}
                    />
                  </div>
                </div>

                {/* Dashboard Sidebar: Live Takeoff Feed */}
                <div className="space-y-8 hidden lg:block">
                  <div className="theme-surface-card p-8 rounded-[3rem] border transition-all duration-500">
                    <div className="flex items-center gap-3 mb-8">
                      <Zap size={18} className="text-amber-500 animate-pulse" />
                      <h5 className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Recent Takeoffs</h5>
                    </div>
                    <div className="space-y-6">
                      {recentMeasurements.length > 0 ? recentMeasurements.slice(0, 5).map((m: any) => (
                        <div key={m.id} className="border-l-2 border-zinc-800 pl-5 py-1 group hover:border-amber-500 transition-colors cursor-default">
                          <p className="text-[11px] font-black text-zinc-300 uppercase truncate leading-none">{m.label}</p>
                          <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-2 leading-none">
                            {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • Secured
                          </p>
                        </div>
                      )) : (
                        <p className="text-[10px] font-black uppercase text-zinc-700 italic">No records detected</p>
                      )}
                    </div>
                  </div>

                  <div className={`p-8 rounded-[3rem] border bg-zinc-950/60 border-zinc-800 shadow-inner`}>
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">System Integrity</p>
                      <ShieldCheck size={14} className="text-emerald-500" />
                    </div>
                    <p className="text-2xl font-black italic text-zinc-300 uppercase tracking-tighter leading-none">ISO 19650 READY</p>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: DAILY RECORD (Site Diary) */}
            {activeView === 'diary' && (
               <div className="max-w-6xl mx-auto space-y-12 animate-in slide-in-from-bottom-6 duration-700">
                  <div className="flex items-center gap-6 px-4">
                     <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-xl">
                        <ClipboardList size={32} />
                     </div>
                     <div className="text-left">
                        <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white leading-none">Daily Site Ledger</h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mt-3">Recording Progress & Evidence Nodes</p>
                     </div>
                  </div>
                  <SiteDiaryEngine projectId={selectedProjectId} />
               </div>
            )}

            {/* VIEW: WORK SCHEDULE (Gantt) */}
            {activeView === 'resources' && (
               <div className="max-w-7xl mx-auto space-y-12 animate-in slide-in-from-bottom-6 duration-700">
                  <div className="flex items-center gap-6 px-4">
                     <div className="p-5 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-500 shadow-xl">
                        <Calendar size={32} />
                     </div>
                     <div className="text-left">
                        <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white leading-none">Production Timeline</h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mt-3">Live Task Velocity & Resource Flow</p>
                     </div>
                  </div>
                  <ResourceGantt projectId={selectedProjectId} />
               </div>
            )}

            {/* VIEW: TEAM CHAT (Collab Hub) */}
            {activeView === 'collab' && (
               <div className="max-w-6xl mx-auto space-y-12 animate-in slide-in-from-bottom-6 duration-700">
                  <div className="flex items-center gap-6 px-4">
                     <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shadow-xl">
                        <MessageSquare size={32} />
                     </div>
                     <div className="text-left">
                        <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white leading-none">Collaboration Hub</h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mt-3">Formal Technical Queries & Directives</p>
                     </div>
                  </div>
                  <CollaborationHub projectId={selectedProjectId} />
               </div>
            )}

            {/* VIEW: OFFICE REPORTS & VALUATIONS */}
            {activeView === 'settings' && (
               <div className="max-w-7xl mx-auto space-y-20 animate-in fade-in duration-500">
                  <div className="grid lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div className="flex items-center gap-4 px-6 border-l-4 border-amber-500">
                        <BarChart3 size={20} className="text-amber-500" />
                        <h4 className="text-xl font-black uppercase italic tracking-tighter text-white leading-none">Site Change Bridge</h4>
                      </div>
                      <VariationBridge projectId={selectedProjectId} />
                    </div>

                    <div className="space-y-8">
                      <div className="flex items-center gap-4 px-6 border-l-4 border-emerald-500">
                        <ShieldCheck size={20} className="text-emerald-500" />
                        <h4 className="text-xl font-black uppercase italic tracking-tighter text-white leading-none">HSE Compliance Node</h4>
                      </div>
                      <ComplianceVault projectId={selectedProjectId} />
                    </div>
                  </div>

                  <div className="pt-16 border-t border-zinc-800/40">
                    <div className="flex items-center gap-4 px-6 mb-10 opacity-60">
                       <Database size={18} className="text-zinc-500" />
                       <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 italic">Takeoff Audit Ledger</h4>
                    </div>
                  <GeometricRegistry
                    measurements={recentMeasurements}
                    onDelete={() => undefined}
                    activeSection="All Sections"
                  />
                  </div>
               </div>
            )}

            {activeView === 'rates' && <RatesLibrary />}
            {activeView === 'profile' && <IdentityNode onBack={() => setActiveView('projects')} />}

          </div>
        )}
      </div>

      {/* 3. SYSTEM COMPLIANCE FOOTER */}
      <footer className="pt-32 pb-12 text-center opacity-10 hidden sm:block">
         <div className="flex items-center justify-center gap-10 mb-8">
            <div className="h-px w-40 bg-zinc-800" />
            <Zap size={24} className="text-zinc-600" />
            <div className="h-px w-40 bg-zinc-800" />
         </div>
         <p className="text-[10px] font-black uppercase tracking-[1em] italic text-zinc-500 text-center leading-none">
           QS VAULT OS v2.5.4 • SITE READY PROTOCOL
         </p>
      </footer>
    </div>
  );
};

export default DashboardPage;
