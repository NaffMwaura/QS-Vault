/* eslint-disable @typescript-eslint/no-explicit-any */
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
} from 'lucide-react';
import { useNavigate } from "react-router-dom";
import type { UserRole } from "../../features/auth/AuthContext";
import { useAuth } from "../../features/auth/AuthContext";
import { AdminDataTable } from "../admin/AdminDataTable";
import { AdminEmptyState } from "../admin/AdminEmptyState";
import { AdminFilterBar } from "../admin/AdminFilterBar";
import { AdminMobileList } from "../admin/AdminMobileList";
import { AdminPageSection } from "../admin/AdminPageSection";
import { AdminStatCard } from "../admin/AdminStatCard";
import { AdminStatsGrid } from "../admin/AdminStatsGrid";
import { AdminToolbar } from "../admin/AdminToolbar";
import { DangerZonePanel } from "../admin/DangerZonePanel";
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

const tabButtonClass = (active: boolean) =>
  `theme-admin-control transition-all ${
    active
      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
      : 'theme-surface-inset theme-muted border border-[color:var(--app-border)] hover:text-[var(--app-fg)]'
  }`;

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
      setStats((prev) => ({
        ...prev,
        totalProjects: Math.max(prev.totalProjects - 1, 0),
      }));
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
          <AdminPageSection
            eyebrow="Admin Console"
            title="Platform Control Center"
            description="Monitor users, audit projects, and manage shared platform operations from one workspace designed for both mobile and desktop."
            actions={
              <AdminToolbar>
                <div className="w-full sm:w-auto">
                  <SyncQueueMonitor />
                </div>
                <SunlightModeToggle />
              </AdminToolbar>
            }
          >
            <AdminStatsGrid>
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
            </AdminStatsGrid>
          </AdminPageSection>

          <AdminPageSection
            eyebrow="Registry"
            title={adminTab === 'users' ? 'User Registry' : 'Project Inventory'}
            description={
              adminTab === 'users'
                ? 'Manage account roles, review workspace counts, and jump directly into a user activity stream.'
                : 'Search project records, inspect ownership, and perform administrative cleanup safely.'
            }
            actions={
              <AdminToolbar>
                <button
                  type="button"
                  onClick={() => {
                    setAdminTab('users');
                    setSearchQuery('');
                  }}
                  className={tabButtonClass(adminTab === 'users')}
                >
                  User Registry
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminTab('inventory');
                    setSearchQuery('');
                  }}
                  className={tabButtonClass(adminTab === 'inventory')}
                >
                  Project Inventory
                </button>
                <button
                  type="button"
                  onClick={loadAdminData}
                  className="theme-surface-inset theme-muted theme-admin-icon-button flex items-center justify-center border"
                  aria-label="Refresh admin data"
                >
                  <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
              </AdminToolbar>
            }
          >
            <AdminFilterBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={adminTab === 'users' ? 'Search by username' : 'Search by project or owner'}
            />

            {adminTab === 'users' ? (
              filteredProfiles.length === 0 ? (
                <AdminEmptyState
                  title="No matching users"
                  description="Try a broader search or refresh the registry to fetch the latest identities."
                />
              ) : (
                <>
                  <AdminDataTable headers={['User', 'Role', 'Workspaces', 'Actions']}>
                    {filteredProfiles.map((profile) => (
                      <tr
                        key={profile.id}
                        className="border-b border-[color:var(--app-divider)] last:border-b-0 hover:bg-amber-500/5"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 font-black uppercase text-amber-500">
                              {profile.username?.[0] || 'U'}
                            </div>
                            <div>
                              <p className="theme-admin-row-title uppercase">
                                {profile.username}
                              </p>
                              <p className="theme-admin-row-meta mt-1">
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
                            className="theme-input theme-admin-select border outline-none focus:border-amber-500"
                          >
                            <option value="user">Standard User</option>
                            <option value="editor">Editor</option>
                            <option value="admin">System Admin</option>
                            <option value="super-admin">Super Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <span className="theme-admin-meta">
                            {profile.project_count || 0} workspaces
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => inspectUserWorkspaces(profile.username)}
                            className="theme-surface-inset theme-muted theme-admin-icon-button inline-flex items-center justify-center border transition-all hover:border-amber-500 hover:text-amber-500"
                            title="Inspect user workspace"
                          >
                            <ExternalLink size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </AdminDataTable>

                  <AdminMobileList>
                    {filteredProfiles.map((profile) => (
                      <details key={profile.id} className="theme-admin-card group">
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 font-black uppercase text-amber-500">
                              {profile.username?.[0] || 'U'}
                            </div>
                            <div className="min-w-0 text-left">
                              <p className="theme-admin-row-title truncate uppercase">
                                {profile.username}
                              </p>
                              <p className="theme-admin-row-meta mt-1 truncate">
                                {profile.project_count || 0} workspaces
                              </p>
                            </div>
                          </div>
                          <ChevronDown
                            size={18}
                            className="theme-muted shrink-0 transition-transform group-open:rotate-180"
                          />
                        </summary>

                        <div className="mt-4 space-y-4 border-t border-[color:var(--app-divider)] pt-4 text-left">
                          <div className="grid gap-2.5 text-sm">
                            <div className="flex justify-between gap-3">
                              <span className="theme-admin-label">Reference</span>
                              <span className="theme-admin-row-meta text-right">
                                {profile.id.slice(0, 12)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span className="theme-admin-label">Status</span>
                              <span className="theme-admin-row-meta text-right">
                                Verified identity
                              </span>
                            </div>
                          </div>

                          <select
                            value={profile.role}
                            disabled={updatingId === profile.id}
                            onChange={(e) => handleRoleChange(profile.id, e.target.value as UserRole)}
                            className="theme-input theme-admin-select w-full border outline-none focus:border-amber-500"
                          >
                            <option value="user">Standard User</option>
                            <option value="editor">Editor</option>
                            <option value="admin">System Admin</option>
                            <option value="super-admin">Super Admin</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => inspectUserWorkspaces(profile.username)}
                            className="theme-surface-inset theme-muted theme-admin-control inline-flex items-center gap-2 border hover:border-amber-500 hover:text-amber-500"
                          >
                            <ExternalLink size={15} />
                            Inspect Workspace
                          </button>
                        </div>
                      </details>
                    ))}
                  </AdminMobileList>
                </>
              )
            ) : filteredProjects.length === 0 ? (
              <AdminEmptyState
                title="No matching projects"
                description="Try another search term or refresh the inventory to reload shared project records."
              />
            ) : (
              <>
                <AdminDataTable headers={['Project', 'Owner', 'Location', 'Actions']}>
                  {filteredProjects.map((project) => (
                    <tr
                      key={project.id}
                      className="border-b border-[color:var(--app-divider)] last:border-b-0 hover:bg-amber-500/5"
                    >
                      <td className="px-4 py-4">
                        <p className="theme-admin-row-title uppercase">
                          {project.name}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="theme-admin-meta">
                          {project.username || 'Unknown'}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="theme-admin-meta">
                          {project.location || 'Site node'}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className="theme-surface-inset theme-muted theme-admin-icon-button flex items-center justify-center border transition-all hover:border-amber-500 hover:text-amber-500"
                          >
                            <ExternalLink size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(project.id)}
                            className="theme-admin-icon-button flex items-center justify-center border border-rose-500/20 bg-rose-500/10 text-rose-500 transition-all hover:bg-rose-500 hover:text-white"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </AdminDataTable>

                <AdminMobileList>
                  {filteredProjects.map((project) => (
                    <details key={project.id} className="theme-admin-card group">
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                        <div className="min-w-0 text-left">
                          <p className="theme-admin-row-title uppercase">
                            {project.name}
                          </p>
                          <p className="theme-admin-row-meta mt-1">
                            {project.location || 'Site node'}
                          </p>
                        </div>
                        <ChevronDown
                          size={18}
                          className="theme-muted shrink-0 transition-transform group-open:rotate-180"
                        />
                      </summary>

                      <div className="mt-4 space-y-4 border-t border-[color:var(--app-divider)] pt-4 text-left">
                        <div className="grid gap-2.5 text-sm">
                          <div className="flex justify-between gap-3">
                            <span className="theme-admin-label">Owner</span>
                            <span className="theme-admin-row-meta text-right">
                              {project.username || 'Unknown'}
                            </span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="theme-admin-label">Location</span>
                            <span className="theme-admin-row-meta text-right">
                              {project.location || 'Site node'}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className="theme-surface-inset theme-muted theme-admin-control inline-flex items-center gap-2 border hover:border-amber-500 hover:text-amber-500"
                          >
                            <ExternalLink size={15} />
                            Open
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(project.id)}
                            className="theme-admin-control inline-flex items-center gap-2 border border-rose-500/20 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white"
                          >
                            <Trash2 size={15} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </details>
                  ))}
                </AdminMobileList>
              </>
            )}

            <div className="theme-divider mt-5 border-t pt-4">
              <p className="theme-admin-meta">
                Showing{' '}
                <span className="theme-title font-black">
                  {adminTab === 'users' ? filteredProfiles.length : filteredProjects.length}
                </span>{' '}
                matching {adminTab === 'users' ? 'users' : 'projects'}.
              </p>
            </div>
          </AdminPageSection>
        </div>
      )}

      {activeView === 'rates' && <RatesLibrary />}

      {activeView === 'settings' && (
        <div className="space-y-6 sm:space-y-8">
          <AdminPageSection
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
                    <h3 className="theme-admin-subheading">Valuation Auditor</h3>
                  </div>
                  {allProjects.length > 0 ? (
                    <BoQGenerator
                      projectId={allProjects[0]?.id}
                      projectName={allProjects[0]?.name || "Platform Project"}
                    />
                  ) : (
                    <p className="theme-admin-meta">No projects available for audit.</p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <DangerZonePanel
                  title="Root Actions"
                  description="High-impact actions stay isolated from standard reporting tasks and remain visually distinct from normal admin flows."
                  actionLabel="Force Global Cloud Sync"
                />

                <div className="rounded-[1.8rem] border border-[color:var(--app-divider)] p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <Share2 size={18} className="text-amber-500" />
                    <h3 className="theme-admin-subheading">Admin Transmittal</h3>
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
                    <h3 className="theme-admin-subheading">Draft Certification Auditor</h3>
                  </div>
                  {allProjects.length > 0 ? (
                    <CertificateGenerator
                      projectId={allProjects[0]?.id}
                      projectName={allProjects[0]?.name || "Select Project"}
                    />
                  ) : (
                    <p className="theme-admin-meta">No project selected for certification review.</p>
                  )}
                </div>
              </div>
            </div>
          </AdminPageSection>
        </div>
      )}

      {activeView === 'profile' && (
        <div className="space-y-6 sm:space-y-8">
          <IdentityNode onBack={() => setActiveView('projects')} />

          <AdminPageSection
            eyebrow="Security"
            title="Session Controls"
            description="Critical account actions should stay separated from profile editing and remain obvious on both mobile and desktop."
          >
            <button
              type="button"
              onClick={handleLogout}
              className="theme-admin-control w-full min-h-[3.25rem] rounded-[1.4rem] border border-rose-500/20 bg-rose-500/5 text-rose-500 transition-all hover:bg-rose-500 hover:text-white"
            >
              Terminate Admin Session
            </button>
          </AdminPageSection>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
