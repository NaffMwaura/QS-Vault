/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Database, 
  
  Search, 
  ExternalLink, 
  ShieldAlert,
  Loader2, 
  ShieldCheck,
  Trash2,
  RefreshCw,
  TrendingUp,
  FileText,
  Calculator,
  Share2
} from 'lucide-react';
import { useNavigate } from "react-router-dom";

/* ======================================================
    OFFICE MODULE RESOLUTION (STABILIZED)
   ====================================================== */

let useAuth: any = () => ({
  user: { id: 'admin-node-001' },
  theme: 'dark',
  role: 'admin',
  isOnline: true,
  activeView: 'projects',
  setActiveView: (v: string) => console.log(v),
  signOut: async () => { /* Logic in AuthContext */ }
});

let adminService: any = null;

// Modular Imports for Admin Workspace
let RatesLibrary: any = () => null;
let ArtifactsVault: any = () => null;
let IdentityNode: any = () => null;
let SyncQueueMonitor: any = () => null;
let SunlightModeToggle: any = () => null;
let BoQGenerator: any = () => null;
let CertificateGenerator: any = () => null;
let WhatsAppExport: any = () => null;

const resolveModules = async () => {
  try {
    const authMod = await import("../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const dbMod = await import("../../lib/database/database");
    if (dbMod.adminService) adminService = dbMod.adminService;

    // Resolve Modular Components
    RatesLibrary = (await import("../../features/projects/components/RatesLibrary")).default;
    ArtifactsVault = (await import("../../features/boq/components/ArtifactsVault")).default;
    IdentityNode = (await import("../../features/auth/components/IdentityNode")).default;
    SyncQueueMonitor = (await import("../../features/sync/components/SyncQueueMonitor")).default;
    SunlightModeToggle = (await import("../layout/SunlightModeToggle")).default;
    BoQGenerator = (await import("../../features/boq/components/BoQGenerator")).default;
    CertificateGenerator = (await import("../../features/reports/components/CertificateGenerator")).default;
    WhatsAppExport = (await import("../../features/reports/components/WhatsAppExport")).default;
  } catch (err) {
    // Shims active in preview
  }
};

resolveModules();

/** --- UI HELPER: STAT CARD --- **/

const StatCard = ({ label, value, icon: Icon, color, theme }: any) => (
  <div className={`p-8 rounded-[2.5rem] border backdrop-blur-2xl transition-all duration-500 hover:scale-[1.02] group
    ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800/60 shadow-black' : 'bg-white border-zinc-200 shadow-sm shadow-zinc-200/50'}`}>
    <div className="flex justify-between items-start mb-6 text-left">
      <div className={`p-4 rounded-2xl ${color} bg-opacity-10 border border-current border-opacity-20 group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
    </div>
    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2 leading-none text-left">{label}</p>
    <h3 className="text-4xl font-black tracking-tighter italic leading-none text-left">{value}</h3>
  </div>
);

/** --- MAIN ADMIN CONTENT HUB --- **/

const AdminDashboardPage: React.FC = () => {
  const { theme, isOnline, role, isLoading: authLoading, activeView, setActiveView, signOut } = useAuth();
  const navigate = useNavigate();

  // Admin Sub-Views (Registry vs Inventory)
  const [adminTab, setAdminTab] = useState<'users' | 'inventory'>('users');

  // Data States
  const [profiles, setProfiles] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalProjects: 0, totalMeasurements: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  /** * ADMIN DATA REFRESH
   * Syncs global platform state from master office records.
   */
  const loadAdminData = useCallback(async () => {
    // Check for service existence without triggering infinite loop
    if (!adminService) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [statsData, profilesData, globalProjects] = await Promise.all([
        adminService.getGlobalStats(),
        adminService.getAllProfiles(),
        adminService.getAllProjects()
      ]);
      
      setStats(statsData);
      setProfiles(profilesData || []);
      setAllProjects(globalProjects || []);
    } catch (err) {
      console.error("Admin Handshake Failure:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // FIX: Stabilized dependency array to prevent "size changed" error.
  // Using !!adminService converts the object into a stable boolean.
  useEffect(() => {
    const isAuthorized = role === 'admin' || role === 'super-admin';
    if (!authLoading && isAuthorized) {
      if (adminService) {
        loadAdminData();
      } else {
        // Handle late module resolution gracefully
        const timer = setTimeout(() => setLoading(false), 2000);
        return () => clearTimeout(timer);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, authLoading, !!adminService, loadAdminData]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!isOnline || !adminService) return;
    setUpdatingId(userId);
    try {
      await adminService.updateRole(userId, newRole);
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm("CRITICAL: Permanently revoke this project from the cloud database? This cannot be undone.")) return;
    try {
      await adminService.deleteProject(projectId);
      setAllProjects(prev => prev.filter(p => p.id !== projectId));
      setStats(prev => ({ ...prev, totalProjects: prev.totalProjects - 1 }));
    } catch (err) {
      console.error("Revocation failed:", err);
    }
  };

  /** * SECURE LOGOUT HANDSHAKE */
  const handleLogout = async () => {
    if (window.confirm("Confirm secure session termination?")) {
      await signOut();
      navigate('/login', { replace: true });
    }
  };

  const inspectUserWorkspaces = (username: string) => {
    setAdminTab('inventory');
    setSearchQuery(username);
  };

  // Only show the full-page loader if we truly have no data yet and are trying to load projects
  const isInitialLoad = loading && profiles.length === 0 && activeView === 'projects';

  if (isInitialLoad) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 italic">Establishing Admin Link...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* 1. TOP UTILITY HUD */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-4 text-left">
        <div className="w-full lg:w-auto">
          <SyncQueueMonitor />
        </div>
        <div className="flex items-center gap-4 w-full lg:w-auto justify-end">
          <SunlightModeToggle />
        </div>
      </div>

      {/* 2. DYNAMIC WORKSPACE SWITCHER */}
      <div className="relative min-h-[60vh] text-left">
        
        {/* VIEW: MAIN ADMIN DASHBOARD */}
        {activeView === 'projects' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            {/* PLATFORM STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label="Authorized Surveyors" value={stats.totalUsers} icon={Users} color="text-blue-500" theme={theme} />
              <StatCard label="Global Projects" value={stats.totalProjects} icon={Database} color="text-amber-500" theme={theme} />
              <StatCard label="Total Takeoffs" value={stats.totalMeasurements} icon={TrendingUp} color="text-emerald-500" theme={theme} />
              <StatCard label="Cloud Status" value={isOnline ? 'Active' : 'Offline'} icon={ShieldCheck} color="text-rose-500" theme={theme} />
            </div>

            {/* ADMIN TABS */}
            <div className="flex gap-4 border-b border-zinc-800/40 pb-6">
              <button 
                onClick={() => { setAdminTab('users'); setSearchQuery(''); }}
                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                  ${adminTab === 'users' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-500 hover:text-white'}`}
              >
                User Registry
              </button>
              <button 
                onClick={() => { setAdminTab('inventory'); setSearchQuery(''); }}
                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                  ${adminTab === 'inventory' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-500 hover:text-white'}`}
              >
                Global Inventory
              </button>
              <button onClick={loadAdminData} className="ml-auto p-3 text-zinc-500 hover:text-amber-500 transition-colors">
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* MASTER REGISTRY / INVENTORY TABLE */}
            <div className={`rounded-[3.5rem] border backdrop-blur-3xl overflow-hidden transition-all duration-500
              ${theme === 'dark' ? 'bg-zinc-900/30 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-xl'}`}>
              
              <div className="p-8 sm:p-12 border-b border-zinc-800/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/2">
                <div className="text-left">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">
                    {adminTab === 'users' ? 'Surveyor Registry' : 'Project Inventory'}
                  </h3>
                  <p className="text-[10px] font-black uppercase text-zinc-500 mt-2 leading-none text-left">
                    {adminTab === 'users' ? 'Manage platform identities and access clearance' : 'Audit and monitor takeoff projects across all user nodes'}
                  </p>
                </div>
                <div className="relative w-full md:w-96 group text-left">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" size={18} />
                  <input 
                    type="text" placeholder="Search registry..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
                    className={`w-full pl-16 pr-8 py-5 rounded-2xl border outline-none font-bold text-xs transition-all
                      ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200'}`} 
                  />
                </div>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-100 border-zinc-200'} border-b`}>
                      <th className="p-10 text-[10px] font-black uppercase text-zinc-500 italic text-left">Identification</th>
                      <th className="p-10 text-[10px] font-black uppercase text-zinc-500 italic text-left">Clearance / Stats</th>
                      <th className="p-10 text-[10px] font-black uppercase text-zinc-500 italic text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {adminTab === 'users' ? (
                      profiles.filter(p => (p.username || '').toLowerCase().includes(searchQuery.toLowerCase())).map((p) => (
                        <tr key={p.id} className="group hover:bg-amber-500/5 transition-colors">
                          <td className="p-10 text-left">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-black text-amber-500 uppercase italic">
                                {p.username?.[0] || 'U'}
                              </div>
                              <div className="text-left">
                                <p className="font-black text-lg uppercase group-hover:text-amber-500 transition-colors leading-none">{p.username}</p>
                                <p className="text-[9px] font-mono text-zinc-500 uppercase mt-2">REF: {p.id.slice(0,12)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-10 text-left">
                             <div className="flex items-center gap-6">
                                <select 
                                  value={p.role} disabled={updatingId === p.id} onChange={(e) => handleRoleChange(p.id, e.target.value)}
                                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-zinc-300 outline-none focus:border-amber-500 transition-all cursor-pointer shadow-inner"
                                >
                                  <option value="user">Standard User</option>
                                  <option value="editor">Editor</option>
                                  <option value="admin">System Admin</option>
                                  <option value="super-admin">Super Admin</option>
                                </select>
                                <div className="h-4 w-px bg-zinc-800" />
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{p.project_count || 0} Workspaces</span>
                             </div>
                          </td>
                          <td className="p-10 text-right">
                             <button 
                               onClick={() => inspectUserWorkspaces(p.username)}
                               className="p-4 bg-zinc-950 border border-zinc-800 text-zinc-500 rounded-2xl hover:bg-amber-500 hover:text-black transition-all shadow-xl"
                               title="Inspect User Dashboard"
                             >
                               <ExternalLink size={18}/>
                             </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      allProjects.filter(proj => proj.name?.toLowerCase().includes(searchQuery.toLowerCase()) || proj.username?.toLowerCase().includes(searchQuery.toLowerCase())).map(proj => (
                        <tr key={proj.id} className="group hover:bg-rose-500/5 transition-colors">
                          <td className="p-10 text-left">
                            <div className="flex flex-col text-left">
                              <span className={`font-black text-xl uppercase tracking-tighter transition-colors group-hover:text-white ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-900'}`}>{proj.name}</span>
                              <span className="text-[9px] font-mono text-zinc-600 mt-1 uppercase leading-none">LOC: {proj.location || 'SITE_NODE'}</span>
                            </div>
                          </td>
                          <td className="p-10 text-left">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center font-black text-[10px] text-amber-500">{(proj.username?.[0] || 'U').toUpperCase()}</div>
                              <span className="font-bold text-xs uppercase tracking-tight text-zinc-500">Officer: {proj.username}</span>
                            </div>
                          </td>
                          <td className="p-10 text-right">
                            <div className="flex gap-3 justify-end">
                              <button onClick={() => navigate(`/projects/${proj.id}`)} className="p-4 bg-zinc-950 border border-zinc-800 text-zinc-500 rounded-2xl hover:bg-amber-500 hover:text-black transition-all shadow-xl"><ExternalLink size={16}/></button>
                              <button onClick={() => handleDeleteProject(proj.id)} className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-xl"><Trash2 size={16}/></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: PRICES LIBRARY */}
        {activeView === 'rates' && <RatesLibrary />}

        {/* VIEW: GLOBAL REPORTING HUB (FULLY INTEGRATED) */}
        {activeView === 'settings' && (
          <div className="space-y-12 animate-in fade-in">
             <div className="grid lg:grid-cols-4 gap-10">
                
                {/* GLOBAL ARCHIVE & VALUATIONS */}
                <div className="lg:col-span-2 space-y-10">
                  <div className="flex items-center gap-3 px-4">
                    <FileText size={18} className="text-amber-500" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic text-left">Platform Document Archive</h4>
                  </div>
                  <ArtifactsVault />
                  
                  <div className="flex items-center gap-3 px-4 pt-4 border-t border-zinc-800/20">
                    <Calculator size={18} className="text-amber-500" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic text-left">Valuation Engine Auditor</h4>
                  </div>
                  {allProjects.length > 0 ? (
                    <BoQGenerator projectId={allProjects[0]?.id} projectName={allProjects[0]?.name || "Platform Project"} />
                  ) : (
                    <div className="p-10 border border-dashed border-zinc-800 rounded-4xl text-center opacity-30 italic text-xs uppercase tracking-widest">No Projects Available for Audit</div>
                  )}
                </div>

                {/* SYSTEM OVERRIDES & AUDITS */}
                <div className="lg:col-span-2 space-y-10">
                   <div className={`p-10 rounded-[3.5rem] border ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-xl'} text-left`}>
                      <div className="flex items-center gap-3 mb-6">
                         <ShieldAlert size={20} className="text-rose-500" />
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 text-left">Root System Overrides</h4>
                      </div>
                      <p className="text-[11px] font-bold text-zinc-400 leading-relaxed mb-10 text-left">
                         Emergency platform controls enabled for Super Nodes. These actions bypass standard user verification and force global database state changes.
                      </p>
                      <button className="w-full py-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 font-black uppercase text-[10px] tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-lg">
                         Force Global Cloud Sync
                      </button>
                   </div>

                   {/* FIX: Sanitized reporting data to prevent URI malformed error */}
                   <div className="space-y-4 px-4">
                     <div className="flex items-center gap-3">
                       <Share2 size={18} className="text-amber-500" />
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 italic text-left">Admin Transmittal</h4>
                     </div>
                     <WhatsAppExport projectName="Global-Admin-Audit" data={{
                       certNumber: "ADMIN-IPC-001", 
                       valuationDate: new Date().toLocaleDateString().replace(/\//g, '-'),
                       contractSum: 0,
                       workExecuted: stats.totalMeasurements * 5000, 
                       materialsOnSite: 0,
                       previousCertified: 0,
                       retentionPercent: 10 
                     }} />
                   </div>

                   <div className="space-y-4 px-4 pt-10 border-t border-zinc-800/40">
                     <div className="flex items-center gap-3">
                        <FileText size={18} className="text-emerald-500" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 italic text-left">Draft Certification Auditor</h4>
                     </div>
                     {allProjects.length > 0 && (
                        <CertificateGenerator projectId={allProjects[0]?.id} projectName={allProjects[0]?.name || "Select Project"} />
                     )}
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* VIEW: ADMIN IDENTITY */}
        {activeView === 'profile' && (
          <div className="space-y-12 animate-in fade-in">
             <IdentityNode onBack={() => setActiveView('projects')} />
             <div className="max-w-4xl mx-auto px-4">
                <button 
                  onClick={handleLogout}
                  className="w-full py-8 rounded-[2.5rem] border border-rose-500/20 bg-rose-500/5 text-rose-500 font-black uppercase text-xs tracking-[0.4em] hover:bg-rose-500 hover:text-white transition-all shadow-xl active:scale-95"
                >
                  Terminate Admin Session
                </button>
             </div>
          </div>
        )}
      </div>

      {/* COMPLIANCE WATERMARK */}
      <footer className="pt-20 text-center opacity-10 select-none hidden sm:block">
        <p className="text-[8px] font-black uppercase tracking-[1em] italic text-zinc-500">
          QS VAULT ADMIN CONSOLE • SMM-KE COMPLIANT ENGINE
        </p>
      </footer>

    </div>
  );
};

export default AdminDashboardPage;