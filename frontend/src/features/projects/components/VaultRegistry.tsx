import React, { useMemo, useState } from "react";
import {
  Search,
  Plus,
  MapPin,
  ExternalLink,
  X,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Trash2,
} from "lucide-react";
import Button from "../../../components/ui/Button";
import { useAuth } from "../../auth/AuthContext";
import { db, syncEngine } from "../../../lib/database/database";

interface Project {
  id: string;
  user_id: string;
  name: string;
  client_name: string | null;
  location: string | null;
  contract_sum: number;
  status: "active" | "completed" | "archived";
  geofence_radius: number;
  created_at: string;
  updated_at: string;
}

interface VaultRegistryProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  navigate: (path: string) => void;
  onDeleteProject: (id: string) => void;
}

const VaultRegistry: React.FC<VaultRegistryProps> = ({
  projects,
  setProjects,
  navigate,
  onDeleteProject,
}) => {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newProject, setNewProject] = useState({
    name: "",
    client_name: "",
    location: "",
  });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name.trim() || !user) return;

    setIsSubmitting(true);
    const timestamp = new Date().toISOString();
    const projectRecord: Project = {
      id: crypto.randomUUID(),
      user_id: user.id,
      name: newProject.name.trim(),
      client_name: newProject.client_name.trim() || null,
      location: newProject.location.trim() || null,
      contract_sum: 0,
      status: "active",
      geofence_radius: 100,
      created_at: timestamp,
      updated_at: timestamp,
    };

    try {
      await db.projects.add(projectRecord);
      await syncEngine.queueChange("projects", projectRecord.id, "INSERT", projectRecord);
      setProjects((prev) => [projectRecord, ...prev]);
      setIsCreating(false);
      setNewProject({ name: "", client_name: "", location: "" });
    } catch (err) {
      console.error("Registry Error: Transaction failed.", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        const query = searchQuery.toLowerCase();
        return (
          project.name.toLowerCase().includes(query) ||
          project.client_name?.toLowerCase().includes(query)
        );
      }),
    [projects, searchQuery],
  );

  return (
    <div className="theme-panel overflow-hidden rounded-[2.5rem] shadow-2xl backdrop-blur-3xl transition-all duration-500 sm:rounded-[3.5rem]">
      <div className="flex flex-col items-start justify-between gap-8 border-b bg-white/1 p-6 theme-border sm:p-12 md:flex-row md:items-center">
        <div className="space-y-1 text-left">
          <h3 className="theme-heading text-2xl font-black uppercase italic leading-none tracking-tighter sm:text-3xl">
            Project Portfolio<span className="theme-accent">.</span>
          </h3>
          <p className="theme-meta text-[10px] font-black uppercase tracking-[0.4em]">
            Professional Project Inventory
          </p>
        </div>

        <div className="flex w-full flex-col items-stretch gap-6 sm:flex-row sm:items-center md:w-auto">
          <div className="group relative">
            <Search
              className="theme-meta absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:theme-accent"
              size={16}
            />
            <input
              placeholder="Search Project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="theme-input w-full rounded-xl py-3 pl-10 pr-4 text-xs font-bold shadow-inner outline-none transition-all focus:theme-border sm:w-56"
            />
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center justify-center gap-4 rounded-2xl bg-amber-500 px-10 py-5 text-xs font-black uppercase italic tracking-widest text-black shadow-2xl shadow-amber-500/20 transition-all hover:bg-amber-400 active:scale-95"
          >
            <Plus size={20} strokeWidth={3} /> Register Project
          </button>
        </div>
      </div>

      {isCreating && (
        <form
          onSubmit={handleCreateProject}
          className="theme-accent-surface theme-border animate-in slide-in-from-top-4 space-y-8 border-b p-8 sm:p-12"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2 text-left">
              <label className="theme-meta ml-1 text-[10px] font-black uppercase italic">
                Project Name
              </label>
              <input
                required
                placeholder="e.g. Nairobi Office Complex"
                value={newProject.name}
                onChange={(e) =>
                  setNewProject({ ...newProject, name: e.target.value })
                }
                className="theme-input w-full rounded-2xl p-5 text-sm font-bold shadow-inner outline-none transition-all focus:theme-border"
              />
            </div>
            <div className="space-y-2 text-left">
              <label className="theme-meta ml-1 text-[10px] font-black uppercase italic">
                Client Name
              </label>
              <input
                required
                placeholder="Client / Stakeholder..."
                value={newProject.client_name}
                onChange={(e) =>
                  setNewProject({ ...newProject, client_name: e.target.value })
                }
                className="theme-input w-full rounded-2xl p-5 text-sm font-bold shadow-inner outline-none transition-all focus:theme-border"
              />
            </div>
          </div>

          <div className="space-y-2 text-left">
            <label className="theme-meta ml-1 text-[10px] font-black uppercase italic">
              Location
            </label>
            <input
              placeholder="Project location..."
              value={newProject.location}
              onChange={(e) =>
                setNewProject({ ...newProject, location: e.target.value })
              }
              className="theme-input w-full rounded-2xl p-5 text-sm font-bold shadow-inner outline-none transition-all focus:theme-border"
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="flex-1 py-6 italic"
              leftIcon={<CheckCircle2 size={18} />}
            >
              Save Project
            </Button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="theme-button-secondary rounded-2xl px-10 transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </form>
      )}

      <div className="custom-scrollbar overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="theme-card border-b text-[10px] font-black uppercase italic tracking-[0.4em] shadow-inner">
            <tr>
              <th className="p-10 text-left">Infrastructure Node</th>
              <th className="hidden p-10 text-left sm:table-cell">Main Client</th>
              <th className="hidden p-10 text-left lg:table-cell">Location</th>
              <th className="p-10 text-right">Technical Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y theme-border/40">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <tr
                  key={project.id}
                  className="group transition-colors hover:bg-[color-mix(in_srgb,var(--app-body)_5%,transparent)]"
                >
                  <td className="p-8 text-left sm:p-10">
                    <div className="flex flex-col text-left">
                      <span className="theme-heading text-xl font-black uppercase leading-none tracking-tighter transition-colors group-hover:theme-accent sm:text-2xl">
                        {project.name}
                      </span>
                      <div className="mt-4 flex items-center gap-2 opacity-40">
                        <MapPin size={12} className="text-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {project.location || "Location Pending"}
                        </span>
                      </div>
                      <span className="theme-meta mt-2 hidden text-[9px] font-mono uppercase leading-none tracking-widest sm:block">
                        REF: {project.id.slice(0, 12)}
                      </span>
                    </div>
                  </td>
                  <td className="hidden p-8 text-left sm:table-cell sm:p-10">
                    <div className="theme-meta flex items-center gap-3 text-sm font-bold uppercase tracking-tight">
                      <MapPin size={14} className="theme-accent opacity-60" />
                      {project.client_name || "Project Node"}
                    </div>
                  </td>
                  <td className="hidden p-8 text-left lg:table-cell lg:p-10">
                    <span className="theme-body text-sm font-semibold">
                      {project.location || "Unassigned"}
                    </span>
                  </td>
                  <td className="p-10 text-right">
                    <div className="flex justify-end gap-4">
                      <button
                        onClick={() => onDeleteProject(project.id)}
                        title="Purge Project Node"
                        className="theme-card p-4 shadow-xl transition-all hover:border-[var(--app-error)] hover:text-[var(--app-error)] active:scale-90"
                      >
                        <Trash2 size={20} />
                      </button>
                      <button
                        onClick={() => navigate(`/projects/${project.id}`)}
                        title="Open Workspace"
                        className="theme-button-secondary rounded-2xl p-4 shadow-xl transition-all hover:theme-accent active:scale-90"
                      >
                        <ExternalLink size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-32 text-center opacity-20">
                  <Briefcase size={64} className="theme-icon mx-auto mb-6 animate-pulse" />
                  <div className="space-y-2">
                    <p className="theme-heading text-sm font-black uppercase italic tracking-[0.5em]">
                      Registry is Empty
                    </p>
                    <p className="theme-meta text-[10px] font-bold uppercase leading-none tracking-widest">
                      Launch a new project to start site measurements.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="theme-panel flex items-center justify-between border-t p-6 opacity-40 shadow-inner">
        <div className="flex items-center gap-3">
          <AlertCircle size={12} className="theme-accent" />
          <p className="theme-meta text-[8px] font-black uppercase tracking-widest">
            Professional SMM Monitoring Active
          </p>
        </div>
        <p className="theme-meta text-[8px] font-mono uppercase">
          SECURE_VAULT_PROTOCOL_V4
        </p>
      </div>
    </div>
  );
};

export default VaultRegistry;
