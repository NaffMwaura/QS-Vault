import React from "react";
import { useAuth } from "../auth/AuthContext";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import TakeoffHeader from "./components/panels/TakeoffHeader";
import ReportsWorkspace from "./components/workspace/ReportsWorkspace";
import TakeoffWorkspace from "./components/workspace/TakeoffWorkspace";
import { useTakeoffMeasurements } from "./hooks/useTakeoffMeasurements";
import { useTakeoffWorkspace } from "./hooks/useTakeoffWorkspace";

interface ProjectTakeoffPageProps {
  projectId: string;
  projectName: string;
  onBack: () => void;
}

const ProjectTakeoffPage: React.FC<ProjectTakeoffPageProps> = ({
  projectId,
  projectName,
  onBack,
}) => {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  const workspace = useTakeoffWorkspace();
  const { measurements, saveStatus, createMeasurement, deleteMeasurement } =
    useTakeoffMeasurements(projectId, Boolean(user));

  const commitMeasurement = async (points: typeof workspace.currentPoints) => {
    await createMeasurement({
      projectId,
      activeSection: workspace.activeSection,
      activeTool: workspace.activeTool,
      points,
      scaleFactor: workspace.scaleFactor,
      smmParams: workspace.smmParams,
      isDeductionMode: workspace.isDeductionMode,
    });

    workspace.setCurrentPoints([]);
    if (workspace.activeTool !== "count") {
      workspace.setIsMeasuring(false);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!workspace.isMeasuring) {
      return;
    }

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
    <div className="theme-page flex flex-col h-screen w-full overflow-hidden transition-colors duration-500">
      <TakeoffHeader
        projectName={projectName}
        onBack={onBack}
        activeWorkspace={workspace.activeWorkspace}
        onWorkspaceChange={workspace.setActiveWorkspace}
        isOnline={isOnline}
        saveStatus={saveStatus}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {workspace.activeWorkspace === "takeoff" ? (
          <TakeoffWorkspace
            pdfDoc={workspace.pdfDoc}
            setPdfDoc={workspace.setPdfDoc}
            scale={workspace.scale}
            setScale={workspace.setScale}
            scaleFactor={workspace.scaleFactor}
            setScaleFactor={workspace.setScaleFactor}
            unit={workspace.unit}
            setUnit={workspace.setUnit}
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
            measurements={measurements}
            smmParams={workspace.smmParams}
            setSmmParams={workspace.setSmmParams}
            leftOpen={workspace.leftOpen}
            setLeftOpen={workspace.setLeftOpen}
            rightOpen={workspace.rightOpen}
            setRightOpen={workspace.setRightOpen}
            onCanvasClick={handleCanvasClick}
            onDeleteMeasurement={deleteMeasurement}
          />
        ) : (
          <ReportsWorkspace
            projectId={projectId}
            projectName={projectName}
            measurements={measurements}
          />
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
      `}</style>
    </div>
  );
};

export default ProjectTakeoffPage;
