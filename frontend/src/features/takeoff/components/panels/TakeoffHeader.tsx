import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Wifi,
  WifiOff,
} from "lucide-react";
import type { ActiveWorkspace } from "../../types/takeoff";

interface TakeoffHeaderProps {
  projectName: string;
  onBack: () => void;
  activeWorkspace: ActiveWorkspace;
  onWorkspaceChange: (workspace: ActiveWorkspace) => void;
  isOnline: boolean;
  saveStatus: "idle" | "saving" | "saved";
}

const TakeoffHeader = ({
  projectName,
  onBack,
  activeWorkspace,
  onWorkspaceChange,
  isOnline,
  saveStatus,
}: TakeoffHeaderProps) => {
  return (
    <header className="theme-surface-overlay px-4 sm:px-6 py-4 border-b shrink-0 z-40 backdrop-blur-2xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4 sm:gap-6">
        <button
          onClick={onBack}
          className="p-3 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-zinc-500 transition-all active:scale-90"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-left">
          <p className="text-[9px] font-black uppercase text-amber-500 tracking-[0.2em] leading-none mb-1">
            Technical Workspace
          </p>
          <h2 className="text-sm font-black uppercase tracking-tight leading-none truncate max-w-[200px]">
            {projectName}
          </h2>
        </div>
        <div className="hidden md:flex bg-zinc-950/40 p-1.5 rounded-2xl border border-zinc-800/60 ml-2">
          <button
            onClick={() => onWorkspaceChange("takeoff")}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${
              activeWorkspace === "takeoff"
                ? "bg-amber-500 text-black shadow-lg"
                : "text-zinc-500 hover:text-zinc-200"
            }`}
          >
            Takeoff
          </button>
          <button
            onClick={() => onWorkspaceChange("reports")}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${
              activeWorkspace === "reports"
                ? "bg-amber-500 text-black shadow-lg"
                : "text-zinc-500 hover:text-zinc-200"
            }`}
          >
            Reports
          </button>
        </div>
      </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex md:hidden bg-zinc-950/40 p-1.5 rounded-2xl border border-zinc-800/60">
              <button
                onClick={() => onWorkspaceChange("takeoff")}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                  activeWorkspace === "takeoff"
                    ? "bg-amber-500 text-black shadow-lg"
                    : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                Takeoff
              </button>
              <button
                onClick={() => onWorkspaceChange("reports")}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                  activeWorkspace === "reports"
                    ? "bg-amber-500 text-black shadow-lg"
                    : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                Reports
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className={`px-4 py-2.5 rounded-2xl border flex items-center gap-3 transition-all ${
                isOnline
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-500 animate-pulse"
              }`}
            >
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span className="text-[9px] font-black uppercase hidden sm:block">
                {isOnline ? "Synced" : "Offline"}
              </span>
            </div>
            <div
              className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl border font-black text-[10px] uppercase shadow-xl ${
                saveStatus === "saved"
                  ? "bg-emerald-500 border-emerald-600 text-black"
                  : "bg-zinc-900 border-zinc-800 text-zinc-500"
              }`}
            >
              {saveStatus === "saving" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ShieldCheck size={14} />
              )}
              <span>
                {saveStatus === "saving"
                  ? "Vaulting..."
                  : saveStatus === "saved"
                    ? "Secured"
                    : "Armed"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TakeoffHeader;
