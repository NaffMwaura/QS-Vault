import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileEdit,
  Trash2,
  Loader2,
  HardHat,
  X,
  ShieldCheck,
  DollarSign,
  Calculator,
  ArrowRight,
} from "lucide-react";
import Button from "../../../components/ui/Button";
import { useAuth } from "../../auth/AuthContext";
import { db, syncEngine } from "../../../lib/database/database";

interface Variation {
  id: string;
  project_id: string;
  site_log_id: string | null;
  description: string;
  qs_pricing_status: "unpriced" | "pending" | "approved";
  estimated_cost: number;
  approved_sum?: number;
  created_at: string;
}

interface VariationBridgeProps {
  projectId: string | null;
}

const VariationBridge: React.FC<VariationBridgeProps> = ({ projectId }) => {
  const { user, theme } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(projectId);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [newVariation, setNewVariation] = useState({
    description: "",
    estimated_cost: 0,
  });

  useEffect(() => {
    setSelectedId(projectId);
  }, [projectId]);

  const syncBridgeData = useCallback(async () => {
    if (!user) {
      setTimeout(() => setIsLoading(false), 800);
      return;
    }

    try {
      setIsLoading(true);

      let activeProjectId = selectedId;
      if (!activeProjectId) {
        const projects = await db.projects.where("user_id").equals(user.id).toArray();
        activeProjectId = projects[0]?.id ?? null;
        if (activeProjectId) setSelectedId(activeProjectId);
      }

      if (!activeProjectId) {
        setVariations([]);
        return;
      }

      const storedVariations = await db.variations
        .where("project_id")
        .equals(activeProjectId)
        .reverse()
        .toArray();

      setVariations(storedVariations);
    } catch (err) {
      console.error("Bridge Engine: Vault access failed.", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedId, user]);

  useEffect(() => {
    syncBridgeData();
  }, [syncBridgeData]);

  const handleLogChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !user) return;

    setIsSaving(true);
    const variationId = crypto.randomUUID();
    const variationData: Variation = {
      id: variationId,
      project_id: selectedId,
      site_log_id: null,
      description: newVariation.description,
      estimated_cost: newVariation.estimated_cost,
      qs_pricing_status: "unpriced",
      created_at: new Date().toISOString(),
    };

    try {
      await db.variations.add(variationData);
      await syncEngine.queueChange("variations", variationId, "INSERT", variationData);
      setNewVariation({ description: "", estimated_cost: 0 });
      setShowAddForm(false);
      setShowSavedToast(true);
      await syncBridgeData();
      setTimeout(() => setShowSavedToast(false), 3000);
    } catch (err) {
      console.error("Variation save failed.", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Permanently erase this site change record?")) return;
    await db.variations.delete(id);
    await syncEngine.queueChange("variations", id, "DELETE", null);
    await syncBridgeData();
  };

  const totals = useMemo(() => {
    const unpriced = variations.filter(
      (variation) => variation.qs_pricing_status === "unpriced",
    ).length;
    const value = variations.reduce(
      (acc, current) => acc + (current.estimated_cost || 0),
      0,
    );
    return { unpriced, value };
  }, [variations]);

  const unpricedCount = totals.unpriced;
  const totalPotentialValue = totals.value;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-40 opacity-30">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-amber-500" />
        <p
          className={`text-[10px] font-black uppercase tracking-[0.5em] ${
            theme === "dark" ? "text-zinc-500" : "text-zinc-950"
          }`}
        >
          Syncing Change Ledger...
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-12 pb-10 text-left duration-700">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="theme-card flex items-center justify-between rounded-[2.5rem] p-8 shadow-2xl transition-all duration-500">
          <div className="space-y-2 text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
              Unpriced Changes
            </p>
            <p
              className={`text-4xl font-black italic tracking-tighter ${
                unpricedCount > 0 ? "text-[var(--app-accent-strong)]" : "text-zinc-500"
              }`}
            >
              {unpricedCount.toString().padStart(2, "0")} Nodes
            </p>
          </div>
          <div
            className={`rounded-3xl border p-6 text-amber-500 shadow-lg ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-950"
                : "border-zinc-100 bg-zinc-50"
            }`}
          >
            <AlertCircle size={32} strokeWidth={2.5} />
          </div>
        </div>

        <div className="theme-card flex items-center justify-between rounded-[2.5rem] p-8 shadow-2xl transition-all duration-500">
          <div className="space-y-2 text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
              Estimated Value
            </p>
            <p className="text-4xl font-black italic tracking-tighter text-[var(--app-heading)]">
              KES {(totalPotentialValue / 1000).toFixed(1)}k
            </p>
          </div>
          <div
            className={`rounded-3xl border p-6 text-emerald-500 shadow-lg ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-950"
                : "border-zinc-100 bg-zinc-50"
            }`}
          >
            <TrendingUp size={32} strokeWidth={2.5} />
          </div>
        </div>
      </div>

      <div className="theme-panel overflow-hidden rounded-[3.5rem] outline-none transition-all duration-500">
        <div className="flex flex-col items-start justify-between gap-8 border-b border-[var(--app-border)] bg-white/1 p-10 md:flex-row md:items-center">
          <div className="space-y-2 text-left">
            <h3 className="text-3xl font-black uppercase italic leading-none tracking-tighter text-[var(--app-heading)]">
              Site Change Bridge
            </h3>
            <p className="text-[10px] font-black uppercase italic tracking-[0.4em] text-[var(--app-meta)]">
              Syncing site events with QS valuations
            </p>
          </div>
          <div className="flex items-center gap-4">
            {showSavedToast && (
              <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                <ShieldCheck size={14} />
                Saved
              </div>
            )}
            <button
              onClick={() => setShowAddForm((current) => !current)}
              className="flex items-center gap-4 rounded-2xl bg-amber-500 px-10 py-6 text-xs font-black uppercase italic tracking-[0.2em] text-black shadow-2xl shadow-amber-500/20 transition-all hover:bg-amber-400 active:scale-95"
            >
              {showAddForm ? <X size={22} /> : <Plus size={22} strokeWidth={3} />}
              {showAddForm ? "Close Editor" : "Log Site Change"}
            </button>
          </div>
        </div>

        {showAddForm && (
          <form
            onSubmit={handleLogChange}
            className="animate-in slide-in-from-top-4 space-y-8 border-b border-amber-500/20 bg-amber-500/5 p-10"
          >
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <label className="ml-2 text-[10px] font-black uppercase tracking-widest text-[var(--app-meta)]">
                  Description of Change
                </label>
                <input
                  required
                  placeholder="e.g. Relocating foundation due to rock..."
                  value={newVariation.description}
                  onChange={(e) =>
                    setNewVariation({
                      ...newVariation,
                      description: e.target.value,
                    })
                  }
                  className="theme-input w-full rounded-2xl border p-6 font-bold outline-none transition-all focus:border-[var(--app-accent-strong)]"
                />
              </div>
              <div className="space-y-3">
                <label className="ml-2 text-[10px] font-black uppercase tracking-widest text-[var(--app-meta)]">
                  Site Estimate (KES)
                </label>
                <div className="relative">
                  <DollarSign
                    className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--app-meta)]"
                    size={18}
                  />
                  <input
                    type="number"
                    placeholder="0"
                    value={newVariation.estimated_cost || ""}
                    onChange={(e) =>
                      setNewVariation({
                        ...newVariation,
                        estimated_cost: Number.parseInt(e.target.value || "0", 10),
                      })
                    }
                    className="theme-input w-full rounded-2xl border p-6 pl-14 text-xl font-black outline-none transition-all focus:border-[var(--app-accent-strong)]"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <Button
                type="submit"
                isLoading={isSaving}
                className="flex-1 py-6 italic"
                leftIcon={<Calculator size={18} />}
              >
                Send to QS for Pricing
              </Button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="theme-button-secondary rounded-2xl px-10 text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-8 p-12">
          {variations.length > 0 ? (
            variations.map((variation) => (
              <div
                key={variation.id}
                className="theme-card group flex flex-col items-start justify-between gap-8 rounded-[2.5rem] p-8 transition-all hover:border-[var(--app-accent-strong)] md:flex-row md:items-center"
              >
                <div className="flex-1 space-y-4 text-left">
                  <div className="flex items-center gap-4">
                    <div
                      className={`rounded-xl border p-3 ${
                        variation.qs_pricing_status === "unpriced"
                          ? "theme-status-error"
                          : "theme-status-online"
                      }`}
                    >
                      <FileEdit size={16} />
                    </div>
                    <span className="text-[10px] font-mono uppercase italic tracking-widest text-[var(--app-meta)]">
                      REF: {variation.id.slice(0, 8)}
                    </span>
                  </div>
                  <h4 className="text-xl font-black uppercase leading-tight tracking-tight text-[var(--app-heading)] transition-colors group-hover:text-[var(--app-primary-bg)]">
                    {variation.description}
                  </h4>
                  <div className="flex items-center gap-6 opacity-40 text-[var(--app-heading)]">
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {new Date(variation.created_at).toDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HardHat size={16} />
                      <span className="text-[10px] font-black uppercase italic leading-none tracking-widest">
                        Logged by Field Node
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end md:self-auto">
                  <div className="space-y-1 text-right">
                    <p className="text-[9px] font-black uppercase leading-none tracking-widest text-[var(--app-meta)]">
                      Rough Estimate
                    </p>
                    <p className="text-2xl font-black italic tracking-tighter text-[var(--app-accent-strong)]">
                      KES {variation.estimated_cost.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(variation.id)}
                    className="theme-button-secondary rounded-2xl p-4 text-rose-500 shadow-inner transition-all hover:bg-rose-500/10"
                    title="Delete Variation"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button className="theme-button-secondary rounded-2xl border-[var(--app-border)] p-4 shadow-inner transition-all hover:bg-[color-mix(in_srgb,var(--app-secondary-fg)_10%,transparent)]">
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center gap-6 py-20 text-center opacity-10 text-[var(--app-heading)]">
              <BarChart3 size={80} />
              <p className="text-sm font-black uppercase italic tracking-[0.5em]">
                Change Ledger is Empty
              </p>
            </div>
          )}
        </div>

        <div className="theme-panel flex items-center justify-between border-t border-[var(--app-border)] p-8 opacity-30 shadow-none">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={14} className="text-[var(--app-success)]" />
            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--app-meta)]">
              Infrastructure Watch Active
            </p>
          </div>
          <p className="text-[9px] font-mono uppercase tracking-tighter text-[var(--app-meta)]">
            SECURE_BRIDGE_PROTOCOL_v4.5
          </p>
        </div>
      </div>

      <footer className="flex select-none flex-col items-center gap-8 pb-12 pt-24 text-center opacity-20">
        <div className="h-px w-80 bg-zinc-800" />
        <p className="text-center text-[11px] font-black uppercase italic leading-none tracking-[2em] text-zinc-600">
          CHANGE MONITOR ENGINE • QS VAULT
        </p>
      </footer>
    </div>
  );
};

export default VariationBridge;
