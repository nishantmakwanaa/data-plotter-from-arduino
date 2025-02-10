import { useState, useEffect, useRef } from 'react';
import { Operation, ProcessedData, Port, Theme } from '../types';
import Graph from '../components/Graph';
import Controls from '../components/Controls';
import { FileSpreadsheet, Upload } from 'lucide-react';
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
  const [data, setData] = useState<ProcessedData>({
    original: [],
    processed: [],
    relation: [],
  });
  const [socket, setSocket] = useState<Socket | null>(null);
  const [ports, setPorts] = useState<Port[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoadingCSV, setIsLoadingCSV] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('ports', (portList: Port[]) => {
      setPorts(portList);
      if (selectedPort && !portList.find(p => p.id === selectedPort && p.status === 'online')) {
        handleStop();
      }
    });

    newSocket.on('data', (newData: {
      timestamp: number;
      original: number;
      processed: number;
      relation: number;
    }) => {
      setData(prev => ({
        original: [...prev.original, { timestamp: newData.timestamp, value: newData.original }].slice(-MAX_POINTS),
        processed: [...prev.processed, { timestamp: newData.timestamp, value: newData.processed }].slice(-MAX_POINTS),
        relation: [...prev.relation, { timestamp: newData.timestamp, value: newData.relation }].slice(-MAX_POINTS),
      }));
    });

    newSocket.on('csvSaved', ({ filename }) => {
      console.log(`Data Saved To : ${filename}`);
    });

    newSocket.on('portError', ({ port, error: portError }) => {
      setError(`Error With Port ${port}: ${portError}`);
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      handleCSVLoad(file);
    }
  };

  const handleCSVLoad = async (file: File) => {
    setIsLoadingCSV(true);
    setError('');
    
    try {
      const text = await file.text();
      const rows = text.split('\n');
      const headers = rows[0].split(',');
      
      if (!headers.includes('Timestamp') || 
          !headers.includes('Original') || 
          !headers.includes('Processed') || 
          !headers.includes('Relation')) {
        throw new Error('Invalid CSV format. Required olumns : Timestamp, Original, Processed, Relation');
      }

      const parsedData: ProcessedData = {
        original: [],
        processed: [],
        relation: []
      };

      rows.slice(1).forEach(row => {
        if (!row.trim()) return;
        
        const [timestamp, original, processed, relation] = row.split(',');
        const time = new Date(timestamp).getTime();

        if (isNaN(time)) return;

        parsedData.original.push({ timestamp: time, value: parseFloat(original) });
        parsedData.processed.push({ timestamp: time, value: parseFloat(processed) });
        parsedData.relation.push({ timestamp: time, value: parseFloat(relation) });
      });

      setData(parsedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load CSV file');
    } finally {
      setIsLoadingCSV(false);
    }
  };

  const clearData = () => {
    setData({
      original: [],
      processed: [],
      relation: []
    });
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className={`p-4 rounded-lg ${theme.isDark ? 'bg-red-900' : 'bg-red-100'} ${
          theme.isDark ? 'text-red-200' : 'text-red-900'
        }`}>
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
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

        <div className={`p-4 rounded-lg shadow-lg ${theme.isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className={theme.isDark ? 'text-gray-300' : 'text-gray-600'} />
              <h3 className={`text-lg font-semibold ${theme.isDark ? 'text-white' : 'text-gray-800'}`}>
                Load Historical Data
              </h3>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  theme.isDark
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
                disabled={isLoadingCSV}
              >
                <Upload size={16} />
                {isLoadingCSV ? 'Loading...' : 'Load CSV'}
              </button>
              {data.original.length > 0 && (
                <button
                  onClick={clearData}
                  className={`px-4 py-2 rounded-lg ${
                    theme.isDark
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  Clear Data
                </button>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            title="Upload CSV file"
          />
          {selectedFile && (
            <p className={`text-sm ${theme.isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Loaded file: {selectedFile.name}
            </p>
          )}
        </div>
      </div>

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