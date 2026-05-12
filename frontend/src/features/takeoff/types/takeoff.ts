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

/** --- THE MASTER MEASUREMENT INTERFACE --- 
 * Updated to match database.ts exactly:
 * 1. label is now string | null
 * 2. points is now CanvasPoint[] | null
 */
export interface Measurement {
  /** Unique secure identifier for the ledger */
  id: string;
  /** Links the measurement to a specific vault project */
  project_id: string;
  /** Links to a specific BoQ item */
  bill_item_id: string | null;
  /** Human-readable label (Matched to database.ts) */
  label: string | null;
  /** The tool used to capture the data */
  type: MeasurementTool | 'markup';
  /** The final calculated quantity */
  value: number;
  /** The SMM-KE unit of measure */
  unit: string;
  /** The specific trade code */
  sectionCode: string;
  /** The raw X/Y coordinates */
  points: Point[] | null;
  /** ISO String timestamp */
  timestamp: string;
  /** Cloud synchronization marker */
  synced_at?: string;
}