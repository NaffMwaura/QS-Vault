

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
  /** Unique secure identifier for the ledger */
  id: string;
  /** Links the measurement to a specific vault project */
  project_id: string;
  /** Human-readable label (e.g., 'Concrete Slab') */
  label: string;
  /** The tool used to capture the data */
  type: MeasurementTool;
  /** The final calculated quantity (incorporating Z-axis and waste) */
  value: number;
  /** The SMM-KE unit of measure (m, m², m³, nr) */
  unit: string;
  /** The specific trade code (e.g., SEC-F for Concrete) */
  sectionCode: string;
  /** The raw X/Y coordinates from the PDF Blueprint */
  points: Point[];
  /** ISO String timestamp of when the record was secured */
  timestamp: string;
}


