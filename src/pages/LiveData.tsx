import { useState, useEffect } from 'react';
import { Operation, ProcessedData, PortConfig, Theme } from '../types';
import Graph from '../components/Graph';
import Controls from '../components/Controls';
import io, { Socket } from 'socket.io-client';

const PORTS: PortConfig[] = [
  { id: 'localhost', name: 'LocalHost', type: 'localhost' },
  { id: 'arduino', name: 'Arduino', type: 'arduino' },
  { id: 'raspberry', name: 'Rasp-Berry Pi', type: 'raspberry' },
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
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('data', (newData: { timestamp: number; original: number; processed: number; relation: number }) => {
      setData(prev => ({
        original: [...prev.original, { timestamp: newData.timestamp, value: newData.original }].slice(-MAX_POINTS),
        processed: [...prev.processed, { timestamp: newData.timestamp, value: newData.processed }].slice(-MAX_POINTS),
        relation: [...prev.relation, { timestamp: newData.timestamp, value: newData.relation }].slice(-MAX_POINTS),
      }));
    });

    newSocket.on('csvSaved', ({ filename }) => {
      console.log(`Data Saved To : ${filename}`);
    });

    newSocket.on('error', ({ message }) => {
      console.error('Server Error :', message);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleStart = () => {
    if (socket) {
      socket.emit('start', {
        portType: selectedPort,
        portPath: selectedPort,
        operation,
        operationValue
      });
      setIsRunning(true);
    }
  };

  const handleStop = () => {
    if (socket) {
      socket.emit('stop', {
        portType: selectedPort,
        portPath: selectedPort
      });
      setIsRunning(false);
    }
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