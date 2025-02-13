export type Theme = {
  isDark: boolean;
};

export type Operation = 'add' | 'subtract' | 'multiply' | 'divide';

export type Port = {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'error';
  baudRate: number;
};

export type DataPoint = {
  timestamp: number;
  value: number;
};

export type StreamlineData = {
  original: DataPoint[];
  processed: DataPoint[];
  relation: DataPoint[];
};

export type StreamlinesData = {
  [key: string]: StreamlineData;
};

export interface ProcessedData {
  original: DataPoint[];
  processed: DataPoint[];
  relation: DataPoint[];
}