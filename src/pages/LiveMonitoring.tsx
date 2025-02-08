import { useState, useEffect } from 'react';
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
  interface MedicalData {
    timestamp: number;
    originalData: number;
    multipliedData: number;
    dividedData: number;
    time: string;
  }

  const [data, setData] = useState<MedicalData[]>([]);
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
      console.error('Error Updating Factors :', error);
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
    <div className="space-y-6 p-4 md:p-6 lg:p-8 w-full max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Medical Monitoring</h1>
        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-x-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Multiply By:</label>
            <input
              type="number"
              value={multiplyFactor}
              onChange={(e) => setMultiplyFactor(Number(e.target.value))}
              onBlur={updateFactors}
              className="w-20 px-2 py-1 border rounded-md text-center"
              placeholder="Multiply"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Divide By:</label>
            <input
              type="number"
              value={divideFactor}
              onChange={(e) => setDivideFactor(Number(e.target.value))}
              onBlur={updateFactors}
              className="w-20 px-2 py-1 border rounded-md text-center"
              placeholder="Divide"
            />
          </div>
          <button
            onClick={toggleMonitoring}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors w-full md:w-auto justify-center ${
              isMonitoring 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-green-500 hover:bg-green-600'
            } text-white`}
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

      {["Original Signal", "Processed Signals", "Signal Relationships"].map((title, index) => (
        <div key={index} className="bg-white p-4 rounded-lg shadow-md w-full overflow-hidden">
          <h2 className="text-lg font-semibold mb-4">{title}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Brush dataKey="time" height={20} stroke="#8884d8" />
              {index === 0 && (
                <Line type="monotone" dataKey="originalData" stroke="#2563eb" name="Heart Rate" dot={false} isAnimationActive={false} />
              )}
              {index === 1 && (
                <>
                  <Line type="monotone" dataKey="multipliedData" stroke="#16a34a" name={`Multiplied (×${multiplyFactor})`} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="dividedData" stroke="#dc2626" name={`Divided (÷${divideFactor})`} dot={false} isAnimationActive={false} />
                </>
              )}
              {index === 2 && (
                <>
                  <Line type="monotone" dataKey="originalData" stroke="#2563eb" name="Original" dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="multipliedData" stroke="#16a34a" name={`Multiplied (×${multiplyFactor})`} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="dividedData" stroke="#dc2626" name={`Divided (÷${divideFactor})`} dot={false} isAnimationActive={false} />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
};

export default LiveMonitoring;