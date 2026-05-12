/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { db } from "../../lib/database/database";

// Components
import TakeoffHeader from "./components/panels/TakeoffHeader";
import ReportsWorkspace from "./components/workspace/ReportsWorkspace";
import TakeoffWorkspace from "./components/workspace/TakeoffWorkspace";

// Hooks
import { useTakeoffMeasurements } from "./hooks/useTakeoffMeasurements";
import { useTakeoffWorkspace } from "./hooks/useTakeoffWorkspace";

interface ProjectTakeoffPageProps {
  projectId: string;
  projectName: string;
  onBack: () => void;
}

/** --- MAIN PAGE: THE MEASUREMENT MACHINE --- **/
const ProjectTakeoffPage: React.FC<ProjectTakeoffPageProps> = ({
  projectId,
  projectName: initialProjectName,
  onBack,
}) => {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  
  // Real Project Identity State
  const [currentProjectName, setCurrentProjectName] = useState(initialProjectName);

  // Workspace UI State (Zoom, Tools, Sections)
  const workspace = useTakeoffWorkspace();
  
  // Data State (Measurements, Storage)
  const { measurements, saveStatus, createMeasurement, deleteMeasurement } =
    useTakeoffMeasurements(projectId, Boolean(user));

  /** --- 1. IDENTITY SYNC ---
   * If the name is the placeholder "Technical Workspace", 
   * we fetch the real name from the Vault.
   */
  useEffect(() => {
    const fetchProjectName = async () => {
      if (initialProjectName === "Technical Workspace" && db) {
        const project = await db.projects.get(projectId);
        if (project?.name) setCurrentProjectName(project.name);
      }
    };
    fetchProjectName();
  }, [projectId, initialProjectName]);

  /** --- 2. ACTION: COMMIT MEASUREMENT ---
   * This is the bridge. It translates UI state into a Vault Record.
   * FIXED: Mapped 'projectId' to 'project_id' to match database.ts
   */
  const commitMeasurement = async (points: typeof workspace.currentPoints) => {
    // We calculate the value here to ensure the record is complete before hitting the hook
    let baseValue = 0;
    if (workspace.activeTool === 'length') {
      for (let i = 1; i < points.length; i++) {
        baseValue += Math.sqrt(Math.pow(points[i].x - points[i-1].x, 2) + Math.pow(points[i].y - points[i-1].y, 2));
      }
      baseValue *= workspace.scaleFactor;
    } else if (workspace.activeTool === 'area' && points.length > 2) {
      let area = 0;
      for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        area += points[i].x * points[j].y - points[j].x * points[i].y;
      }
      baseValue = Math.abs(area / 2) * (workspace.scaleFactor * workspace.scaleFactor);
    } else {
      baseValue = points.length;
    }

    let finalValue = baseValue;
    let finalUnit = workspace.activeTool === 'area' ? 'm²' : workspace.activeTool === 'count' ? 'nr' : 'm';

    // Apply Trade Rules
    if (workspace.activeSection.includes('Concrete')) {
      finalValue = baseValue * (workspace.smmParams.depth || 0.15);
      finalUnit = 'm³';
    } else if (workspace.activeSection.includes('Walling')) {
      finalValue = baseValue * (workspace.smmParams.height || 3.0);
      finalUnit = 'm²';
    }

    if (workspace.isDeductionMode) finalValue = -Math.abs(finalValue);

    await createMeasurement({
      project_id: projectId, // FIXED: Corrected property name for database.ts
      sectionCode: workspace.activeSection,
      type: workspace.activeTool === 'count' ? 'markup' : workspace.activeTool,
      points: points,
      value: finalValue,
      unit: finalUnit,
      label: `${workspace.activeSection} Node #${measurements.length + 1}`
    } as any);

    workspace.setCurrentPoints([]);
    
    if (workspace.activeTool !== "count") {
      workspace.setIsMeasuring(false);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!workspace.isMeasuring) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const nextPoints = [...workspace.currentPoints, { x, y }];

    workspace.setCurrentPoints(nextPoints);

    if (workspace.activeTool === "count") {
      void commitMeasurement(nextPoints);
    }
  };

  return (
    <div className="theme-page flex flex-col h-screen w-full overflow-hidden transition-colors duration-500 bg-[#050505]">
      <TakeoffHeader
        projectName={currentProjectName}
        onBack={onBack}
        activeWorkspace={workspace.activeWorkspace}
        onWorkspaceChange={workspace.setActiveWorkspace}
        isOnline={isOnline}
        saveStatus={saveStatus}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {workspace.activeWorkspace === "takeoff" ? (
          <TakeoffWorkspace
            // DATA BINDING
            projectId={projectId} 
            projectName={currentProjectName}
            measurements={measurements}
            onDeleteMeasurement={deleteMeasurement}
            
            // PDF VIEWPORT
            pdfDoc={workspace.pdfDoc}
            setPdfDoc={workspace.setPdfDoc}
            scale={workspace.scale}
            setScale={workspace.setScale}
            scaleFactor={workspace.scaleFactor}
            setScaleFactor={workspace.setScaleFactor}
            unit={workspace.unit}
            setUnit={workspace.setUnit}
            
            // TOOLS & STATE
            activeSection={workspace.activeSection}
            setActiveSection={workspace.setActiveSection}
            activeTool={workspace.activeTool}
            setActiveTool={workspace.setActiveTool}
            isMeasuring={workspace.isMeasuring}
            setIsMeasuring={workspace.setIsMeasuring}
            isDeductionMode={workspace.isDeductionMode}
            setIsDeductionMode={workspace.setIsDeductionMode}
            currentPoints={workspace.currentPoints}
            setCurrentPoints={workspace.setCurrentPoints}
            smmParams={workspace.smmParams}
            setSmmParams={workspace.setSmmParams}
            
            // UI LAYOUT
            leftOpen={workspace.leftOpen}
            setLeftOpen={workspace.setLeftOpen}
            rightOpen={workspace.rightOpen}
            setRightOpen={workspace.setRightOpen}
            onCanvasClick={handleCanvasClick}
          />
        ) : (
          <ReportsWorkspace
            projectId={projectId}
            projectName={currentProjectName}
            measurements={measurements}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectTakeoffPage;
