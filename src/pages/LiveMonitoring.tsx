import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Brush,
  ResponsiveContainer 
} from 'recharts';
import { Play, Square } from 'lucide-react';

const socket = io('http://localhost:3000');

const LiveMonitoring = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [multiplyFactor, setMultiplyFactor] = useState(2);
  const [divideFactor, setDivideFactor] = useState(2);

  useEffect(() => {
    socket.on('medicalData', (newData) => {
      setData(prevData => [...prevData.slice(-100), {
        ...newData,
        time: new Date(newData.timestamp).toLocaleTimeString()
      }]);
    });

    return () => {
      socket.off('medicalData');
    };
  }, []);

  const updateFactors = async () => {
    try {
      await fetch('http://localhost:3000/update-factors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ multiply: multiplyFactor, divide: divideFactor }),
      });
    } catch (error) {
      console.error('Error updating factors:', error);
    }
  };

  const toggleMonitoring = () => {
    if (!isMonitoring) {
      socket.emit('startMonitoring');
      setData([]);
    } else {
      socket.emit('stopMonitoring');
    }
    setIsMonitoring(!isMonitoring);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Live Heart Rate Monitoring</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Multiply by:</label>
            <input
              type="number"
              value={multiplyFactor}
              onChange={(e) => setMultiplyFactor(Number(e.target.value))}
              onBlur={updateFactors}
              className="w-20 px-2 py-1 border rounded"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Divide by:</label>
            <input
              type="number"
              value={divideFactor}
              onChange={(e) => setDivideFactor(Number(e.target.value))}
              onBlur={updateFactors}
              className="w-20 px-2 py-1 border rounded"
            />
          </div>
          <button
            onClick={toggleMonitoring}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              isMonitoring 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-green-500 hover:bg-green-600'
            } text-white transition-colors`}
          >
            {isMonitoring ? (
              <>
                <Square className="h-5 w-5" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                <span>Start</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Original Signal */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Original Signal</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis domain={['auto', 'auto']} />
            <Tooltip />
            <Legend />
            <Brush dataKey="time" height={30} stroke="#8884d8" />
            <Line 
              type="monotone" 
              dataKey="originalData" 
              stroke="#2563eb" 
              name="Heart Rate"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Processed Signals */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Processed Signals</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis domain={['auto', 'auto']} />
            <Tooltip />
            <Legend />
            <Brush dataKey="time" height={30} stroke="#8884d8" />
            <Line 
              type="monotone" 
              dataKey="multipliedData" 
              stroke="#16a34a" 
              name={`Multiplied (×${multiplyFactor})`}
              dot={false}
              isAnimationActive={false}
            />
            <Line 
              type="monotone" 
              dataKey="dividedData" 
              stroke="#dc2626" 
              name={`Divided (÷${divideFactor})`}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Relationship Graph */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Signal Relationships</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis domain={['auto', 'auto']} />
            <Tooltip />
            <Legend />
            <Brush dataKey="time" height={30} stroke="#8884d8" />
            <Line 
              type="monotone" 
              dataKey="originalData" 
              stroke="#2563eb" 
              name="Original"
              dot={false}
              isAnimationActive={false}
            />
            <Line 
              type="monotone" 
              dataKey="multipliedData" 
              stroke="#16a34a" 
              name={`Multiplied (×${multiplyFactor})`}
              dot={false}
              isAnimationActive={false}
            />
            <Line 
              type="monotone" 
              dataKey="dividedData" 
              stroke="#dc2626" 
              name={`Divided (÷${divideFactor})`}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LiveMonitoring;