export type Theme = {
  isDark: boolean;
  toggle: () => void;
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
  index: number;
  Y1Live: number;
  Y1Proceed: number;
  Y1Relational: number;
  Y2Live: number;
  Y2Proceed: number;
  Y2Relational: number;
  Y3Live: number;
  Y3Proceed: number;
  Y3Relational: number;
  Y4Live: number;
  Y4Proceed: number;
  Y4Relational: number;
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