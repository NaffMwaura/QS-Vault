/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Lock,
  ArrowRight,
  LayoutGrid,
  UserX,
  Briefcase,
  ChevronRight,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from "react-router-dom";
import IdentityNode from '../../features/auth/components/IdentityNode';

/* ======================================================
    ADMIN MODULE RESOLUTION (PRO-DEV STABILIZED)
   ====================================================== */

let useAuth: any = () => ({ theme: 'dark', role: null, isLoading: true });
let adminService: any = null;
let db: any = null;

// Feature Nodes
let BoQGenerator: any = () => null;
let CertificateGenerator: any = () => null;
let WhatsAppExport: any = () => null;
let ArtifactsVault: any = () => null;
let SyncQueueMonitor: any = () => null;
let SunlightModeToggle: any = () => null;

const resolveAdminModules = async () => {
  try {
    const authMod = await import("../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const dbMod = await import("../../lib/database/database");
    if (dbMod.adminService) adminService = dbMod.adminService;
    if (dbMod.db) db = dbMod.db;

    BoQGenerator = (await import("../../features/boq/components/BoQGenerator")).default;
    CertificateGenerator = (await import("../../features/reports/components/CertificateGenerator")).default;
    WhatsAppExport = (await import("../../features/reports/components/WhatsAppExport")).default;
    ArtifactsVault = (await import("../../features/boq/components/ArtifactsVault")).default;
    SyncQueueMonitor = (await import("../../features/sync/components/SyncQueueMonitor")).default;
    SunlightModeToggle = (await import("../layout/SunlightModeToggle")).default;
  } catch (e) {
    console.warn("Admin Hub: Infrastructure nodes in standby.");
  }
};

resolveAdminModules();

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

/** --- MAIN COMPONENT: PLATFORM CONTROL CENTER --- **/
const AdminDashboardPage: React.FC = () => {
  const { theme, isOnline, role, isLoading: authLoading, activeView, setActiveView, signOut } = useAuth();
  const navigate = useNavigate();

  const [adminTab, setAdminTab] = useState<'users' | 'inventory'>('users');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalProjects: 0, totalMeasurements: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const loadAdminData = useCallback(async () => {
    if (!adminService) return;
    try {
      setLoading(true);
      const [statsData, profilesData, globalProjects] = await Promise.all([
        adminService.getGlobalStats(),
        adminService.getAllProfiles(),
        adminService.getAllProjects(),
      ]);
      setStats(statsData);
      setProfiles(profilesData || []);
      setAllProjects(globalProjects || []);
      if (globalProjects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(globalProjects[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (!authLoading && (role === 'admin' || role === 'super-admin')) {
      loadAdminData();
    }
  }, [role, authLoading, loadAdminData]);

  const handleRoleChange = async (userId: string, newRole: any) => {
    if (!isOnline || !adminService) return;
    setUpdatingId(userId);
    try {
      await adminService.updateRole(userId, newRole);
      setProfiles((prev) => prev.map((p) => p.id === userId ? { ...p, role: newRole } : p));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`REVOKE ACCESS: Permanently erase all data and account for ${name}? This action is absolute.`)) return;
    try {
      // Logic for deleting user profile and their associated data nodes
      // Note: Full auth deletion usually handled via Supabase admin API/Edge function
      await adminService.deleteProfile?.(userId); 
      setProfiles(prev => prev.filter(p => p.id !== userId));
    } catch (e) { console.error(e); }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!window.confirm(`PURGE VAULT: Erase "${name}" from the global platform record?`)) return;
    try {
      await adminService.deleteProject(id);
      setAllProjects((prev) => prev.filter((p) => p.id !== id));
      setStats(prev => ({ ...prev, totalProjects: Math.max(0, prev.totalProjects - 1) }));
    } catch (e) { console.error(e); }
  };

  const filteredProfiles = useMemo(() => 
    profiles.filter((p) => (p.username || '').toLowerCase().includes(searchQuery.toLowerCase())), 
    [profiles, searchQuery]
  );

  const filteredProjects = useMemo(() => 
    allProjects.filter((p) => 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username?.toLowerCase().includes(searchQuery.toLowerCase())
    ), 
    [allProjects, searchQuery]
  );

  if (authLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-6 bg-[#09090b]">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500">Establishing Admin Link...</p>
      </div>
    );
  }

  if (role !== 'admin' && role !== 'super-admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] p-20 text-center space-y-8 animate-in fade-in transition-all">
        <ShieldAlert size={80} className="text-rose-500 animate-pulse" />
        <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Access Forbidden</h2>
        <button onClick={() => navigate('/dashboard')} className="px-10 py-5 bg-amber-500 text-black font-black uppercase text-xs rounded-2xl">Return to Workspace</button>
      </div>
    );
  }

  return (
    <div className={`space-y-16 pb-24 transition-colors duration-500 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
      
      {/* 1. TOP COMMAND BAR */}
      <AdminPageSection
        eyebrow="Admin Console"
        title="Platform Command."
        description="Root coordination hub for managing platform identities, project nodes, and global valuation audits."
        actions={
          <>
            {SyncQueueMonitor && <SyncQueueMonitor />}
            {SunlightModeToggle && <SunlightModeToggle />}
          </>
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
          description={adminTab === 'users' ? "Manage platform clearance and account nodes." : "Audit project ownership and site telemetry."}
        >
          <div className={`rounded-[4rem] border-2 overflow-hidden shadow-2xl transition-all duration-500 mx-4
            ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
            
            <div className={`p-10 border-b-2 flex flex-col md:flex-row justify-between items-center gap-10 bg-white/[0.01] ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-100'}`}>
              <div className="flex gap-4">
                 <button onClick={() => setAdminTab('users')} className={`px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${adminTab === 'users' ? 'bg-amber-500 text-black shadow-xl' : 'bg-zinc-900/40 text-zinc-500 border border-zinc-800'}`}>User Registry</button>
                 <button onClick={() => setAdminTab('inventory')} className={`px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${adminTab === 'inventory' ? 'bg-amber-500 text-black shadow-xl' : 'bg-zinc-900/40 text-zinc-500 border border-zinc-800'}`}>Project Inventory</button>
              </div>
              <div className="relative w-full md:w-96">
                 <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600" />
                 <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search identifier..." className={`w-full pl-16 pr-8 py-5 rounded-2xl border-2 outline-none font-bold text-xs ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-100 text-zinc-900'}`} />
              </div>
            </div>

            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left">
                <thead><tr className={`text-[10px] font-black uppercase tracking-[0.4em] italic border-b-2 ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}><th className="p-10">Identifier</th><th className="p-10">{adminTab === 'users' ? 'Clearance' : 'Status'}</th><th className="p-10">{adminTab === 'users' ? 'Projects' : 'Owner'}</th><th className="p-10 text-right">Actions</th></tr></thead>
                <tbody className={`divide-y-2 ${theme === 'dark' ? 'divide-zinc-800/40' : 'divide-zinc-100'}`}>
                  {adminTab === 'users' ? filteredProfiles.map(p => (
                    <tr key={p.id} className="group hover:bg-amber-500/5 transition-colors">
                      <td className="p-10 text-left"><div className="flex items-center gap-6"><div className="w-14 h-14 rounded-2xl bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center font-black text-amber-500 italic">{(p.username?.[0] || 'U').toUpperCase()}</div><div><p className="text-xl font-black uppercase italic leading-none">{p.username}</p><p className="text-[9px] font-mono text-zinc-600 mt-2">ID: {p.id.slice(0,18)}</p></div></div></td>
                      <td className="p-10 text-left"><select value={p.role} onChange={(e) => handleRoleChange(p.id, e.target.value)} className="bg-zinc-900 border-2 border-zinc-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-amber-500 outline-none"><option value="user">User</option><option value="editor">Editor</option><option value="admin">Admin</option><option value="super-admin">Super Admin</option></select></td>
                      <td className="p-10 text-left"><span className="px-4 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-[10px] font-black uppercase">{p.project_count || 0} Nodes</span></td>
                      <td className="p-10 text-right"><div className="flex justify-end gap-3"><button onClick={() => handleDeleteUser(p.id, p.username)} className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"><UserX size={18}/></button></div></td>
                    </tr>
                  )) : filteredProjects.map(proj => (
                    <tr key={proj.id} className="group hover:bg-amber-500/5 transition-colors">
                      <td className="p-10 text-xl font-black uppercase italic tracking-tighter leading-none text-left">{proj.name}</td>
                      <td className="p-10 text-left"><span className="text-xs font-bold uppercase tracking-widest text-zinc-500">{proj.status || 'Active'}</span></td>
                      <td className="p-10 text-left"><p className="text-sm font-bold uppercase text-zinc-400">{proj.username || 'Surveyor'}</p></td>
                      <td className="p-10 text-right"><div className="flex gap-4 justify-end"><button onClick={() => navigate(`/projects/${proj.id}`)} className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-zinc-600 hover:text-amber-500 transition-all"><ExternalLink size={20}/></button><button onClick={() => handleDeleteProject(proj.id, proj.name)} className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={20}/></button></div></td>
                    </tr>
                  ))}
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
              <div className="flex flex-col lg:flex-row items-center gap-10">
                 <div className="flex items-center gap-6 p-10 rounded-[3rem] border-2 border-amber-500 bg-amber-500/5 flex-1 w-full lg:w-auto">
                    <Briefcase size={32} className="text-amber-500" />
                    <div className="text-left space-y-2 flex-1">
                       <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none">Context Select</h2>
                       <select value={selectedProjectId || ''} onChange={(e) => setSelectedProjectId(e.target.value)} className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-xl px-4 py-3 text-[10px] font-black uppercase text-amber-500 outline-none">
                          {allProjects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.username})</option>)}
                       </select>
                    </div>
                 </div>
                 {ArtifactsVault && <div className="flex-1 w-full lg:w-auto"><ArtifactsVault /></div>}
              </div>

              <div className="grid lg:grid-cols-2 gap-12">
                 <div className="space-y-12">
                   <div className="flex items-center gap-4 px-6 border-l-4 border-amber-500">
                     <Calculator size={24} className="text-amber-500" />
                     <h4 className="text-3xl font-black uppercase italic tracking-tighter">Valuation Auditor</h4>
                   </div>
                   {selectedProjectId && BoQGenerator ? (
                     <div className={`p-10 rounded-[3.5rem] border-2 ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200'}`}>
                       <BoQGenerator projectId={selectedProjectId} projectName={allProjects.find(p => p.id === selectedProjectId)?.name || "Vault Node"} />
                     </div>
                   ) : <p className="text-zinc-500 italic px-8">No project node selected.</p>}
                 </div>

                 <div className="space-y-12">
                   <div className="flex items-center gap-4 px-6 border-l-4 border-rose-500">
                     <FileText size={24} className="text-rose-500" />
                     <h4 className="text-3xl font-black uppercase italic tracking-tighter">Certification Audit</h4>
                   </div>
                   {selectedProjectId && CertificateGenerator ? (
                     <div className={`p-10 rounded-[3.5rem] border-2 ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200'}`}>
                       <CertificateGenerator projectId={selectedProjectId} projectName={allProjects.find(p => p.id === selectedProjectId)?.name || "Vault Node"} />
                     </div>
                   ) : <p className="text-zinc-500 italic px-8">No project node selected.</p>}
                 </div>
              </div>

              <div className="pt-16 border-t border-zinc-800/40">
                 <div className={`p-12 rounded-[3.5rem] border-2 bg-emerald-500/5 border-emerald-500/10 text-left`}>
                    <div className="flex items-center gap-6 mb-10">
                       <Share2 size={32} className="text-emerald-500" />
                       <div className="space-y-1">
                          <h3 className="text-3xl font-black uppercase italic tracking-tighter">Global Audit Dispatch</h3>
                          <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Share platform valuation summary with root stakeholders</p>
                       </div>
                    </div>
                    {WhatsAppExport && (
                      <WhatsAppExport 
                        projectName="Platform-Global-Audit" 
                        data={{
                           certNumber: "PLAT-IPC-ROOT",
                           valuationDate: new Date().toLocaleDateString(),
                           contractSum: 0,
                           workExecuted: stats.totalMeasurements * 1250, 
                           materialsOnSite: 0,
                           previousCertified: 0,
                           retentionPercent: 10
                        }} 
                      />
                    )}
                 </div>
              </div>
           </div>
        </AdminPageSection>
      )}

      {activeView === 'profile' && IdentityNode && <IdentityNode onBack={() => setActiveView('projects')} />}

      <footer className="pt-24 pb-10 text-center opacity-30 group hover:opacity-100 transition-opacity">
         <p className="text-[12px] font-black uppercase tracking-[1em] italic text-zinc-600">QS VAULT ADMIN v2.6.4</p>
         <div className="flex items-center justify-center gap-6 mt-6 leading-none">
            <div className="h-px w-20 bg-zinc-800 group-hover:bg-amber-500/40 transition-colors" />
            <p className="text-[9px] font-black uppercase tracking-[0.6em] text-zinc-600 italic leading-none">Integrity • Precision • Compliance</p>
            <div className="h-px w-20 bg-zinc-800 group-hover:bg-amber-500/40 transition-colors" />
         </div>
      </footer>
    </div>
  );
};

/** --- UI HELPER COMPONENTS --- **/
const StatCard: React.FC<any> = ({ label, value, icon: Icon, color, theme }) => (
  <div className={`p-10 rounded-[3.5rem] border-2 shadow-2xl transition-all duration-500 hover:scale-[1.02] text-left
    ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/50'}`}>
    <Icon size={28} className={`${color} mb-8`} strokeWidth={2.5} />
    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-2 leading-none">{label}</p>
    <h3 className="text-5xl font-black italic tracking-tighter leading-none">{value}</h3>
  </div>
);

export default AdminDashboardPage;