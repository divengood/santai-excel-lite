
export interface CellData {
  rawValue: string;
  calculatedValue: string;
  error?: string;
}

export type Selection = 
  | { type: 'cell'; id: string }
  | { type: 'row'; indices: number[] }
  | { type: 'col'; indices: number[] }
  | { type: 'range'; startId: string; endId: string }
  | { type: 'none' };
