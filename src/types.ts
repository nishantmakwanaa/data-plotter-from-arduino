export interface DataPoint {
  timestamp: number;
  value: number;
}

export interface ProcessedData {
  original: DataPoint[];
  processed: DataPoint[];
  relation: DataPoint[];
}

export type Operation = 'add' | 'subtract' | 'multiply' | 'divide';

export interface PortConfig {
  id: string;
  name: string;
  type: 'arduino' | 'raspberry' | 'localhost';
}

export interface Theme {
  isDark: boolean;
  toggle: () => void;
}