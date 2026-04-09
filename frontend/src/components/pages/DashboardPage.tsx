/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, type To } from 'react-router-dom';
import { 
  Clock, 
  UserCheck, 
  Globe, 
  Loader2, 
  AlertCircle, 
  FileText,
  Calculator, 
  ClipboardList, 
  HardHat, 
  MessageSquare, 
  ShieldCheck, 
  BarChart3, 
  Calendar, 
  Zap, 
  Database,
  ArrowRight,
  ShieldAlert,
  FileWarning,
  Briefcase
} from 'lucide-react';

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
let ArtifactsVault: any = () => null;
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

    // Load standard layout and registry components
    StatGrid = (await import("../../features/projects/components/StatGrid")).default;
    VaultRegistry = (await import("../../features/projects/components/VaultRegistry")).default;
    RatesLibrary = (await import("../../features/projects/components/RatesLibrary")).default;
    IdentityNode = (await import("../../features/auth/components/IdentityNode")).default;
    ArtifactsVault = (await import("../../features/boq/components/ArtifactsVault")).default;
    SyncQueueMonitor = (await import("../../features/sync/components/SyncQueueMonitor")).default;
    SunlightModeToggle = (await import("../layout/SunlightModeToggle")).default;
    GeometricRegistry = (await import("../../features/takeoff/components/GeometricRegistry")).default;

    // Load professional field and reporting engines
    SiteDiaryEngine = (await import("../../features/field/components/SiteDiaryEngine")).default;
    ResourceGantt = (await import("../../features/scheduling/components/ResourceGantt")).default;
    CollaborationHub = (await import("../../features/communication/components/CollaborationHub")).default;
    ComplianceVault = (await import("../../features/safety/components/ComplianceVault")).default;
    VariationBridge = (await import("../../features/qs-bridge/components/VariationBridge")).default;
  } catch (e) {
    console.warn("Dashboard Engine: Initializing in standby mode.");
  }
};

resolveModules();

/** --- MAIN COMPONENT: CONSTRUCTION OS v2.5 --- **/

const DashboardPage: React.FC = () => {
  const { activeView, setActiveView, user, theme } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<any[]>([]);
  const [recentMeasurements, setRecentMeasurements] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  /** * DATA HANDSHAKE: LIVE VAULT RECOVERY */
  const refreshVaultHandshake = useCallback(async () => {
    if (!user || !db) {
      setTimeout(() => setIsLoading(false), 1200);
      return;
    }
    try {
      setIsLoading(true);
      
      const [liveProfile, userProjects, recentEntries] = await Promise.all([
        db.profiles.get(user.id),
        db.projects.where('user_id').equals(user.id).reverse().toArray(),
        db.measurements.limit(10).reverse().toArray()
      ]);
      
      setUserProfile(liveProfile);
      setProjects(userProjects);
      setRecentMeasurements(recentEntries);
      
      // Auto-lock onto the most recent project if none is selected
      if (userProjects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(userProjects[0].id);
      }
    } catch (err) {
      console.error("Dashboard: Handshake Failed", err);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedProjectId]);

  useEffect(() => {
    refreshVaultHandshake();
  }, [refreshVaultHandshake, activeView]);

  if (!user) return null;

  return (
    <div className={`space-y-12 animate-in fade-in duration-700 pb-24 text-left max-w-[1600px] mx-auto`}>
      
      {/* 1. TOP UTILITY HUD (Session Info) */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-4">
        <div className="text-left">
           <h1 className={`text-sm font-black uppercase tracking-[0.6em] italic ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>Authorized Session</h1>
        </div>
        <div className="flex items-center gap-5 w-full lg:w-auto justify-end">
          <div className={`hidden md:flex items-center gap-4 px-6 py-3 rounded-2xl border transition-all duration-500
            ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 shadow-inner' : 'bg-white border-zinc-200'}`}>
            <UserCheck size={16} className="text-emerald-500" />
            <span className={`text-[11px] font-black uppercase tracking-widest leading-none ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-950'}`}>
              Operator: {userProfile?.full_name || user.user_metadata?.full_name || 'Authorized User'}
            </span>
          </div>
          <SunlightModeToggle />
        </div>
      </header>

      {/* 2. DYNAMIC WORKSPACE HUB */}
      <div className="relative min-h-[700px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-40 opacity-20">
            <Loader2 className="w-16 h-16 animate-spin mb-6 text-amber-500" />
            <p className="font-black text-[11px] uppercase tracking-[0.6em] italic">Recovering Vault Nodes...</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            
            {/* --- VIEW: PROJECTS (The Master Inventory) --- */}
            {activeView === 'projects' && (
              <div className="space-y-16">
                <div className="w-full">
                  <SyncQueueMonitor />
                </div>

                <div className="grid lg:grid-cols-4 gap-12">
                  <div className="lg:col-span-3 space-y-16">
                    <StatGrid projectsCount={projects.length} measurementsCount={recentMeasurements.length} />
                    
                    <div className="space-y-8">
                      <div className="px-6 border-l-4 border-amber-500 flex items-center gap-5">
                         <Briefcase size={20} className="text-amber-500" />
                         <p className={`text-4xl font-black uppercase italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Project Portfolio</p>
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

                  <div className="space-y-8 hidden lg:block">
                    <div className={`p-10 rounded-[3.5rem] border transition-all duration-500 shadow-2xl
                      ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                      <div className="flex items-center gap-4 mb-10 text-left">
                        <Zap size={20} className="text-amber-500 animate-pulse" />
                        <h5 className="text-[12px] font-black uppercase tracking-[0.3em] text-zinc-500 leading-none">Recent Activity</h5>
                      </div>
                      <div className="space-y-8">
                        {recentMeasurements.length > 0 ? recentMeasurements.slice(0, 5).map((m: any) => (
                          <div key={m.id} className="border-l-2 border-zinc-800 pl-6 py-1 group hover:border-amber-500 transition-colors cursor-default text-left">
                            <p className="text-[12px] font-black text-zinc-400 uppercase truncate leading-none mb-2">{m.label}</p>
                            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest leading-none">
                              {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • Verified
                            </p>
                          </div>
                        )) : (
                          <p className="text-[10px] font-black uppercase text-zinc-700 italic text-left">Registry Empty</p>
                        )}
                      </div>
                    </div>

                    <div className={`p-10 rounded-[3.5rem] border bg-zinc-950/60 border-zinc-800 shadow-inner flex flex-col gap-4`}>
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest italic">System Protocol</p>
                        <ShieldCheck size={18} className="text-emerald-500" />
                      </div>
                      <p className="text-2xl font-black italic text-zinc-400 uppercase tracking-tighter leading-none text-left">ISO 19650 READY</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- VIEW: SITE DIARY (Field Ledger) --- */}
            {activeView === 'diary' && <SiteDiaryEngine projectId={selectedProjectId} />}

            {/* --- VIEW: PRODUCTION (Work Schedule) --- */}
            {activeView === 'resources' && <ResourceGantt projectId={selectedProjectId} />}

            {/* --- VIEW: TEAM CHAT (Collaboration) --- */}
            {activeView === 'collab' && <CollaborationHub projectId={selectedProjectId} />}

            {/* --- VIEW: OFFICE REPORTS & VALUATIONS (The Staked Hub) --- */}
            {activeView === 'settings' && (
               <div className="max-w-7xl mx-auto space-y-24 animate-in fade-in duration-700">
                  
                  {/* HUB 01: SITE CHANGE HUB (FULL SPACE) */}
                  <div className="space-y-10">
                    <div className="flex items-center gap-5 px-8 border-l-4 border-amber-500">
                      <div className="p-4 bg-amber-500 text-black rounded-2xl shadow-xl shadow-amber-500/10"><BarChart3 size={28} /></div>
                      <div className="text-left">
                         <h4 className={`text-4xl font-black uppercase italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Change Management Hub</h4>
                         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 mt-2">Verified Site Variations & Pricing Status</p>
                      </div>
                    </div>
                    <VariationBridge projectId={selectedProjectId} />
                  </div>

                  {/* HUB 02: COMPLIANCE NODE (FULL SPACE) */}
                  <div className="space-y-10">
                    <div className="flex items-center gap-5 px-8 border-l-4 border-emerald-500">
                       <div className="p-4 bg-emerald-500 text-black rounded-2xl shadow-xl shadow-emerald-500/10"><ShieldCheck size={28} /></div>
                       <div className="text-left">
                          <h4 className={`text-4xl font-black uppercase italic tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>Compliance Node</h4>
                          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 mt-2">Legal Site Protection & Statutory Ledger</p>
                       </div>
                    </div>
                    <ComplianceVault projectId={selectedProjectId} />
                  </div>

                  {/* HUB 03: TAKEOFF AUDIT (GLOBAL) */}
                  <div className="pt-20 border-t border-zinc-800/40 text-left">
                    <div className="flex items-center gap-6 px-10 mb-14 opacity-50">
                       <Database size={24} className="text-zinc-500" />
                       <h4 className="text-[14px] font-black uppercase tracking-[0.8em] text-zinc-400 italic">Master Takeoff Audit Ledger</h4>
                    </div>
                    <GeometricRegistry measurements={recentMeasurements} activeSection="All Sections" onDelete={() => {}} />
                  </div>
               </div>
            )}

            {activeView === 'rates' && <RatesLibrary />}
            {activeView === 'profile' && <IdentityNode onBack={() => setActiveView('projects')} />}

          </div>
        )}
      </div>

      {/* 3. SYSTEM COMPLIANCE FOOTER */}
      <footer className="pt-40 pb-12 text-center opacity-10 hidden sm:block select-none">
         <div className="flex items-center justify-center gap-12 mb-10">
            <div className="h-px w-60 bg-zinc-800" />
            <Zap size={32} className="text-zinc-600" />
            <div className="h-px w-60 bg-zinc-800" />
         </div>
         <p className="text-[11px] font-black uppercase tracking-[1.5em] italic text-zinc-500 text-center leading-none">
           QS VAULT OS v2.5.4 • SITE READY PROTOCOL • PRECISION • INTEGRITY
         </p>
      </footer>
    </div>
  );
};

export default DashboardPage;