import React, { useState, useEffect, useCallback } from 'react';
import { DataPoint, Operation, ProcessedData, PortConfig, Theme } from '../types';
import Graph from '../components/Graph';
import Controls from '../components/Controls';
import io from 'socket.io-client';

const PORTS: PortConfig[] = [
  { id: 'localhost', name: 'Localhost', type: 'localhost' },
  { id: 'arduino', name: 'Arduino', type: 'arduino' },
  { id: 'raspberry', name: 'Raspberry Pi', type: 'raspberry' },
];

const MAX_POINTS = 100;

interface LiveDataProps {
  theme: Theme;
}

function LiveData({ theme }: LiveDataProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [selectedPort, setSelectedPort] = useState(PORTS[0].id);
  const [operation, setOperation] = useState<Operation>('add');
  const [operationValue, setOperationValue] = useState(1);
  const [data, setData] = useState<ProcessedData>({
    original: [],
    processed: [],
    relation: [],
  });

  const processData = useCallback((value: number) => {
    switch (operation) {
      case 'add':
        return value + operationValue;
      case 'subtract':
        return value - operationValue;
      case 'multiply':
        return value * operationValue;
      case 'divide':
        return operationValue !== 0 ? value / operationValue : value;
      default:
        return value;
    }
  }, [operation, operationValue]);

  useEffect(() => {
    const socket = io('http://localhost:3000');

    socket.on('data', (newValue: number) => {
      if (isRunning) {
        const timestamp = Date.now();
        const processedValue = processData(newValue);

        setData(prev => {
          const original = [...prev.original, { timestamp, value: newValue }].slice(-MAX_POINTS);
          const processed = [...prev.processed, { timestamp, value: processedValue }].slice(-MAX_POINTS);
          const relation = [...prev.relation, { timestamp, value: processedValue - newValue }].slice(-MAX_POINTS);
          return { original, processed, relation };
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [isRunning, processData]);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
    // Auto-export CSV when stopping
    const csv = [
      ['Timestamp,Original,Processed,Relation'],
      ...data.original.map((point, i) => 
        `${point.timestamp},${point.value},${data.processed[i]?.value},${data.relation[i]?.value}`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical_data_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <Controls
        isRunning={isRunning}
        selectedPort={selectedPort}
        operation={operation}
        operationValue={operationValue}
        ports={PORTS}
        theme={theme}
        onStart={handleStart}
        onStop={handleStop}
        onPortChange={setSelectedPort}
        onOperationChange={setOperation}
        onOperationValueChange={setOperationValue}
      />

      <div className="space-y-8">
        <Graph
          data={data.original}
          title="Live Data"
          color="#2563eb"
          isDark={theme.isDark}
        />
        <Graph
          data={data.processed}
          title="Processed Data"
          color="#16a34a"
          isDark={theme.isDark}
        />
        <Graph
          data={data.relation}
          title="Relational Data"
          color="#9333ea"
          isDark={theme.isDark}
        />
      </div>
    </div>
  );
}

export default LiveData;