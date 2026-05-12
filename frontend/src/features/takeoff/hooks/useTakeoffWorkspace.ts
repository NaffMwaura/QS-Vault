import { useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import type {
  ActiveWorkspace,
  MeasurementTool,
  Point,
  SmmParams,
} from "../types/takeoff";

/** --- THE UI ENGINE: TAKEOFF STATE CONTROLLER --- **/
export const useTakeoffWorkspace = () => {
  // Viewport & Document State
  const [activeWorkspace, setActiveWorkspace] = useState<ActiveWorkspace>("takeoff");
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  
  // Calibration & Scaling
  const [scale, setScale] = useState(1); // Visual Zoom
  const [scaleFactor, setScaleFactor] = useState(0.01); // Real-world ratio (e.g., 1:100)
  const [unit, setUnit] = useState<"m" | "mm">("m");

  // Tooling & Measurement State
  const [activeSection, setActiveSection] = useState("Concrete Work");
  const [activeTool, setActiveTool] = useState<MeasurementTool>("area");
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [isDeductionMode, setIsDeductionMode] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);

  // SMM-KE (Kenya Standard) Parameters
  const [smmParams, setSmmParams] = useState<SmmParams>({
    depth: 0.15,
    height: 3.0,
    waste: 5,
  });

  // Workspace Layout (Panel Controls)
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  return {
    // Navigation
    activeWorkspace,
    setActiveWorkspace,
    
    // PDF Logic
    pdfDoc,
    setPdfDoc,
    scale,
    setScale,
    scaleFactor,
    setScaleFactor,
    unit,
    setUnit,
    
    // Takeoff Tools
    activeSection,
    setActiveSection,
    activeTool,
    setActiveTool,
    isMeasuring,
    setIsMeasuring,
    isDeductionMode,
    setIsDeductionMode,
    currentPoints,
    setCurrentPoints,
    
    // Engineering Specs
    smmParams,
    setSmmParams,
    
    // Layout
    leftOpen,
    setLeftOpen,
    rightOpen,
    setRightOpen,
  };
};