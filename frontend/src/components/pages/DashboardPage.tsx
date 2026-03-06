import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, ExternalLink, 
  MapPin, Loader2, Check, Calendar, Search,
  LogOut, LayoutDashboard, Database, 
  Activity, Shield
} from 'lucide-react';

/** --- MODULE RESOLUTION HANDLERS (SANDBOX COMPATIBILITY) --- **/

export interface Project {
  id: string;
  user_id: string;
  name: string;
  client_name: string;
  location: string;
  contract_sum: number;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

// Default Mocks for Auth
interface AuthContextType {
  user: { id: string; email: string } | null;
  signOut: () => Promise<void>;
  theme: 'light' | 'dark';
  isOnline: boolean;
}
let useAuth: () => AuthContextType = () => ({
  user: { id: 'default-user', email: 'surveyor@vault.com' },
  signOut: async () => console.log("Vault Secure Sign Out Triggered"),
  theme: 'dark',
  isOnline: true
});

// Default Mocks for Database/Sync
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any = {
  projects: {
    where: () => ({ equals: () => ({ reverse: () => ({ toArray: async () => [] }) }) }),
    add: async () => {},
    delete: async () => {}
  }
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let syncEngine: any = { queueChange: async () => {} };

// Shims for UI Components to allow the code to run in the Canvas preview
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: string;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
}
const ButtonFallback: React.FC<ButtonProps> = ({ children, className, isLoading, leftIcon, ...props }) => (
  <button 
    {...props} 
    className={`px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 border transition-all active:scale-95 ${className}`}
  >
    {isLoading ? <Loader2 size={12} className="animate-spin" /> : <>{leftIcon} {children}</>}
  </button>
);

type GlassCardProps = React.HTMLAttributes<HTMLDivElement>;
const GlassCardFallback: React.FC<GlassCardProps> = ({ children, className }) => (
  <div className={`backdrop-blur-xl border rounded-[2.5rem] shadow-2xl ${className}`}>{children}</div>
);

let Button: React.FC<ButtonProps> = ButtonFallback;
let GlassCard: React.FC<GlassCardProps> = GlassCardFallback;

/** * NOTE FOR LOCAL DEVELOPMENT:
 * These dynamic imports allow the code to compile in the browser-based Canvas preview.
 * In your local VS Code project, the standard static imports you had originally 
 * (e.g., import { useAuth } from "../../features/auth/AuthContext") are correct.
 */
const resolveModules = async () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authMod = await import("../../features/auth/AuthContext") as any;
    if (authMod.useAuth) useAuth = authMod.useAuth;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbMod = await import("../../lib/database/database") as any;
    if (dbMod.db) db = dbMod.db; 
    if (dbMod.syncEngine) syncEngine = dbMod.syncEngine;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const btnMod = await import("../ui/Button") as any;
    if (btnMod.default) Button = btnMod.default;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cardMod = await import("../ui/GlassCard") as any;
    if (cardMod.default) GlassCard = cardMod.default;
  } catch (err) {
    // Failures are ignored here to allow the Sandbox to use the Fallbacks/Mocks defined above.
    console.warn(err);
  }
};

resolveModules();

/** --- MAIN DASHBOARD PAGE --- **/

const DashboardPage: React.FC = () => {
  const { user, signOut, theme, isOnline } = useAuth();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  const [newProject, setNewProject] = useState({ 
    name: "", 
    client_name: "", 
    location: "" 
  });

  // Load User Projects
  useEffect(() => {
    const loadProjects = async () => {
      if (!user) return;
      try {
        const userProjects = await db.projects
          .where('user_id')
          .equals(user.id)
          .reverse() 
          .toArray();
        setProjects(userProjects);
      } catch (err) {
        console.error("Failed to load vault projects:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };
    loadProjects();
    const interval = setInterval(loadProjects, 5000); 
    return () => clearInterval(interval);
  }, [user]);

  // Handle Logout Execution
  const handleSecureLogOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
    } catch (err) {
      console.error("Sign out failed:", err);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name || !newProject.client_name || !user) return;

    const projectId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const projectData: Project = {
      id: projectId,
      user_id: user.id,
      name: newProject.name,
      client_name: newProject.client_name,
      location: newProject.location,
      contract_sum: 0,
      status: 'active',
      created_at: timestamp,
      updated_at: timestamp
    };

    try {
      await db.projects.add(projectData);
      await syncEngine.queueChange('projects', projectId, 'INSERT', projectData);
      setProjects([projectData, ...projects]);
      setNewProject({ name: "", client_name: "", location: "" });
      setIsCreating(false);
    } catch (err) {
      console.error("Vault Write Error:", err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Permanently purge "${name}" from the vault?`)) {
      try {
        await db.projects.delete(id);
        await syncEngine.queueChange('projects', id, 'DELETE', {});
        setProjects(projects.filter(p => p.id !== id));
      } catch (err) {
        console.error("Purge Error:", err);
      }
    }
  };

  if (isInitialLoading) return (
    <div className={`flex flex-col items-center justify-center min-h-screen gap-6 ${theme === 'dark' ? 'bg-[#09090b]' : 'bg-zinc-50'}`}>
      <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
      <div className="font-black text-amber-500 uppercase tracking-[0.5em] text-xs italic">Decrypting Vault...</div>
    </div>
  );

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 selection:bg-amber-500/30
      ${theme === 'dark' ? 'bg-[#09090b] text-zinc-100' : 'bg-zinc-100 text-zinc-900'}`}>
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto p-6 sm:p-10 space-y-10">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 animate-in fade-in slide-in-from-top-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-xl shadow-lg">
                <LayoutDashboard size={20} className="text-black" />
              </div>
              <h2 className={`text-5xl font-black tracking-tighter uppercase italic leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                Workspace<span className="text-amber-500">.</span>
              </h2>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border backdrop-blur-md ${isOnline ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'} ${isOnline ? '' : 'animate-pulse'}`} />
                {isOnline ? "Cloud Sync Active" : "Offline Vault Mode"}
              </div>
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest hidden sm:block">
                User: {user?.email?.split('@')[0] || 'Guest_Surveyor'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            {!isCreating && (
              <Button onClick={() => setIsCreating(true)} leftIcon={<Plus size={18} className="stroke-[3px]" />}>
                New Project
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={handleSecureLogOut} 
              isLoading={isSigningOut}
              className="py-6 px-6"
              title="Terminate Secure Session"
            >
              <LogOut size={18} className={isSigningOut ? 'hidden' : 'text-zinc-500 group-hover:text-red-500'} />
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
          {[
            { label: 'Active Projects', value: projects.length, icon: Database, color: 'text-amber-500' },
            { label: 'Cloud Integrity', value: isOnline ? 'Verified' : 'Local', icon: Activity, color: 'text-emerald-500' },
            { label: 'Vault Access', value: 'Authorized', icon: Shield, color: 'text-blue-500' },
          ].map((stat, i) => (
            <GlassCard key={i} className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">{stat.label}</p>
                <p className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{stat.value}</p>
              </div>
              <div className={`p-3 rounded-2xl border ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'} ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </GlassCard>
          ))}
        </div>

        {isCreating && (
          <GlassCard className="p-8 border-2 border-dashed border-amber-500/20 animate-in zoom-in-95">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {(['name', 'client_name', 'location'] as const).map((key) => (
                <div key={key} className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                    {key.replace('_', ' ')}
                  </label>
                  <input
                    required
                    className={`w-full p-4 rounded-2xl border outline-none font-bold text-sm ${theme === 'dark' ? 'bg-zinc-950/50 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}
                    placeholder={`Enter ${key.replace('_', ' ')}...`}
                    value={newProject[key]}
                    onChange={(e) => setNewProject({ ...newProject, [key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-8">
              <Button onClick={handleCreateProject} leftIcon={<Check className="w-4 h-4" />}>
                Initialize Project
              </Button>
              <Button variant="ghost" onClick={() => setIsCreating(false)}>
                Discard
              </Button>
            </div>
          </GlassCard>
        )}

        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`${theme === 'dark' ? 'bg-white/2 border-zinc-800/50' : 'bg-zinc-50 border-zinc-200'} border-b`}>
                  {["Project Identity", "Stakeholder", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'dark' ? 'divide-zinc-800/30' : 'divide-zinc-200'}`}>
                {projects.length > 0 ? projects.map((p) => (
                  <tr key={p.id} className="group hover:bg-amber-500/5 transition-colors">
                    <td className="px-10 py-8">
                      <div className="flex flex-col">
                        <span className={`font-black text-xl uppercase tracking-tighter ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-900'}`}>{p.name}</span>
                        <span className="text-[9px] font-mono text-zinc-500 mt-1 uppercase">REF: {p.id.slice(0,8)}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className={`text-xs font-black uppercase ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>{p.client_name}</div>
                      <div className="text-[10px] text-zinc-500 flex items-center gap-1 uppercase font-bold mt-1">
                        <MapPin size={10} className="text-amber-500/50" /> {p.location}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase">
                        <Calendar className="w-3 h-3 text-amber-500" />
                        {new Date(p.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setOpeningId(p.id);
                            window.location.href = `/projects/${p.id}`;
                          }}
                          isLoading={openingId === p.id}
                          leftIcon={<ExternalLink size={12} />}
                        >
                          Launch
                        </Button>
                        <button onClick={() => handleDelete(p.id, p.name)} className="p-3 text-zinc-500 hover:text-red-500 transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-10 py-24 text-center opacity-30">
                      <Search size={48} className="mx-auto mb-4" />
                      <p className="text-xs font-black uppercase tracking-widest">Vault is empty for this node.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <footer className="pt-10 text-center">
           <p className={`text-[10px] font-black uppercase tracking-[0.5em] italic ${theme === 'dark' ? 'text-zinc-800' : 'text-zinc-400'}`}>
             QS POCKET KNIFE v2.0 <span className="mx-2">/</span> BUILT FOR PRECISION
           </p>
        </footer>
      </div>
    </div>
  );
};

export default DashboardPage;