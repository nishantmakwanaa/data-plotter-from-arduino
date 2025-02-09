import React from 'react';
import { Play, Square, Moon, Sun } from 'lucide-react';
import { Operation, PortConfig, Theme } from '../types';

interface ControlsProps {
  isRunning: boolean;
  selectedPort: string;
  operation: Operation;
  operationValue: number;
  ports: PortConfig[];
  theme: Theme;
  onStart: () => void;
  onStop: () => void;
  onPortChange: (port: string) => void;
  onOperationChange: (operation: Operation) => void;
  onOperationValueChange: (value: number) => void;
}

const Controls: React.FC<ControlsProps> = ({
  isRunning,
  selectedPort,
  operation,
  operationValue,
  ports,
  theme,
  onStart,
  onStop,
  onPortChange,
  onOperationChange,
  onOperationValueChange,
}) => {
  return (
    <div className={`flex flex-wrap gap-4 p-4 rounded-lg shadow-lg ${
      theme.isDark ? 'bg-gray-800' : 'bg-white'
    }`}>
      <select
        className={`px-4 py-2 border rounded-lg ${
          theme.isDark
            ? 'bg-gray-700 border-gray-600 text-white'
            : 'bg-white border-gray-300 text-gray-800'
        }`}
        value={selectedPort}
        onChange={(e) => onPortChange(e.target.value)}
      >
        {ports.map((port) => (
          <option key={port.id} value={port.id}>
            {port.name} ({port.type})
          </option>
        ))}
      </select>

      <select
        className={`px-4 py-2 border rounded-lg ${
          theme.isDark
            ? 'bg-gray-700 border-gray-600 text-white'
            : 'bg-white border-gray-300 text-gray-800'
        }`}
        value={operation}
        onChange={(e) => onOperationChange(e.target.value as Operation)}
      >
        <option value="add">Add</option>
        <option value="subtract">Subtract</option>
        <option value="multiply">Multiply</option>
        <option value="divide">Divide</option>
      </select>

      <input
        type="number"
        className={`px-4 py-2 border rounded-lg ${
          theme.isDark
            ? 'bg-gray-700 border-gray-600 text-white'
            : 'bg-white border-gray-300 text-gray-800'
        }`}
        value={operationValue}
        onChange={(e) => onOperationValueChange(Number(e.target.value))}
        placeholder="Operation Value"
      />

      <button
        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
          isRunning
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-green-500 hover:bg-green-600'
        } text-white`}
        onClick={isRunning ? onStop : onStart}
      >
        {isRunning ? (
          <>
            <Square size={16} /> Stop
          </>
        ) : (
          <>
            <Play size={16} /> Start
          </>
        )}
      </button>

      <button
        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
          theme.isDark
            ? 'bg-gray-700 hover:bg-gray-600'
            : 'bg-gray-200 hover:bg-gray-300'
        } text-inherit`}
        onClick={theme.toggle}
      >
        {theme.isDark ? <Sun size={16} /> : <Moon size={16} />}
        {theme.isDark ? 'Light Mode' : 'Dark Mode'}
      </button>
    </div>
  );
};

export default Controls;