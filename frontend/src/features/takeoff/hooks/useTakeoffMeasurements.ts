/* eslint-disable @typescript-eslint/no-unused-vars */
import { useCallback, useEffect, useState } from "react";
import { db, syncEngine } from "../../../lib/database/database";
import type { Measurement } from "../types/takeoff";

export const useTakeoffMeasurements = (projectId: string, hasUser: boolean) => {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  /** --- 1. THE PROJECT ID LOCKDOWN --- 
   * This effect handles the transition between projects.
   */
  useEffect(() => {
    let isMounted = true;

    const loadProjectData = async () => {
      if (!db || !projectId) {
        setMeasurements([]);
        setIsLoading(false);
        return;
      }

      // CRITICAL: Immediate Purge. 
      // This stops "Project A" data from showing in "Project B" while loading.
      setMeasurements([]); 
      setIsLoading(true);

      try {
        const stored = await db.measurements
          .where("project_id")
          .equals(projectId)
          .toArray();

        if (isMounted) {
          setMeasurements(stored as Measurement[]);
          console.log(`Vault: Loaded ${stored.length} nodes for project ${projectId}`);
        }
      } catch (err) {
        console.error("Vault Error: Fetch failed.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadProjectData();

    return () => {
      isMounted = false;
      // Cleanup: Clear memory when leaving the project page
      setMeasurements([]);
    };
  }, [projectId]); // Triggered every time the ID changes

  // Create a new measurement record
  const createMeasurement = useCallback(async (data: Partial<Measurement>) => {
    if (!db || !hasUser || !projectId) return;
    setSaveStatus("saving");

    const id = crypto.randomUUID();
    const entry: Measurement = {
      ...data,
      id,
      project_id: projectId, // Forced project binding
      timestamp: new Date().toISOString(),
    } as Measurement;

    try {
      await db.measurements.add(entry);
      if (syncEngine) await syncEngine.queueChange("measurements", id, "INSERT", entry);
      setMeasurements((prev) => [entry, ...prev]);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      setSaveStatus("idle");
    }
  }, [hasUser, projectId]);

  const deleteMeasurement = useCallback(async (id: string) => {
    if (!db) return;
    try {
      await db.measurements.delete(id);
      if (syncEngine) await syncEngine.queueChange("measurements", id, "DELETE", null);
      setMeasurements((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("Vault: Delete failed.");
    }
  }, []);

  return { measurements, isLoading, saveStatus, createMeasurement, deleteMeasurement };
};