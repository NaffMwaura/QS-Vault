/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calculator,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Users,
  Database,
} from 'lucide-react';
import { useNavigate } from "react-router-dom";
import type { UserRole } from "../../features/auth/AuthContext";
import { useAuth } from "../../features/auth/AuthContext";
import IdentityNode from "../../features/auth/components/IdentityNode";
import ArtifactsVault from "../../features/boq/components/ArtifactsVault";
import BoQGenerator from "../../features/boq/components/BoQGenerator";
import RatesLibrary from "../../features/projects/components/RatesLibrary";
import CertificateGenerator from "../../features/reports/components/CertificateGenerator";
import WhatsAppExport from "../../features/reports/components/WhatsAppExport";
import SyncQueueMonitor from "../../features/sync/components/SyncQueueMonitor";
import { adminService } from "../../lib/database/database";
import SunlightModeToggle from "../layout/SunlightModeToggle";

type AdminTab = 'users' | 'inventory';

const AdminStatCard = ({
  label,
  value,
  description,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  tone: string;
}) => (
  <div className="theme-surface-card rounded-[2rem] border p-5 sm:p-6 text-left shadow-xl transition-all duration-300 hover:border-amber-500/20">
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <p className="theme-subtle text-[11px] font-black uppercase tracking-[0.28em]">
          {label}
        </p>
        <p className="theme-title mt-3 text-3xl font-black tracking-tight sm:text-4xl">
          {value}
        </p>
      </div>
      <div className={`rounded-2xl border p-3 ${tone}`}>
        <Icon size={20} />
      </div>
    </div>
    <p className="theme-subtle text-sm leading-relaxed">{description}</p>
  </div>
);

const AdminPanel = ({
  eyebrow,
  title,
  description,
  children,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) => (
  <section className="theme-surface-overlay rounded-[2rem] border shadow-2xl backdrop-blur-2xl">
    <div className="flex flex-col gap-4 border-b border-[color:var(--app-divider)] px-5 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="text-left">
        {eyebrow && (
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-600 dark:text-amber-400">
            {eyebrow}
          </p>
        )}
        <h2 className="theme-title mt-2 text-2xl font-black tracking-tight sm:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="theme-subtle mt-2 max-w-3xl text-sm leading-relaxed sm:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
    <div className="p-5 sm:p-6">{children}</div>
  </section>
);

const TabButton = ({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-2xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] transition-all ${
      active
        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
        : 'theme-surface-inset theme-muted border border-[color:var(--app-border)] hover:text-[var(--app-fg)]'
    }`}
  >
    {children}
  </button>
);

const AdminDashboardPage: React.FC = () => {
  const { isOnline, role, isLoading: authLoading, activeView, setActiveView, signOut } = useAuth();
  const navigate = useNavigate();

  const [adminTab, setAdminTab] = useState<AdminTab>('users');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalMeasurements: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadAdminData = useCallback(async () => {
    if (!adminService) {
      setLoading(false);
      return;
    }

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
    } catch (err) {
      console.error("Admin Handshake Failure:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const isAuthorized = role === 'admin' || role === 'super-admin';
    if (!authLoading && isAuthorized) {
      loadAdminData();
    }
  }, [role, authLoading, loadAdminData]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!isOnline || !adminService) return;
    setUpdatingId(userId);
    try {
      await adminService.updateRole(userId, newRole);
      setProfiles((prev) =>
        prev.map((profile) =>
          profile.id === userId ? { ...profile, role: newRole } : profile,
        ),
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm("Permanently delete this project from the shared platform record?")) {
      return;
    }

    try {
      await adminService.deleteProject(projectId);
      setAllProjects((prev) => prev.filter((project) => project.id !== projectId));
      setStats((prev) => ({ ...prev, totalProjects: Math.max(prev.totalProjects - 1, 0) }));
    } catch (err) {
      console.error("Revocation failed:", err);
    }
  };

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

  const filteredProfiles = useMemo(
    () =>
      profiles.filter((profile) =>
        (profile.username || '').toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [profiles, searchQuery],
  );

  const filteredProjects = useMemo(
    () =>
      allProjects.filter(
        (project) =>
          project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.username?.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [allProjects, searchQuery],
  );

  const isInitialLoad = loading && profiles.length === 0 && activeView === 'projects';

  if (isInitialLoad) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
        <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
        <p className="theme-subtle text-[11px] font-black uppercase tracking-[0.4em]">
          Establishing admin link
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 sm:space-y-8 sm:pb-16">
      {activeView === 'projects' && (
        <div className="space-y-6 sm:space-y-8">
          <AdminPanel
            eyebrow="Admin Console"
            title="Platform Control Center"
            description="Monitor users, audit projects, and manage shared platform operations from one workspace designed for both mobile and desktop."
            actions={
              <>
                <div className="w-full sm:w-auto">
                  <SyncQueueMonitor />
                </div>
                <SunlightModeToggle />
              </>
            }
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <AdminStatCard
                label="Authorized Users"
                value={stats.totalUsers}
                description="Active identities with platform access and role-based permissions."
                icon={Users}
                tone="border-sky-500/20 bg-sky-500/10 text-sky-500"
              />
              <AdminStatCard
                label="Tracked Projects"
                value={stats.totalProjects}
                description="Projects visible across the shared admin workspace."
                icon={Database}
                tone="border-amber-500/20 bg-amber-500/10 text-amber-500"
              />
              <AdminStatCard
                label="Measured Records"
                value={stats.totalMeasurements}
                description="Takeoff and quantity activity collected from connected workspaces."
                icon={TrendingUp}
                tone="border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
              />
              <AdminStatCard
                label="Cloud Health"
                value={isOnline ? 'Online' : 'Offline'}
                description="Current connectivity state for live admin operations and sync tasks."
                icon={ShieldCheck}
                tone={
                  isOnline
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
                    : 'border-rose-500/20 bg-rose-500/10 text-rose-500'
                }
              />
            </div>
          </AdminPanel>

          <AdminPanel
            eyebrow="Registry"
            title={adminTab === 'users' ? 'User Registry' : 'Project Inventory'}
            description={
              adminTab === 'users'
                ? 'Manage account roles, review workspace counts, and jump directly into a user’s activity.'
                : 'Search project records, inspect ownership, and perform administrative cleanup safely.'
            }
            actions={
              <>
                <TabButton
                  active={adminTab === 'users'}
                  onClick={() => {
                    setAdminTab('users');
                    setSearchQuery('');
                  }}
                >
                  User Registry
                </TabButton>
                <TabButton
                  active={adminTab === 'inventory'}
                  onClick={() => {
                    setAdminTab('inventory');
                    setSearchQuery('');
                  }}
                >
                  Project Inventory
                </TabButton>
                <button
                  type="button"
                  onClick={loadAdminData}
                  className="theme-surface-inset theme-muted flex h-11 w-11 items-center justify-center rounded-2xl border"
                  aria-label="Refresh admin data"
                >
                  <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
              </>
            }
          >
            <div className="mb-5">
              <label className="relative block text-left">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="text"
                  placeholder={adminTab === 'users' ? 'Search by username' : 'Search by project or owner'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="theme-input w-full rounded-2xl border py-3 pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-amber-500"
                />
              </label>
            </div>

            {adminTab === 'users' ? (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[color:var(--app-divider)]">
                        <th className="theme-subtle px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em]">User</th>
                        <th className="theme-subtle px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em]">Role</th>
                        <th className="theme-subtle px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em]">Workspaces</th>
                        <th className="theme-subtle px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProfiles.map((profile) => (
                        <tr key={profile.id} className="border-b border-[color:var(--app-divider)] last:border-b-0 hover:bg-amber-500/5">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 font-black uppercase text-amber-500">
                                {profile.username?.[0] || 'U'}
                              </div>
                              <div>
                                <p className="theme-title text-sm font-black uppercase">
                                  {profile.username}
                                </p>
                                <p className="theme-subtle mt-1 text-xs font-medium">
                                  {profile.id.slice(0, 12)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <select
                              value={profile.role}
                              disabled={updatingId === profile.id}
                              onChange={(e) => handleRoleChange(profile.id, e.target.value as UserRole)}
                              className="theme-input rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-[0.16em] outline-none focus:border-amber-500"
                            >
                              <option value="user">Standard User</option>
                              <option value="editor">Editor</option>
                              <option value="admin">System Admin</option>
                              <option value="super-admin">Super Admin</option>
                            </select>
                          </td>
                          <td className="px-4 py-4">
                            <span className="theme-subtle text-sm font-semibold">
                              {profile.project_count || 0} workspaces
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => inspectUserWorkspaces(profile.username)}
                              className="theme-surface-inset theme-muted inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition-all hover:border-amber-500 hover:text-amber-500"
                              title="Inspect user workspace"
                            >
                              <ExternalLink size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-4 lg:hidden">
                  {filteredProfiles.map((profile) => (
                    <article key={profile.id} className="theme-surface-card rounded-[1.6rem] border p-4 shadow-lg">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 font-black uppercase text-amber-500">
                            {profile.username?.[0] || 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="theme-title truncate text-sm font-black uppercase">
                              {profile.username}
                            </p>
                            <p className="theme-subtle mt-1 truncate text-xs">
                              {profile.id.slice(0, 12)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => inspectUserWorkspaces(profile.username)}
                          className="theme-surface-inset theme-muted flex h-10 w-10 items-center justify-center rounded-2xl border"
                        >
                          <ExternalLink size={16} />
                        </button>
                      </div>

                      <div className="mt-4 grid gap-3">
                        <select
                          value={profile.role}
                          disabled={updatingId === profile.id}
                          onChange={(e) => handleRoleChange(profile.id, e.target.value as UserRole)}
                          className="theme-input rounded-xl border px-3 py-3 text-xs font-black uppercase tracking-[0.16em] outline-none focus:border-amber-500"
                        >
                          <option value="user">Standard User</option>
                          <option value="editor">Editor</option>
                          <option value="admin">System Admin</option>
                          <option value="super-admin">Super Admin</option>
                        </select>
                        <p className="theme-subtle text-sm font-semibold">
                          {profile.project_count || 0} workspaces
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[color:var(--app-divider)]">
                        <th className="theme-subtle px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em]">Project</th>
                        <th className="theme-subtle px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em]">Owner</th>
                        <th className="theme-subtle px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em]">Location</th>
                        <th className="theme-subtle px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProjects.map((project) => (
                        <tr key={project.id} className="border-b border-[color:var(--app-divider)] last:border-b-0 hover:bg-amber-500/5">
                          <td className="px-4 py-4">
                            <p className="theme-title text-sm font-black uppercase">
                              {project.name}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="theme-subtle text-sm font-semibold">
                              {project.username || 'Unknown'}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="theme-subtle text-sm">
                              {project.location || 'Site node'}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => navigate(`/projects/${project.id}`)}
                                className="theme-surface-inset theme-muted flex h-11 w-11 items-center justify-center rounded-2xl border transition-all hover:border-amber-500 hover:text-amber-500"
                              >
                                <ExternalLink size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProject(project.id)}
                                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-500 transition-all hover:bg-rose-500 hover:text-white"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-4 lg:hidden">
                  {filteredProjects.map((project) => (
                    <article key={project.id} className="theme-surface-card rounded-[1.6rem] border p-4 shadow-lg">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="theme-title text-sm font-black uppercase">
                            {project.name}
                          </p>
                          <p className="theme-subtle mt-1 text-xs">
                            {project.location || 'Site node'}
                          </p>
                          <p className="theme-subtle mt-2 text-xs font-semibold">
                            Owner: {project.username || 'Unknown'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className="theme-surface-inset theme-muted flex h-10 w-10 items-center justify-center rounded-2xl border"
                          >
                            <ExternalLink size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(project.id)}
                            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </AdminPanel>
        </div>
      )}

      {activeView === 'rates' && <RatesLibrary />}

      {activeView === 'settings' && (
        <div className="space-y-6 sm:space-y-8">
          <AdminPanel
            eyebrow="Reporting"
            title="Audit And Reporting Workspace"
            description="Review archived documents, valuation outputs, certification drafts, and high-impact admin actions in a calmer and more structured flow."
          >
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="space-y-6">
                <div className="rounded-[1.8rem] border border-[color:var(--app-divider)] p-1">
                  <ArtifactsVault />
                </div>

                <div className="rounded-[1.8rem] border border-[color:var(--app-divider)] p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <Calculator size={18} className="text-amber-500" />
                    <h3 className="theme-title text-lg font-black">Valuation Auditor</h3>
                  </div>
                  {allProjects.length > 0 ? (
                    <BoQGenerator
                      projectId={allProjects[0]?.id}
                      projectName={allProjects[0]?.name || "Platform Project"}
                    />
                  ) : (
                    <p className="theme-subtle text-sm">No projects available for audit.</p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[1.8rem] border border-rose-500/20 bg-rose-500/5 p-5 sm:p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <ShieldAlert size={18} className="text-rose-500" />
                    <h3 className="theme-title text-lg font-black">Root Actions</h3>
                  </div>
                  <p className="theme-subtle mb-5 text-sm leading-relaxed">
                    High-impact actions should stay isolated from standard reporting tasks and remain visually distinct from normal admin flows.
                  </p>
                  <button
                    type="button"
                    className="w-full rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-rose-500 transition-all hover:bg-rose-500 hover:text-white"
                  >
                    Force Global Cloud Sync
                  </button>
                </div>

                <div className="rounded-[1.8rem] border border-[color:var(--app-divider)] p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <Share2 size={18} className="text-amber-500" />
                    <h3 className="theme-title text-lg font-black">Admin Transmittal</h3>
                  </div>
                  <WhatsAppExport
                    projectName="Global-Admin-Audit"
                    data={{
                      certNumber: "ADMIN-IPC-001",
                      valuationDate: new Date().toLocaleDateString().replace(/\//g, '-'),
                      contractSum: 0,
                      workExecuted: stats.totalMeasurements * 5000,
                      materialsOnSite: 0,
                      previousCertified: 0,
                      retentionPercent: 10,
                    }}
                  />
                </div>

                <div className="rounded-[1.8rem] border border-[color:var(--app-divider)] p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <FileText size={18} className="text-emerald-500" />
                    <h3 className="theme-title text-lg font-black">Draft Certification Auditor</h3>
                  </div>
                  {allProjects.length > 0 ? (
                    <CertificateGenerator
                      projectId={allProjects[0]?.id}
                      projectName={allProjects[0]?.name || "Select Project"}
                    />
                  ) : (
                    <p className="theme-subtle text-sm">No project selected for certification review.</p>
                  )}
                </div>
              </div>
            </div>
          </AdminPanel>
        </div>
      )}

      {activeView === 'profile' && (
        <div className="space-y-6 sm:space-y-8">
          <IdentityNode onBack={() => setActiveView('projects')} />

          <AdminPanel
            eyebrow="Security"
            title="Session Controls"
            description="Critical account actions should stay separated from profile editing and remain obvious on both mobile and desktop."
          >
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-[2rem] border border-rose-500/20 bg-rose-500/5 px-5 py-5 text-[11px] font-black uppercase tracking-[0.24em] text-rose-500 transition-all hover:bg-rose-500 hover:text-white"
            >
              Terminate Admin Session
            </button>
          </AdminPanel>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
