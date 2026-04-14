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

const MeasurementEntry: React.FC<{
  item: Measurement;
  onDeleteRequest: (id: string) => void;
}> = ({ item, onDeleteRequest }) => (
  <div className="theme-card p-5 sm:p-6 transition-all duration-300 group hover:scale-[1.01] relative hover:theme-border shadow-xl">
    <div className="flex justify-between items-start mb-5 gap-4">
      <div className="flex items-center gap-4 text-left min-w-0">
        <div className="theme-panel p-3 shrink-0 group-hover:theme-accent">
          {item.type === "length" ? (
            <Ruler size={16} />
          ) : item.type === "area" ? (
            <Maximize2 size={16} />
          ) : (
            <CheckSquare size={16} />
          )}
        </div>
        <div className="text-left min-w-0">
          <p className="theme-meta text-[9px] font-black uppercase tracking-widest leading-none mb-1.5">
            {item.sectionCode} · {item.type}
          </p>
          <h5 className="theme-heading text-sm uppercase truncate leading-none tracking-tight">
            {item.label || "Site Record"}
          </h5>
        </div>
      </div>

      <button
        onClick={() => onDeleteRequest(item.id)}
        className="p-2.5 theme-icon hover:text-rose-500 transition-colors active:scale-90 shrink-0"
        title="Delete Record"
      >
        <Trash2 size={16} />
      </button>
    </div>

    <div className="pt-5 border-t theme-border flex justify-between items-end gap-4">
      <div className="text-left min-w-0">
        <p className="theme-meta text-[8px] font-black uppercase mb-2 leading-none tracking-widest">
          Measured Quantity
        </p>
        <p className="theme-total-value text-2xl sm:text-3xl font-black tracking-tighter leading-none italic">
          {item.value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          <span className="text-[10px] ml-1.5 opacity-40 not-italic uppercase font-bold">
            {item.unit}
          </span>
        </p>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <span className="theme-meta text-[7px] font-mono uppercase tracking-widest leading-none">
          REF: {item.id.slice(0, 8).toUpperCase()}
        </span>
      </div>
    </div>
  </div>
);

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
    <aside className="theme-page w-full h-full flex flex-col p-5 sm:p-8 space-y-6 sm:space-y-8 overflow-hidden transition-colors duration-500">
      <div className="flex flex-col gap-4 shrink-0 sm:flex-row sm:items-end sm:justify-between">
        <div className="text-left space-y-1">
          <h3 className="theme-heading text-2xl font-black italic tracking-tighter uppercase leading-none">
            Takeoff Ledger<span className="theme-accent">.</span>
          </h3>
          <p className="theme-meta text-[9px] font-black uppercase tracking-[0.3em]">
            Live measurement stream for quantity capture and review
          </p>
        </div>
        <div className="theme-panel px-4 py-2 flex items-center gap-3 self-start">
          <Hash size={12} className="theme-accent" />
          <span className="theme-meta text-[10px] font-black tracking-widest uppercase">
            {filteredMeasurements.length} Records
          </span>
        </div>
      </div>

      <div className="theme-panel p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <ClipboardList size={18} className="theme-accent mt-0.5 shrink-0" />
          <div className="text-left">
            <p className="theme-meta text-[10px] font-black uppercase tracking-[0.25em]">
              Current Focus
            </p>
            <p className="theme-body text-sm font-bold">
              Capture and verify measurements as you work through the drawing and prepare them for reporting.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 sm:pr-3 space-y-4">
        {filteredMeasurements.length > 0 ? (
          filteredMeasurements.map((item) => (
            <MeasurementEntry
              key={item.id}
              item={item}
              onDeleteRequest={handleDeleteMeasurement}
            />
          ))
        ) : (
          <div className="theme-card border-dashed bg-transparent py-16 px-6 text-center space-y-6">
            <Database size={52} className="mx-auto theme-icon" />
            <div className="space-y-3 max-w-md mx-auto">
              <p className="theme-meta font-black uppercase text-xs tracking-[0.35em]">
                No Records Yet
              </p>
              <p className="theme-body text-sm font-semibold">
                Upload a drawing, confirm the scale, then start marking quantities for the active work section.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="theme-card p-5 shrink-0 text-left">
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle size={16} className="theme-accent opacity-70" />
          <p className="theme-meta text-[10px] font-black uppercase tracking-widest">
            Audit Trail Active
          </p>
        </div>
        <div className="flex items-center justify-between gap-4">
          <p className="theme-body text-[11px] font-bold leading-snug">
            Active section:{" "}
            <span className="theme-accent italic uppercase">
              {activeSection}
            </span>
          </p>
          <CheckCircle2 size={14} className="theme-icon shrink-0 text-emerald-500" />
        </div>
      </div>
    </aside>
  );
};

export default TakeoffLedger;
