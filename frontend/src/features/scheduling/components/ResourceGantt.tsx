/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Plus,
  Loader2,
  Truck,
  Navigation,
  ShieldCheck,
  X,
  TrendingUp,
  HardHat,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import Button from "../../../components/ui/Button";

/* ======================================================
    OFFICE MODULE RESOLUTION
   ====================================================== */

let useAuth: any = () => ({ theme: "light", user: { id: "temp-user" } });
let db: any = null;
let syncEngine: any = null;

const resolveModules = async () => {
  try {
    const authMod = await import("../../auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const dbMod = await import("../../../lib/database/database");
    if (dbMod.db) db = dbMod.db;
    if (dbMod.syncEngine) syncEngine = dbMod.syncEngine;
  } catch (e) {
    console.warn("Scheduling Engine: Infrastructure nodes in standby.");
  }
};

resolveModules();

/** --- TYPES --- **/
interface GanttTask {
  id: string;
  project_id: string;
  title: string;
  start_date: string;
  end_date: string;
  completion_percentage: number;
}

interface ResourceGanttProps {
  projectId: string | null;
}

const ResourceGantt: React.FC<ResourceGanttProps> = ({ projectId }) => {
  const { theme } = useAuth();

  // LIVE DATA STATES
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [logistics, setLogistics] = useState<any[]>([]);
  const [projectMeta, setProjectMeta] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [laborCount, setLaborCount] = useState(0);

  // GPS STATES
  const [isOnSite, setIsOnSite] = useState<boolean | "pending" | "no-geo">(
    "pending",
  );
  const [, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  // UI FORM STATES
  const [showStageForm, setShowStageForm] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [newStage, setNewStage] = useState({
    title: "",
    start_date: "",
    end_date: "",
  });
  const [newDelivery, setNewDelivery] = useState({
    item_name: "",
    delivery_note_ref: "",
  });

  const checkProximity = useCallback(
    (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number,
      radius: number,
    ) => {
      const R = 6371e3;
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c <= (radius || 100);
    },
    [],
  );

  const verifyLocation = useCallback(() => {
    if (!projectMeta?.lat || !projectMeta?.lng) {
      setIsOnSite("no-geo");
      return;
    }
    setIsOnSite("pending");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCurrentCoords({ lat: latitude, lng: longitude });
          const near = checkProximity(
            latitude,
            longitude,
            projectMeta.lat,
            projectMeta.lng,
            projectMeta.geofence_radius,
          );
          setIsOnSite(near);
        },
        () => setIsOnSite("no-geo"),
      );
    }
  }, [projectMeta, checkProximity]);

  const syncWorkspaceData = useCallback(async () => {
    if (!db || !projectId) {
      setTimeout(() => setIsLoading(false), 800);
      return;
    }
    try {
      setIsLoading(true);
      const [storedTasks, recentDeliveries, project, labor] = await Promise.all(
        [
          db.gantt_tasks.where("project_id").equals(projectId).toArray(),
          db.material_logistics
            .where("project_id")
            .equals(projectId)
            .reverse()
            .toArray(),
          db.projects.get(projectId),
          db.time_clocks
            ? db.time_clocks
                .where("project_id")
                .equals(projectId)
                .and((x: any) => !x.out_time)
                .count()
            : 0,
        ],
      );

      setTasks(storedTasks);
      setLogistics(recentDeliveries);
      setProjectMeta(project);
      setLaborCount(labor || 0);
    } catch (err) {
      console.error("Vault Handshake failed.");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    syncWorkspaceData();
  }, [syncWorkspaceData]);

  useEffect(() => {
    verifyLocation();
  }, [verifyLocation]);

  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !projectId || !newStage.title) return;
    const stageId = crypto.randomUUID();
    const stageData: GanttTask = {
      id: stageId,
      project_id: projectId,
      title: newStage.title,
      start_date: newStage.start_date || new Date().toISOString().split("T")[0],
      end_date: newStage.end_date || new Date().toISOString().split("T")[0],
      completion_percentage: 0,
    };
    try {
      setIsSaving(true);
      await db.gantt_tasks.add(stageData);
      if (syncEngine)
        await syncEngine.queueChange(
          "gantt_tasks",
          stageId,
          "INSERT",
          stageData,
        );
      setNewStage({ title: "", start_date: "", end_date: "" });
      setShowStageForm(false);
      syncWorkspaceData();
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProgress = async (
    taskId: string,
    current: number,
    delta: number,
  ) => {
    if (!db) return;
    const nextValue = Math.min(100, Math.max(0, current + delta));
    try {
      await db.gantt_tasks.update(taskId, { completion_percentage: nextValue });
      if (syncEngine)
        await syncEngine.queueChange("gantt_tasks", taskId, "UPDATE", {
          completion_percentage: nextValue,
        });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, completion_percentage: nextValue } : t,
        ),
      );
    } catch (e) {
      console.error("Update failed.");
    }
  };

  const handleLogDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !projectId || !newDelivery.item_name) return;
    const deliveryId = crypto.randomUUID();
    const deliveryData = {
      id: deliveryId,
      project_id: projectId,
      item_name: newDelivery.item_name,
      delivery_note_ref: newDelivery.delivery_note_ref,
      timestamp: new Date().toISOString(),
    };
    try {
      setIsSaving(true);
      await db.material_logistics.add(deliveryData);
      if (syncEngine)
        await syncEngine.queueChange(
          "material_logistics",
          deliveryId,
          "INSERT",
          deliveryData,
        );
      setNewDelivery({ item_name: "", delivery_note_ref: "" });
      setShowDeliveryForm(false);
      syncWorkspaceData();
    } finally {
      setIsSaving(false);
    }
  };

  const calculateTotalProgress = useMemo(() => {
    if (tasks.length === 0) return "0";
    const sum = tasks.reduce(
      (acc, curr) => acc + curr.completion_percentage,
      0,
    );
    return (sum / tasks.length).toFixed(0);
  }, [tasks]);

  const gpsStatusLabel =
    isOnSite === true
      ? "On Site"
      : isOnSite === false
        ? "Off Site"
        : isOnSite === "no-geo"
          ? "Geo Pending"
          : "Checking";

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-40 opacity-20 text-center">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-amber-500" />
        <p className="font-black text-[10px] uppercase tracking-[0.4em]">
          Establishing Site Connection...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 text-left pb-24">
      {/* 1. OPERATIONAL STATUS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div
          className={`p-10 rounded-[3.5rem] border shadow-2xl transition-all flex justify-between items-center
          ${theme === "dark" ? "bg-zinc-900/40 border-zinc-800 shadow-black" : "bg-white border-zinc-200 shadow-zinc-200/50"}`}
        >
          <div className="text-left">
            <p
              className={`text-[10px] font-black uppercase tracking-[0.4em] mb-2 ${theme === "dark" ? "text-zinc-600" : "text-zinc-400"}`}
            >
              Project Phase
            </p>
            <h3
              className={`text-6xl font-black italic tracking-tighter text-[var(--app-heading)]`}
            >
              {calculateTotalProgress}%
            </h3>
          </div>
          <div className="p-5 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
            <TrendingUp size={28} />
          </div>
        </div>

        <div
          className={`p-10 rounded-[3.5rem] border shadow-2xl transition-all flex justify-between items-center
          ${theme === "dark" ? "bg-zinc-900/40 border-zinc-800 shadow-black" : "bg-white border-zinc-200 shadow-zinc-200/50"}`}
        >
          <div className="text-left">
            <p
              className={`text-[10px] font-black uppercase tracking-[0.4em] mb-2 ${theme === "dark" ? "text-zinc-600" : "text-zinc-400"}`}
            >
              GPS Nodes
            </p>
            <h3
              className={`text-6xl font-black italic tracking-tighter text-[var(--app-heading)]`}
            >
              {laborCount.toString().padStart(2, "0")}
            </h3>
            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--app-meta)]">
              {gpsStatusLabel}
            </p>
          </div>
          <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
            <HardHat size={28} />
          </div>
        </div>

        <div
          className={`p-10 rounded-[3.5rem] border shadow-2xl transition-all flex justify-between items-center
          ${theme === "dark" ? "bg-zinc-900/40 border-zinc-800 shadow-black" : "bg-white border-zinc-200 shadow-zinc-200/50"}`}
        >
          <div className="text-left">
            <p
              className={`text-[10px] font-black uppercase tracking-[0.4em] mb-2 ${theme === "dark" ? "text-zinc-600" : "text-zinc-400"}`}
            >
              Daily Inflow
            </p>
            <h3
              className={`text-6xl font-black italic tracking-tighter text-[var(--app-heading)]`}
            >
              {logistics.length.toString().padStart(2, "0")}
            </h3>
          </div>
          <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <Truck size={28} />
          </div>
        </div>
      </div>

      {/* 2. MASTER TIMELINE (GANTT) */}
      <div
        className={`rounded-[3rem] theme-panel overflow-hidden border border-[var(--app-border)]`}
      >
        <div className="p-10 border-b border-[var(--app-border)] flex flex-col md:flex-row justify-between items-center gap-8 bg-[var(--app-bg-muted)]">
          <div className="text-left">
            <h3 className="text-3xl font-black uppercase italic tracking-tighter text-[var(--app-heading)]">
              Production Timeline
            </h3>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--app-meta)]">
              Updating Site Progress Stages
            </p>
          </div>
          <button
            onClick={() => setShowStageForm(!showStageForm)}
            className="px-10 py-6 bg-amber-500 text-black font-black uppercase text-xs rounded-2xl italic tracking-widest shadow-xl hover:bg-amber-400 transition-all flex items-center gap-4"
          >
            {showStageForm ? (
              <X size={20} />
            ) : (
              <Plus size={20} strokeWidth={3} />
            )}
            {showStageForm ? "Close Editor" : "Register Stage"}
          </button>
        </div>

        {showStageForm && (
          <form
            onSubmit={handleAddStage}
            className="p-12 bg-black/10 border-b border-amber-500/20 animate-in slide-in-from-top-4 space-y-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest italic">
                  Work Stage Identifier
                </label>
                <input
                  required
                  placeholder="e.g. Ground Floor Slab"
                  value={newStage.title}
                  onChange={(e) =>
                    setNewStage({ ...newStage, title: e.target.value })
                  }
                  className="w-full h-20 px-8 rounded-3xl border bg-transparent text-white font-bold text-xl outline-none border-zinc-800 focus:border-amber-500 transition-all"
                />
              </div>
              <div className="space-y-4 text-left">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest italic">
                  Start Date
                </label>
                <input
                  type="date"
                  value={newStage.start_date}
                  onChange={(e) =>
                    setNewStage({ ...newStage, start_date: e.target.value })
                  }
                  className="w-full h-20 px-8 rounded-3xl border bg-transparent text-white font-bold text-sm outline-none border-zinc-800 focus:border-amber-500 transition-all"
                />
              </div>
              <div className="space-y-4 text-left">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest italic">
                  Target Delivery
                </label>
                <input
                  type="date"
                  value={newStage.end_date}
                  onChange={(e) =>
                    setNewStage({ ...newStage, end_date: e.target.value })
                  }
                  className="w-full h-20 px-8 rounded-3xl border bg-transparent text-white font-bold text-sm outline-none border-zinc-800 focus:border-amber-500 transition-all"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full h-24 bg-amber-500 text-black font-black uppercase text-sm tracking-[0.5em] rounded-4xl shadow-amber-500/20 flex items-center justify-center gap-6 italic transition-all"
            >
              <CheckCircle2 size={32} strokeWidth={2.5} /> Secure Stage Entry
            </button>
          </form>
        )}

        <div className="p-12 space-y-16">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <div key={task.id} className="space-y-6 group">
                <div className="flex justify-between items-end">
                  <div className="text-left space-y-2">
                    <div className="flex items-center gap-4">
                      <span
                        className={`text-xl font-black uppercase tracking-tight group-hover:text-amber-500 transition-colors text-[var(--app-heading)]`}
                      >
                        {task.title}
                      </span>
                      <span className="px-2 py-0.5 rounded border border-zinc-800 text-[8px] font-mono uppercase text-zinc-600">
                        {task.id.slice(0, 8)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">
                      <div className="flex items-center gap-2">
                        <Calendar size={12} /> {task.start_date}
                      </div>
                      <ChevronRight size={12} />
                      <div className="flex items-center gap-2">
                        <Clock size={12} /> {task.end_date}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          handleUpdateProgress(
                            task.id,
                            task.completion_percentage,
                            -5,
                          )
                        }
                        className="w-10 h-10 rounded border border-zinc-800 hover:border-amber-500 text-zinc-500"
                      >
                        -
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateProgress(
                            task.id,
                            task.completion_percentage,
                            5,
                          )
                        }
                        className="w-10 h-10 rounded border border-zinc-800 hover:border-amber-500 text-zinc-500"
                      >
                        +
                      </button>
                    </div>
                    <span
                      className={`text-4xl font-black italic tracking-tighter w-24 text-right ${task.completion_percentage < 30 ? "text-rose-500" : "text-amber-500"}`}
                    >
                      {task.completion_percentage}%
                    </span>
                  </div>
                </div>

                <div className="relative h-10 bg-black/20 rounded-xl overflow-hidden shadow-inner group-hover:border-amber-500/50 transition-all border border-transparent">
                  <div
                    className={`h-full transition-all duration-700 ease-out relative ${task.completion_percentage < 30 ? "bg-rose-500" : "bg-amber-500"}`}
                    style={{ width: `${task.completion_percentage}%` }}
                  >
                    <div className="absolute inset-0 bg-white/10 animate-pulse" />
                  </div>
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-3 opacity-20">
                    <ShieldCheck size={16} className="text-white" />
                    <span className="text-[10px] font-mono text-white font-bold uppercase tracking-widest leading-none">
                      SECURE_PHASE
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center opacity-40 flex flex-col items-center gap-6">
              <Calendar size={80} />
              <p className="font-black uppercase text-sm tracking-widest italic">
                No Active Timeline Nodes
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. MATERIAL & GPS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div
          className={`p-10 rounded-[3rem] border shadow-2xl transition-all ${theme === "dark" ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-200"}`}
        >
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
              <Truck size={24} className="text-amber-500" />
              <h4 className="text-xl font-black uppercase italic tracking-tighter text-[var(--app-heading)]">
                Site Arrivals
              </h4>
            </div>
            <button
              onClick={() => setShowDeliveryForm(!showDeliveryForm)}
              className="p-3 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black transition-all"
            >
              <Plus size={18} />
            </button>
          </div>

          {showDeliveryForm && (
            <form
              onSubmit={handleLogDelivery}
              className="mb-10 p-6 rounded-[2rem] border border-amber-500/20 space-y-6 animate-in slide-in-from-top-4"
            >
              <input
                placeholder="Item (e.g. 50 Tons Sand)"
                value={newDelivery.item_name}
                onChange={(e) =>
                  setNewDelivery({ ...newDelivery, item_name: e.target.value })
                }
                className="w-full p-5 rounded-2xl bg-black/20 border border-zinc-800 text-white outline-none focus:border-amber-500"
              />
              <input
                placeholder="Delivery Note REF"
                value={newDelivery.delivery_note_ref}
                onChange={(e) =>
                  setNewDelivery({
                    ...newDelivery,
                    delivery_note_ref: e.target.value,
                  })
                }
                className="w-full p-5 rounded-2xl bg-black/20 border border-zinc-800 text-white outline-none focus:border-amber-500"
              />
              <Button
                type="submit"
                variant="primary"
                isLoading={isSaving}
                className="w-full py-5 rounded-2xl"
              >
                Record Delivery
              </Button>
            </form>
          )}

          <div className="space-y-4">
            {logistics.length > 0 ? (
              logistics.map((log) => (
                <div
                  key={log.id}
                  className="p-6 rounded-2xl border border-zinc-800 flex justify-between items-center group hover:border-amber-500 transition-all"
                >
                  <div className="text-left">
                    <p className="text-[9px] font-black uppercase text-amber-500 mb-1 tracking-widest">
                      Verified Material
                    </p>
                    <h5 className="font-black uppercase text-[var(--app-heading)] tracking-tight mb-1">
                      {log.item_name}
                    </h5>
                    <p className="text-[8px] font-mono text-zinc-500 uppercase">
                      D.Note: {log.delivery_note_ref || "NO_REF"}
                    </p>
                  </div>
                  <CheckCircle2 size={18} className="text-emerald-500" />
                </div>
              ))
            ) : (
              <p className="text-[10px] font-black uppercase text-zinc-500 text-center py-10">
                No recent arrival nodes
              </p>
            )}
          </div>
        </div>

        <div
          className={`p-10 rounded-[3rem] border shadow-2xl transition-all text-center ${theme === "dark" ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-200"}`}
        >
          <div className="flex items-center gap-4 mb-10 text-left">
            <Navigation size={24} className="text-blue-500" />
            <h4 className="text-xl font-black uppercase italic tracking-tighter text-[var(--app-heading)]">
              GPS Geofence Node
            </h4>
          </div>
          <div className="relative w-40 h-40 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full animate-ping" />
            <div className="absolute inset-6 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center">
              <Navigation size={40} className="text-blue-500" />
            </div>
          </div>
          <h5 className="text-5xl font-black italic tracking-tighter text-[var(--app-heading)] leading-none mb-2">
            {laborCount.toString().padStart(2, "0")} Active
          </h5>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-8">
            Verified Personnel on Site
          </p>
          <div className="pt-8 border-t border-zinc-800 flex justify-between items-center opacity-40">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span className="text-[9px] font-black uppercase">
                Sync Link Active
              </span>
            </div>
            <span className="text-[9px] font-mono">ID: SITE-B-ALPHA</span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="pt-12 border-t border-zinc-800 flex items-center justify-between opacity-30">
        <div className="flex items-center gap-3">
          <AlertCircle size={14} className="text-amber-500" />
          <p className="text-[9px] font-black uppercase tracking-widest">
            Resource Monitoring Active
          </p>
        </div>
        <p className="text-[9px] font-mono uppercase tracking-tighter text-right">
          SCHEDULER_V4.0 • GPS_GEOFENCE: ARMED
        </p>
      </div>
    </div>
  );
};

export default ResourceGantt;
