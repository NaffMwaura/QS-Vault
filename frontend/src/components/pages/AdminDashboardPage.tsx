/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useCallback, useEffect, useMemo, useState,} from 'react';
import {
  Calculator,
  ChevronDown,
  Database,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  Share2,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Users,
  ShieldAlert,
  Search,
  LayoutGrid,
  UserX,
  Briefcase,
  Zap,
} from 'lucide-react';
import { useNavigate } from "react-router-dom";

/* ======================================================
    ADMIN MODULE RESOLUTION (PRO-DEV STABILIZED)
   ====================================================== */

/**
 * These shims ensure the UI doesn't crash during the initial
 * boot-up of the dynamic resolution handshake.
 */
// eslint-disable-next-line prefer-const
let useAuthShim: any = () => ({ 
  theme: 'dark', 
  role: 'admin', 
  isLoading: true, 
  user: null,
  isOnline: true,
  setActiveView: () => {},
  signOut: async () => {}
});

// Placeholders for dynamic feature nodes
let BoQGenerator: any = () => null;
let CertificateGenerator: any = () => null;
let WhatsAppExport: any = () => null;
let ArtifactsVault: any = () => null;
let SyncQueueMonitor: any = () => null;
let SunlightModeToggle: any = () => null;
let IdentityNode: any = () => null;

/** --- MAIN COMPONENT: PLATFORM CONTROL CENTER --- **/
const AdminDashboardPage: React.FC = () => {
  const [isResolved, setIsResolved] = useState(false);
  const [adminService, setAdminService] = useState<any>(null);
  const [useAuth, setUseAuth] = useState<any>(() => useAuthShim);

  /** * 1. INFRASTRUCTURE HANDSHAKE
   * We resolve the modules inside an effect to ensure React tracks
   * the availability of the admin service nodes.
   */
  useEffect(() => {
    const resolveNodes = async () => {
      try {
        const [authMod, dbMod, boqMod, certMod, waMod, vaultMod, syncMod, sunMod, idMod] = await Promise.all([
          import("../../features/auth/AuthContext"),
          import("../../lib/database/database"),
          import("../../features/boq/components/BoQGenerator"),
          import("../../features/reports/components/CertificateGenerator"),
          import("../../features/reports/components/WhatsAppExport"),
          import("../../features/boq/components/ArtifactsVault"),
          import("../../features/sync/components/SyncQueueMonitor"),
          import("../layout/SunlightModeToggle"),
          import("../../features/auth/components/IdentityNode")
        ]);

        if (authMod.useAuth) setUseAuth(() => authMod.useAuth);
        if (dbMod.adminService) setAdminService(dbMod.adminService);
        
        BoQGenerator = boqMod.default;
        CertificateGenerator = certMod.default;
        WhatsAppExport = waMod.default;
        ArtifactsVault = vaultMod.default;
        SyncQueueMonitor = syncMod.default;
        SunlightModeToggle = sunMod.default;
        IdentityNode = idMod.default;

        setIsResolved(true);
      } catch (e) {
        console.warn("Admin Hub: Waiting for infrastructure nodes...", e);
        // Retry after delay if failed
        setTimeout(resolveNodes, 2000);
      }
    };
    resolveNodes();
  }, []);

  // Initialize Auth context
  const { theme, isOnline, role, isLoading: authLoading, activeView, setActiveView, } = useAuth();
  const navigate = useNavigate();

  // Admin Ledger States
  const [adminTab, setAdminTab] = useState<'users' | 'inventory'>('users');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalProjects: 0, totalMeasurements: 0, systemHealth: 'Standby' });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /** * 2. DATA HARVEST: GLOBAL PORTAL ACCESS
   * This logic pulls data from the adminService defined in your database.ts
   */
  const loadAdminData = useCallback(async () => {
    if (!adminService || !isOnline) return;

    try {
      setIsRefreshing(true);
      setLoading(true);
      
      const [statsData, profilesData, globalProjects] = await Promise.all([
        adminService.getGlobalStats(),
        adminService.getAllProfiles(),
        adminService.getAllProjects(),
      ]);

      setStats(statsData);
      setProfiles(profilesData || []);
      setAllProjects(globalProjects || []);
      
      // Context Selection: default to first project found in the vault inventory
      if (globalProjects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(globalProjects[0].id);
      }
    } catch (e) {
        console.error("Admin Portal: Data retrieval failure.", e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [adminService, isOnline, selectedProjectId]);

  useEffect(() => {
    if (isResolved && !authLoading && (role === 'admin' || role === 'super-admin')) {
      loadAdminData();
    }
  }, [isResolved, role, authLoading, loadAdminData]);

  const filteredProfiles = useMemo(() => 
    profiles.filter((p) => 
      (p.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    ), 
    [profiles, searchQuery]
  );

  const filteredProjects = useMemo(() => 
    allProjects.filter((p) => 
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.username || '').toLowerCase().includes(searchQuery.toLowerCase())
    ), 
    [allProjects, searchQuery]
  );

  // Guard Clauses (Only after hooks)
  if (!isResolved || authLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-8 bg-[#09090b]">
        <div className="relative">
            <Loader2 className="w-16 h-16 animate-spin text-amber-500" />
            <div className="absolute inset-0 blur-3xl bg-amber-500/10 animate-pulse" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-500 italic">Synchronizing Admin Ledger...</p>
      </div>
    );
  }

  if (role !== 'admin' && role !== 'super-admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] p-20 text-center space-y-8 animate-in fade-in">
        <ShieldAlert size={80} className="text-rose-500 animate-pulse" />
        <div className="space-y-4">
           <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white leading-none">Access Forbidden</h2>
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Verification Failure: Authorized Node Clearance Required.</p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="px-10 py-5 bg-amber-500 text-black font-black uppercase text-xs rounded-2xl shadow-xl active:scale-95 transition-all italic tracking-widest">Return to Technical Workspace</button>
      </div>
    );
  }

  const handleRoleChange = async (userId: string, newRole: any) => {
    if (!isOnline || !adminService) return;
    setUpdatingId(userId);
    try {
      await adminService.updateRole(userId, newRole);
      setProfiles((prev) => prev.map((p) => p.id === userId ? { ...p, role: newRole } : p));
    } catch (e) {
      console.error("Role Mutation Failed.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`REVOKE ACCESS: Permanently erase all data and account for ${name}?`)) return;
    try {
      if (adminService.deleteProfile) {
         await adminService.deleteProfile(userId); 
         setProfiles(prev => prev.filter(p => p.id !== userId));
      } else {
         console.warn("Service: Profile deletion logic deferred to Auth Provider.");
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!window.confirm(`PURGE VAULT: Erase "${name}" from the global records?`)) return;
    try {
      await adminService.deleteProject(id);
      setAllProjects((prev) => prev.filter((p) => p.id !== id));
      setStats(prev => ({ ...prev, totalProjects: Math.max(0, prev.totalProjects - 1) }));
    } catch (e) { console.error(e); }
  };

  return (
    <div className={`space-y-16 pb-24 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
      
      {/* 1. TOP COMMAND BAR */}
      <AdminPageSection
        eyebrow="Admin Console"
        title="Platform Command."
        description="Root coordination hub for managing platform identities, project vaults, and global valuation audits."
        actions={
          <div className="flex items-center gap-4">
            <button 
              onClick={loadAdminData}
              className={`p-4 rounded-xl border-2 transition-all active:scale-90 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-white border-zinc-100 text-zinc-400'}`}
            >
               <RefreshCw size={20} className={isRefreshing ? 'animate-spin text-amber-500' : ''} />
            </button>
            {SyncQueueMonitor && <SyncQueueMonitor />}
            {SunlightModeToggle && <SunlightModeToggle />}
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
          <StatCard label="Identities" value={stats.totalUsers} icon={Users} color="text-blue-500" theme={theme} />
          <StatCard label="Vaults" value={stats.totalProjects} icon={Database} color="text-amber-500" theme={theme} />
          <StatCard label="Takeoffs" value={stats.totalMeasurements} icon={TrendingUp} color="text-emerald-500" theme={theme} />
          <StatCard label="Cloud Health" value={isOnline ? 'Active' : 'Offline'} icon={ShieldCheck} color="text-rose-500" theme={theme} />
        </div>
      </AdminPageSection>

      {/* 2. REGISTRY WORKSPACE */}
      {activeView === 'projects' && (
        <AdminPageSection
          eyebrow="Master Registry"
          title={adminTab === 'users' ? "User Identities" : "Project Inventory"}
          description={adminTab === 'users' ? "Manage platform clearance levels and account nodes." : "Audit project ownership and site telemetry across the platform."}
        >
          <div className={`rounded-[4rem] border-2 overflow-hidden shadow-2xl transition-all duration-500 mx-4
            ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
            
            <div className={`p-10 border-b-2 flex flex-col md:flex-row justify-between items-center gap-10 bg-white/1 ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-100'}`}>
              <div className="flex bg-zinc-950/40 p-1.5 rounded-2xl border border-zinc-800 shadow-inner">
                 <button onClick={() => setAdminTab('users')} className={`px-10 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${adminTab === 'users' ? 'bg-amber-500 text-black shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}>User Registry</button>
                 <button onClick={() => setAdminTab('inventory')} className={`px-10 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${adminTab === 'inventory' ? 'bg-amber-500 text-black shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}>Project Inventory</button>
              </div>
              <div className="relative w-full md:w-96 group">
                 <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                 <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search node identifier..." className={`w-full pl-16 pr-8 py-5 rounded-2xl border-2 outline-none font-bold text-xs ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-100 text-zinc-900 focus:border-amber-500 shadow-inner'}`} />
              </div>
            </div>

            <div className="overflow-x-auto min-h-400px]">
              <table className="w-full text-left">
                <thead>
                  <tr className={`text-[10px] font-black uppercase tracking-[0.4em] italic border-b-2 ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800 text-zinc-500' : 'bg-zinc-50 border-zinc-100 text-zinc-400'}`}>
                    <th className="p-10">Identifier</th>
                    <th className="p-10">{adminTab === 'users' ? 'Clearance' : 'Status'}</th>
                    <th className="p-10">{adminTab === 'users' ? 'Projects' : 'Owner'}</th>
                    <th className="p-10 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y-2 ${theme === 'dark' ? 'divide-zinc-800/40' : 'divide-zinc-100'}`}>
                  {adminTab === 'users' ? filteredProfiles.map(p => (
                    <tr key={p.id} className="group hover:bg-amber-500/5 transition-colors">
                      <td className="p-10 text-left">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center font-black text-amber-500 italic shadow-inner shrink-0">
                            {(p.username?.[0] || 'U').toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xl font-black uppercase italic leading-none group-hover:text-amber-500 transition-colors truncate">{p.username}</p>
                            <p className="text-[9px] font-mono text-zinc-600 mt-2 uppercase tracking-tighter leading-none">NODE_ID: {p.id.slice(0,24)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-10 text-left">
                        <div className="relative w-fit">
                          <select 
                            value={p.role} 
                            disabled={updatingId === p.id}
                            onChange={(e) => handleRoleChange(p.id, e.target.value)} 
                            className={`appearance-none bg-zinc-900 border-2 border-zinc-800 rounded-xl px-6 py-3 text-[10px] font-black uppercase text-amber-500 outline-none pr-12 focus:border-amber-500 transition-all ${updatingId === p.id ? 'opacity-30 cursor-wait' : 'cursor-pointer'}`}
                          >
                            <option value="user">Standard User</option>
                            <option value="editor">Editor Node</option>
                            <option value="admin">System Admin</option>
                            <option value="super-admin">Root Operator</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none" />
                        </div>
                      </td>
                      <td className="p-10 text-left">
                        <div className="flex items-center gap-3">
                           <LayoutGrid size={14} className="text-zinc-700" />
                           <span className="px-4 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                             {p.project_count || 0} Nodes
                           </span>
                        </div>
                      </td>
                      <td className="p-10 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleDeleteUser(p.id, p.username)} className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-xl active:scale-90">
                            <UserX size={18}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : filteredProjects.map(proj => (
                    <tr key={proj.id} className="group hover:bg-amber-500/5 transition-colors">
                      <td className="p-10 text-xl font-black uppercase italic tracking-tighter leading-none text-left">
                        <div className="flex items-center gap-4 min-w-0">
                           <div className="w-2 h-10 bg-amber-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                           <span className="truncate">{proj.name}</span>
                        </div>
                      </td>
                      <td className="p-10 text-left">
                        <span className={`px-4 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest
                          ${proj.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>
                          {proj.status || 'Active'}
                        </span>
                      </td>
                      <td className="p-10 text-left">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500 italic shrink-0">{(proj.username?.[0] || 'U').toUpperCase()}</div>
                           <p className="text-sm font-bold uppercase tracking-tight text-zinc-400 truncate">{proj.username || 'Surveyor'}</p>
                        </div>
                      </td>
                      <td className="p-10 text-right">
                        <div className="flex gap-4 justify-end">
                          <button onClick={() => navigate(`/projects/${proj.id}`)} className="p-4 bg-zinc-950 border border-zinc-800 text-zinc-600 hover:text-amber-500 hover:border-amber-500 rounded-2xl transition-all shadow-xl active:scale-95">
                            <ExternalLink size={20}/>
                          </button>
                          <button onClick={() => handleDeleteProject(proj.id, proj.name)} className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-xl active:scale-95">
                            <Trash2 size={20}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {((adminTab === 'users' && filteredProfiles.length === 0) || (adminTab === 'inventory' && filteredProjects.length === 0)) && !loading && (
                    <tr>
                      <td colSpan={4} className="p-32 text-center opacity-20">
                         <Search size={80} className="mx-auto mb-6" />
                         <p className="font-black uppercase text-sm tracking-[0.5em] italic">No identifiers found for this query.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </AdminPageSection>
      )}



      {/* 3. AUDIT & REPORTING WORKSPACE */}
      {activeView === 'settings' && (
        <AdminPageSection
          eyebrow="Audit Node"
          title="Audit and Reporting"
          description="Review archived document nodes, valuation outputs, and certification drafts from a root perspective."
        >
           <div className="max-w-7xl mx-auto space-y-24 px-4">
              {/* Context Selector: The Bridge to Specific Vault Data */}
              <div className="flex flex-col lg:flex-row items-center gap-10">
                 <div className="flex items-center gap-8 p-12 rounded-[3.5rem] border-2 border-amber-500 bg-amber-500/5 flex-1 w-full lg:w-auto shadow-2xl">
                    <div className="p-6 bg-amber-500 text-black rounded-3xl shadow-xl shadow-amber-500/20">
                      <Briefcase size={36} strokeWidth={2.5} />
                    </div>
                    <div className="text-left space-y-4 flex-1">
                       <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none">Context Select</h2>
                       <div className="relative group">
                          <select 
                            value={selectedProjectId || ''} 
                            onChange={(e) => setSelectedProjectId(e.target.value)} 
                            className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-widest text-amber-500 outline-none appearance-none group-hover:border-amber-500 transition-all shadow-inner"
                          >
                            {allProjects.length > 0 ? allProjects.map(p => (
                              <option key={p.id} value={p.id}>{p.name} • {p.username}</option>
                            )) : <option value="">No Active Vaults</option>}
                          </select>
                          <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                       </div>
                    </div>
                 </div>
                 {ArtifactsVault && (
                   <div className="flex-1 w-full lg:w-auto animate-in zoom-in-95 duration-500">
                      <ArtifactsVault />
                   </div>
                 )}
              </div>

              {/* Generator Grid: Real-time calculation audit */}
              <div className="grid lg:grid-cols-2 gap-16">
                 <div className="space-y-12">
                   <div className="flex items-center gap-4 px-6 border-l-[6px] border-amber-500">
                     <div className="text-left">
                        <h4 className="text-3xl font-black uppercase italic tracking-tighter leading-none">Valuation Auditor</h4>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mt-2 italic leading-none">Remote Site Ledger Sync</p>
                     </div>
                   </div>
                   {selectedProjectId && BoQGenerator ? (
                     <div className={`p-10 sm:p-14 rounded-[4rem] border-2 transition-all duration-700
                       ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800 shadow-black shadow-2xl' : 'bg-white border-zinc-200'}`}>
                       <BoQGenerator 
                         projectId={selectedProjectId} 
                         projectName={allProjects.find(p => p.id === selectedProjectId)?.name || "Vault Node"} 
                       />
                     </div>
                   ) : (
                     <div className="py-24 text-center opacity-10 border-2 border-dashed border-zinc-800 rounded-[3rem]">
                        <Calculator size={60} className="mx-auto" />
                        <p className="font-black uppercase text-xs tracking-widest mt-4">Audit Target Required</p>
                     </div>
                   )}
                 </div>

                 <div className="space-y-12">
                   <div className="flex items-center gap-4 px-6 border-l-[6px] border-rose-500">
                     <div className="text-left">
                        <h4 className="text-3xl font-black uppercase italic tracking-tighter leading-none">Certification Audit</h4>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mt-2 italic leading-none">Compliance & Statutory Drafts</p>
                     </div>
                   </div>
                   {selectedProjectId && CertificateGenerator ? (
                     <div className={`p-10 sm:p-14 rounded-[4rem] border-2 transition-all duration-700
                       ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800 shadow-black shadow-2xl' : 'bg-white border-zinc-200'}`}>
                       <CertificateGenerator 
                         projectId={selectedProjectId} 
                         projectName={allProjects.find(p => p.id === selectedProjectId)?.name || "Vault Node"} 
                       />
                     </div>
                   ) : (
                     <div className="py-24 text-center opacity-10 border-2 border-dashed border-zinc-800 rounded-[3rem]">
                        <FileText size={60} className="mx-auto" />
                        <p className="font-black uppercase text-xs tracking-widest mt-4">Audit Target Required</p>
                     </div>
                   )}
                 </div>
              </div>

              {/* Share Dispatch: Distribute audit data */}
              <div className="pt-24 border-t border-zinc-800/40">
                 <div className={`p-12 sm:p-20 rounded-[5rem] border-2 bg-emerald-500/5 border-emerald-500/10 text-left relative overflow-hidden shadow-2xl`}>
                    <Zap size={300} className="absolute top-[-10%] right-[-10%] opacity-[0.02] -rotate-12" />
                    <div className="flex flex-col md:flex-row items-center gap-8 mb-16 relative z-10">
                       <div className="p-8 bg-emerald-500 text-black rounded-[2.5rem] shadow-xl shadow-emerald-500/20">
                          <Share2 size={40} strokeWidth={2.5} />
                       </div>
                       <div className="space-y-2 text-center md:text-left">
                          <h3 className="text-4xl font-black uppercase italic tracking-tighter leading-none">Global Audit Dispatch</h3>
                          <p className="text-[11px] font-black uppercase text-zinc-500 tracking-[0.4em] italic leading-none">Broadcast platform performance and valuation health to root stakeholders</p>
                       </div>
                    </div>
                    {WhatsAppExport && (
                      <div className="relative z-10 max-w-2xl">
                        <WhatsAppExport 
                          projectName="Platform-Global-Audit" 
                          projectId="global"
                          measurements={[]} // Passed for component interface compatibility
                          data={{
                             certNumber: "PLAT-IPC-ROOT",
                             valuationDate: new Date().toLocaleDateString(),
                             contractSum: stats.totalProjects * 5000000, 
                             workExecuted: stats.totalMeasurements * 12500, 
                             materialsOnSite: 0,
                             previousCertified: 0,
                             retentionPercent: 10
                          }} 
                        />
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </AdminPageSection>
      )}



      {activeView === 'profile' && IdentityNode && (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
           <IdentityNode onBack={() => setActiveView('projects')} />
        </div>
      )}



      <footer className="pt-24 pb-12 text-center opacity-10 group hover:opacity-100 transition-opacity select-none">
         <p className="text-[12px] font-black uppercase tracking-[1.5em] italic text-zinc-600 leading-none">QS VAULT ADMIN v2.8.5</p>
         <div className="flex items-center justify-center gap-6 mt-8 leading-none">
            <div className="h-px w-20 bg-zinc-800 group-hover:bg-amber-500/40 transition-colors" />
            <p className="text-[9px] font-black uppercase tracking-[0.6em] text-zinc-600 italic leading-none">Integrity • Precision • Compliance</p>
            <div className="h-px w-20 bg-zinc-800 group-hover:bg-amber-500/40 transition-colors" />
         </div>
      </footer>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
      `}</style>
    </div>
  );
};

/** --- SUB-COMPONENT: STAT CARD --- **/
const StatCard: React.FC<any> = ({ label, value, icon: Icon, color, theme }) => (
  <div className={`p-10 rounded-[3.5rem] border-2 shadow-2xl transition-all duration-500 hover:scale-[1.02] text-left relative overflow-hidden group
    ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
      <Icon size={120} />
    </div>
    <div className={`p-5 rounded-3xl ${color} bg-opacity-10 border border-current border-opacity-20 inline-block mb-8 shadow-inner`}>
      <Icon size={28} strokeWidth={2.5} />
    </div>
    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-2 leading-none">{label}</p>
    <h3 className="text-5xl font-black italic tracking-tighter leading-none">{value}</h3>
  </div>
);

/** --- UI WRAPPERS FOR CLEAN ARCHITECTURE --- **/
const AdminPageSection = ({ eyebrow, title, description, children, actions }: any) => (
  <div className="space-y-8 text-left animate-in fade-in duration-700">
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 px-4">
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500 italic leading-none">{eyebrow}</p>
        <h2 className="text-4xl sm:text-5xl font-black uppercase italic tracking-tighter leading-none">{title}</h2>
        <p className="max-w-2xl text-zinc-500 text-sm font-medium leading-relaxed">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-4">{actions}</div>}
    </div>
    {children}
  </div>
);


export default AdminDashboardPage;