import { useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import type {
  ActiveWorkspace,
  MeasurementTool,
  Point,
  SmmParams,
} from "../types/takeoff";

export const useTakeoffWorkspace = () => {
  const [activeWorkspace, setActiveWorkspace] =
    useState<ActiveWorkspace>("takeoff");
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [scale, setScale] = useState(1);
  const [scaleFactor, setScaleFactor] = useState(0.01);
  const [unit, setUnit] = useState<"m" | "mm">("m");
  const [activeSection, setActiveSection] = useState("Concrete Work");
  const [activeTool, setActiveTool] = useState<MeasurementTool>("area");
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [isDeductionMode, setIsDeductionMode] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [smmParams, setSmmParams] = useState<SmmParams>({
    depth: 0.15,
    height: 3,
    waste: 5,
  });
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  return {
    activeWorkspace,
    setActiveWorkspace,
    pdfDoc,
    setPdfDoc,
    scale,
    setScale,
    scaleFactor,
    setScaleFactor,
    unit,
    setUnit,
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
    smmParams,
    setSmmParams,
    leftOpen,
    setLeftOpen,
    rightOpen,
    setRightOpen,
  };
};
