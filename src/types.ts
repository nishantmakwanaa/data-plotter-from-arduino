export interface Theme {
  isDark: boolean;
}

export type Operation = 'add' | 'subtract' | 'multiply' | 'divide';

export interface DataPoint {
  timestamp: number;
  value: number;
}

export interface ProcessedData {
  original: DataPoint[];
  processed: DataPoint[];
  relation: DataPoint[];
}

export interface Port {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'error';
  vendorId?: string;
  productId?: string;
  serialNumber?: string;
}