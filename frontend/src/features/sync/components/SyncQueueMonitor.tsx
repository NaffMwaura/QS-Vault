/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from "react";
import {
  RefreshCw,
  Cloud,
  CloudOff,
  Database,
  Zap,
  FileUp,
  FileText,
  FileSpreadsheet,
  FileCode,
  Loader2,
  X,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { db, syncEngine } from "../../../lib/database/database";

const SyncQueueMonitor: React.FC = () => {
  const { isOnline, theme } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [localBuffer, setLocalBuffer] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkOutbox = async () => {
      try {
        const count = await db.sync_queue.count();
        setPendingCount(count);
      } catch (err) {
        console.warn("Sync Monitor: Scanning vault...", err);
      }
    };

    const interval = setInterval(checkOutbox, 2000);
    checkOutbox();
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    try {
      await syncEngine.processQueue();
      setLocalBuffer([]);
    } catch (err) {
      console.error("Manual Handshake Failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const onFileIntake = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAssets = Array.from(files).map((file) => ({
      id: Math.random().toString(36).slice(2, 11),
      name: file.name,
      type: file.name.split(".").pop()?.toUpperCase() || "FILE",
      size: `${(file.size / 1024).toFixed(1)} KB`,
    }));

    setLocalBuffer((prev) => [...newAssets, ...prev]);
  };

  return (
    <div className="theme-panel rounded-[3rem] p-8 shadow-2xl backdrop-blur-3xl transition-all duration-500">
      <div className="mb-10 flex flex-col items-start justify-between gap-6 text-left sm:flex-row sm:items-center">
        <div className="flex items-center gap-6">
          <div
            className={`theme-card relative rounded-[1.8rem] p-5 shadow-inner transition-all duration-500 ${
              pendingCount > 0 && isOnline
                ? "theme-border ring-2 ring-amber-500/20"
                : ""
            }`}
          >
            {isOnline ? (
              <Cloud
                className={
                  pendingCount > 0
                    ? "theme-total-value animate-pulse"
                    : "text-emerald-500"
                }
                size={28}
              />
            ) : (
              <CloudOff className="theme-icon" size={28} />
            )}
            <div
              className={`absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-[#09090b] ${
                isOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              }`}
            />
          </div>

          <div className="space-y-1">
            <h4 className="theme-heading text-xl font-black uppercase italic leading-none tracking-tighter">
              Cloud Sync Status
            </h4>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-sm border px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors
                  ${
                    isSyncing
                      ? "border-amber-500/20 bg-amber-500/10 text-amber-500"
                      : isOnline
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                        : "animate-pulse border-rose-500/20 bg-rose-500/10 text-rose-500"
                  }`}
              >
                {isSyncing
                  ? "Pushing Site Data..."
                  : isOnline
                    ? "System Connected"
                    : "Local Standby"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="text-right">
            <p className="theme-meta mb-2 text-[10px] font-black uppercase leading-none tracking-[0.3em]">
              Pending Records
            </p>
            <div className="flex items-baseline justify-end gap-3">
              <p
                className={`text-6xl font-black italic leading-none tracking-tighter transition-colors ${
                  pendingCount > 0
                    ? "text-amber-500"
                    : theme === "dark"
                      ? "text-zinc-800"
                      : "text-zinc-200"
                }`}
              >
                {pendingCount.toString().padStart(2, "0")}
              </p>
              {isSyncing && (
                <Loader2 size={20} className="animate-spin text-amber-500/40" />
              )}
            </div>
          </div>

          <button
            onClick={handleManualSync}
            disabled={!isOnline || isSyncing}
            className={`rounded-2xl p-5 shadow-2xl transition-all active:scale-95 ${
              !isOnline || isSyncing
                ? "theme-button-secondary cursor-not-allowed opacity-50"
                : "theme-button-primary"
            }`}
            title="Force Office Sync"
          >
            {isSyncing ? (
              <Loader2 size={24} className="animate-spin stroke-[3px]" />
            ) : (
              <RefreshCw size={24} className="stroke-[3px]" />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="theme-card group flex cursor-pointer items-center justify-between rounded-[2.5rem] border-2 border-dashed p-6 shadow-inner transition-all hover:theme-border"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="theme-panel rounded-xl p-3 transition-colors group-hover:theme-accent">
              <FileUp size={22} />
            </div>
            <div>
              <p className="theme-heading text-[11px] font-black uppercase tracking-widest">
                Upload Site Evidence
              </p>
              <p className="theme-meta mt-1 text-[9px] font-bold uppercase italic leading-none">
                Photos, PDF Reports, or Excel Specs
              </p>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileIntake}
            className="hidden"
            multiple
          />
          <Plus
            size={20}
            className="theme-icon transition-colors group-hover:theme-accent"
          />
        </div>

        {localBuffer.length > 0 && (
          <div className="animate-in fade-in slide-in-from-top-2 grid grid-cols-1 gap-4 duration-500 sm:grid-cols-2">
            {localBuffer.map((file) => (
              <div
                key={file.id}
                className="theme-card flex items-center justify-between rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-4 overflow-hidden text-left">
                  <div className="theme-accent shrink-0">
                    {file.type === "PDF" ? (
                      <FileText size={16} />
                    ) : file.type === "XLSX" || file.type === "XLS" ? (
                      <FileSpreadsheet size={16} />
                    ) : (
                      <FileCode size={16} />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="theme-heading truncate text-[10px] font-bold uppercase leading-none">
                      {file.name}
                    </p>
                    <p className="theme-meta mt-1.5 text-[8px] font-black uppercase tracking-tighter">
                      {file.size} • QUEUED FOR OFFICE
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setLocalBuffer((prev) =>
                      prev.filter((current) => current.id !== file.id),
                    )
                  }
                  className="theme-icon p-2 transition-colors hover:text-rose-500"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="theme-border/60 mt-8 flex flex-wrap items-center justify-between gap-6 border-t pt-8 opacity-40">
        <div className="flex items-center gap-3">
          <ShieldCheck size={14} className="text-emerald-500" />
          <p className="theme-meta text-[9px] font-black uppercase leading-none tracking-widest">
            {isOnline ? "Active Cloud Handshake" : "Local Vault Protection"}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Database size={12} className="theme-icon" />
            <span className="theme-meta text-[8px] font-bold uppercase tracking-widest">
              Encrypted Database
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={12} className="theme-accent" />
            <span className="theme-meta text-[8px] font-bold uppercase italic tracking-widest">
              QS OS V2.0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncQueueMonitor;
