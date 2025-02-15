import { useState, useEffect } from 'react';
import { Operation, Port, Theme, StreamlinesData, DataPoint } from '../utils/types';
import StreamlineGraphs from '../components/Graph';
import Controls from '../components/Controls';
import io, { Socket } from 'socket.io-client';

const MAX_POINTS = 1000;

interface LiveDataProps {
  theme: Theme;
}

function LiveData({ theme }: LiveDataProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [selectedPort, setSelectedPort] = useState('');
  const [operation, setOperation] = useState<Operation>('add');
  const [operationValue, setOperationValue] = useState(1);
  const [data, setData] = useState<StreamlinesData>({
    Y1: { original: [], processed: [], relation: [] },
    Y2: { original: [], processed: [], relation: [] },
    Y3: { original: [], processed: [], relation: [] },
    Y4: { original: [], processed: [], relation: [] }
  });
  const [socket, setSocket] = useState<Socket | null>(null);
  const [ports, setPorts] = useState<Port[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('ports', (portList: Port[]) => {
      setPorts(portList);
      if (selectedPort && !portList.find(p => p.id === selectedPort && p.status === 'online')) {
        handleStop();
      }
    });

    newSocket.on('data', (newData: DataPoint) => {
      setData(prev => {
        const newState = { ...prev };
        ['Y1', 'Y2', 'Y3', 'Y4'].forEach(streamline => {
          const liveValue = newData[`${streamline}Live` as keyof DataPoint];
          const proceedValue = newData[`${streamline}Proceed` as keyof DataPoint];
          const relationalValue = newData[`${streamline}Relational` as keyof DataPoint];

          newState[streamline] = {
            original: [...prev[streamline].original, { ...newData, value: liveValue }].slice(-MAX_POINTS),
            processed: [...prev[streamline].processed, { ...newData, value: proceedValue }].slice(-MAX_POINTS),
            relation: [...prev[streamline].relation, { ...newData, value: relationalValue }].slice(-MAX_POINTS),
          };
        });
        return newState;
      });
    });

    newSocket.on('portError', ({ port, error: portError }) => {
      setError(`Error With Port ${port} : ${portError}`);
      if (port === selectedPort) handleStop();
    });

    newSocket.on('portDisconnected', ({ port }) => {
      if (port === selectedPort) {
        handleStop();
        setError(`Port ${port} Disconnected`);
      }
    });

    newSocket.on('error', ({ message }) => {
      setError(message);
      handleStop();
    });

    return () => {
      if (isRunning) handleStop();
      newSocket.disconnect();
    };
  }, [selectedPort]);

  const handleStart = () => {
    if (socket && selectedPort) {
      setError('');
      socket.emit('start', {
        portType: ports.find(p => p.id === selectedPort)?.type.toLowerCase() || 'unknown',
        portPath: selectedPort,
        operation,
        operationValue
      });
      setIsRunning(true);
    }
  };

  const handleStop = () => {
    if (socket && selectedPort) {
      socket.emit('stop', {
        portType: ports.find(p => p.id === selectedPort)?.type.toLowerCase() || 'unknown',
        portPath: selectedPort
      });
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className={`p-4 rounded-lg ${theme.isDark ? 'bg-red-900' : 'bg-red-100'} ${theme.isDark ? 'text-red-200' : 'text-red-900'}`}>
          {error}
        </div>
      )}

      <Controls
        isRunning={isRunning}
        selectedPort={selectedPort}
        operation={operation}
        operationValue={operationValue}
        ports={ports}
        theme={theme}
        onStart={handleStart}
        onStop={handleStop}
        onPortChange={setSelectedPort}
        onOperationChange={setOperation}
        onOperationValueChange={setOperationValue}
      />

      <div className="space-y-12">
        {Object.entries(data).map(([streamlineId, streamlineData]) => (
          <StreamlineGraphs
            key={streamlineId}
            streamlineId={streamlineId}
            data={streamlineData}
            isDark={theme.isDark}
          />
        ))}
      </div>
    </div>
  );
}

export default LiveData;
