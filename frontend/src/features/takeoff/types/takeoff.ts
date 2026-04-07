export type MeasurementTool = "length" | "area" | "count";

export type ActiveWorkspace = "takeoff" | "reports";

export interface Point {
  x: number;
  y: number;
}

export interface SmmParams {
  depth: number;
  height: number;
  waste: number;
  mode?: "ADDITION" | "DEDUCTION";
}

export interface Measurement {
  id: string;
  project_id: string;
  label: string;
  type: MeasurementTool;
  value: number;
  unit: string;
  sectionCode: string;
  points: Point[];
  timestamp: string;
}
