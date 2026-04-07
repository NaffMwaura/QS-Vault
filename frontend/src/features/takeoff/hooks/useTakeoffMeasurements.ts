import { useCallback, useEffect, useState } from "react";
import { db, syncEngine } from "../../../lib/database/database";
import type {
  Measurement,
  MeasurementTool,
  Point,
  SmmParams,
} from "../types/takeoff";

interface CreateMeasurementInput {
  projectId: string;
  activeSection: string;
  activeTool: MeasurementTool;
  points: Point[];
  scaleFactor: number;
  smmParams: SmmParams;
  isDeductionMode: boolean;
}

export const useTakeoffMeasurements = (
  projectId: string,
  hasUser: boolean,
) => {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );

  useEffect(() => {
    const loadVault = async () => {
      if (!db || !projectId) {
        setIsLoading(false);
        return;
      }

      try {
        const stored = await db.measurements
          .where("project_id")
          .equals(projectId)
          .toArray();
        setMeasurements(stored as unknown as Measurement[]);
      } finally {
        setIsLoading(false);
      }
    };

    loadVault();
  }, [projectId]);

  const deleteMeasurement = useCallback((id: string) => {
    setMeasurements((current) => current.filter((item) => item.id !== id));
  }, []);

  const createMeasurement = useCallback(
    async ({
      projectId,
      activeSection,
      activeTool,
      points,
      scaleFactor,
      smmParams,
      isDeductionMode,
    }: CreateMeasurementInput) => {
      if (!db || !hasUser) {
        return;
      }

      setSaveStatus("saving");

      const id = crypto.randomUUID();
      const rawVal = points.length * scaleFactor;
      let finalVal = rawVal;

      if (activeSection.includes("Concrete")) {
        finalVal = rawVal * smmParams.depth;
      }

      if (activeSection.includes("Walling")) {
        finalVal = rawVal * smmParams.height;
      }

      const currentCount = measurements.length + 1;
      const entry: Measurement = {
        id,
        project_id: projectId,
        label: `${activeSection} Node #${currentCount}`,
        type: activeTool,
        value:
          finalVal *
          (1 + smmParams.waste / 100) *
          (isDeductionMode ? -1 : 1),
        unit: activeSection.includes("Concrete")
          ? "m3"
          : activeTool === "area"
            ? "m2"
            : "m",
        sectionCode: activeSection,
        points,
        timestamp: new Date().toISOString(),
      };

      try {
        await db.measurements.add(entry as typeof entry & { bill_item_id: null });

        if (syncEngine) {
          await syncEngine.queueChange(
            "measurements",
            id,
            "INSERT",
            entry as typeof entry & { bill_item_id: null },
          );
        }

        setMeasurements((current) => [entry, ...current]);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("idle");
      }
    },
    [hasUser, measurements.length],
  );

  return {
    measurements,
    isLoading,
    saveStatus,
    createMeasurement,
    deleteMeasurement,
  };
};
