import React from "react";
import {
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  ClipboardList,
  Database,
  Hash,
  Maximize2,
  Ruler,
  Trash2,
} from "lucide-react";
import { db, syncEngine } from "../../../lib/database/database";
import type { Measurement } from "../types/takeoff";

interface TakeoffLedgerProps {
  measurements: Measurement[];
  onDelete: (id: string) => void;
  activeSection: string;
}

/** --- SUB-COMPONENT: HIGH-VISIBILITY DATA ROW --- **/
const MeasurementEntry: React.FC<{
  item: Measurement;
  onDeleteRequest: (id: string) => void;
}> = ({ item, onDeleteRequest }) => (
  <div className="theme-card p-5 sm:p-6 transition-all duration-300 group hover:scale-[1.01] relative hover:theme-border shadow-xl border border-transparent">
    <div className="flex justify-between items-start mb-5 gap-4">
      <div className="flex items-center gap-4 text-left min-w-0">
        <div className="theme-panel p-3 shrink-0 group-hover:bg-emerald-500/10 transition-colors">
          {item.type === "length" ? (
            <Ruler size={16} className="theme-accent" />
          ) : item.type === "area" ? (
            <Maximize2 size={16} className="theme-accent" />
          ) : (
            <CheckSquare size={16} className="theme-accent" />
          )}
        </div>
        <div className="text-left min-w-0">
          <p className="theme-meta text-[9px] font-black uppercase tracking-widest leading-none mb-1.5 opacity-60">
            {item.sectionCode} · {item.type}
          </p>
          <h5 className="theme-heading text-sm font-bold uppercase truncate leading-none tracking-tight">
            {item.label || "Site Record"}
          </h5>
        </div>
      </div>

      <button
        onClick={() => onDeleteRequest(item.id)}
        className="p-2.5 text-zinc-500 hover:text-rose-500 transition-colors active:scale-90 shrink-0"
        title="Delete Record"
      >
        <Trash2 size={16} />
      </button>
    </div>

    <div className="pt-5 border-t theme-border flex justify-between items-end gap-4">
      <div className="text-left min-w-0">
        <p className="theme-meta text-[8px] font-black uppercase mb-2 leading-none tracking-widest opacity-50">
          Measured Quantity
        </p>
        <p className="theme-heading text-2xl sm:text-3xl font-black tracking-tighter leading-none italic">
          {item.value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          <span className="text-sm ml-2 opacity-40 uppercase font-bold tracking-widest not-italic">
            {item.unit}
          </span>
        </p>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <span className="theme-meta text-[7px] font-mono uppercase tracking-widest leading-none opacity-40">
          REF: {item.id.slice(0, 8).toUpperCase()}
        </span>
      </div>
    </div>
  </div>
);

/** --- MAIN COMPONENT: TAKEOFF LEDGER --- **/
const TakeoffLedger: React.FC<TakeoffLedgerProps> = ({
  measurements,
  onDelete,
  activeSection,
}) => {
  const filteredMeasurements = measurements.filter(
    (item) =>
      item.sectionCode === activeSection || activeSection === "All Sections",
  );

  const handleDeleteMeasurement = async (id: string) => {
    if (db) {
      try {
        await db.measurements.delete(id);
        if (syncEngine) {
          await syncEngine.queueChange("measurements", id, "DELETE", null);
        }
      } catch (err) {
        console.error("Ledger: Access to local vault denied.", err);
      }
    }
    onDelete(id);
  };

  return (
    <aside className="theme-page w-full h-full flex flex-col p-5 sm:p-8 space-y-6 overflow-hidden transition-colors duration-500">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col gap-4 shrink-0 sm:flex-row sm:items-end sm:justify-between">
        <div className="text-left space-y-1">
          <h3 className="theme-heading text-2xl font-black italic tracking-tighter uppercase leading-none">
            Takeoff Ledger<span className="text-emerald-500">.</span>
          </h3>
          <p className="theme-meta text-[9px] font-black uppercase tracking-[0.3em] opacity-60">
            Live measurement stream for quantity capture
          </p>
        </div>
        <div className="theme-panel px-4 py-2 border theme-border flex items-center gap-3 self-start rounded-full">
          <Hash size={12} className="text-emerald-500" />
          <span className="theme-meta text-[10px] font-black tracking-widest uppercase">
            {filteredMeasurements.length} Records
          </span>
        </div>
      </div>

      {/* 2. FOCUS PANEL */}
      <div className="theme-card p-5 border-l-4 border-l-emerald-500">
        <div className="flex items-start gap-4">
          <ClipboardList
            size={18}
            className="text-emerald-500 shrink-0 mt-0.5"
          />
          <div className="text-left">
            <p className="theme-meta text-[10px] font-black uppercase tracking-[0.25em] mb-1 opacity-60">
              Operational Focus
            </p>
            <p className="theme-body text-xs sm:text-sm font-semibold leading-relaxed">
              Capture and verify measurements as you work through the drawing.
              Verified nodes are ready for immediate export to reporting
              modules.
            </p>
          </div>
        </div>
      </div>

      {/* 3. DATA GRID (Scrollable Container) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 min-h-0">
        {filteredMeasurements.length > 0 ? (
          filteredMeasurements.map((item) => (
            <MeasurementEntry
              key={item.id}
              item={item}
              onDeleteRequest={handleDeleteMeasurement}
            />
          ))
        ) : (
          <div className="theme-card border-dashed bg-transparent py-16 px-6 text-center space-y-6 opacity-40">
            <Database size={48} className="mx-auto" />
            <div className="space-y-2 max-w-xs mx-auto">
              <p className="theme-meta font-black uppercase text-xs tracking-[0.35em]">
                No Records Detected
              </p>
              <p className="theme-body text-xs font-medium">
                Upload a blueprint and start marking areas or lengths to
                populate the ledger.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4. FOOTER STATUS */}
      <div className="theme-card p-5 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={16} className="text-emerald-500" />
            <div className="text-left">
              <p className="theme-meta text-[8px] font-black uppercase tracking-widest opacity-60">
                Audit Trail Active
              </p>
              <p className="theme-body text-[11px] font-bold leading-none">
                Focus:{" "}
                <span className="text-emerald-500 uppercase">
                  {activeSection}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="theme-meta text-[8px] font-black uppercase tracking-widest opacity-40">
              Verified
            </span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default TakeoffLedger;
