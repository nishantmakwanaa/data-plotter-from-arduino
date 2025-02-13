import React from 'react';
import { Play, Square, Wifi, WifiOff } from 'lucide-react';
import { Operation, Theme, Port } from '../utils/types';

interface ControlsProps {
  isRunning: boolean;
  selectedPort: string;
  operation: Operation;
  operationValue: number;
  ports: Port[];
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

  const groupedPorts = ports.reduce(
    (acc, port) => {
      acc[port.status].push(port);
      return acc;
    },
    { online: [] as Port[], offline: [] as Port[], error: [] as Port[] }
  );

  return (
    <div className={`flex flex-wrap justify-center gap-4 p-4 rounded-lg shadow-lg ${theme.isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex flex-wrap justify-center gap-4 w-full md:flex-nowrap">
        <label htmlFor="port-select" className="sr-only">Select Port</label>
        <select
          id="port-select"
          className={`px-4 py-2 border rounded-lg w-full md:w-auto ${
            theme.isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
          }`}
          value={selectedPort}
          onChange={(e) => onPortChange(e.target.value)}
        >
          <option value="">Select A Port</option>
          
          {groupedPorts.online.length > 0 && (
            <optgroup label="Available Ports">
              {groupedPorts.online.map((port) => (
                <option key={port.id} value={port.id}>
                  {port.name} ({port.type})
                </option>
              ))}
            </optgroup>
          )}

          {groupedPorts.offline.length > 0 && (
            <optgroup label="Offline Ports">
              {groupedPorts.offline.map((port) => (
                <option key={port.id} value={port.id} disabled>
                  {port.name} ({port.type}) - Offline
                </option>
              ))}
            </optgroup>
          )}

          {groupedPorts.error.length > 0 && (
            <optgroup label="Error Ports">
              {groupedPorts.error.map((port) => (
                <option key={port.id} value={port.id} disabled>
                  {port.name} ({port.type}) - Error
                </option>
              ))}
            </optgroup>
          )}
        </select>

        <div className="flex items-center gap-2">
          {selectedPort ? (
            <Wifi className="text-green-500" size={20} />
          ) : (
            <WifiOff className="text-red-500" size={20} />
          )}
        </div>

        <label htmlFor="operation-select" className="sr-only">Select Operation</label>
        <select
          id="operation-select"
          className={`px-4 py-2 border rounded-lg w-full md:w-auto ${
            theme.isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
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
          className={`px-4 py-2 border rounded-lg w-full md:w-auto ${
            theme.isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
          }`}
          value={operationValue}
          onChange={(e) => onOperationValueChange(Number(e.target.value))}
          placeholder="Operation Value"
        />
      </div>
      
      <div className="flex flex-col md:flex-row justify-center gap-4 w-full">
        <button
          className={`px-6 py-3 rounded-lg flex items-center gap-2 text-lg font-medium min-w-[120px] flex-grow 
            ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white
            ${!selectedPort ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={isRunning ? onStop : onStart}
          disabled={!selectedPort}
        >
          {isRunning ? (
            <>
              <Square size={20} /> Stop
            </>
          ) : (
            <>
              <Play size={20} /> Start
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Controls;