import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const HistoricalData = () => {
  interface HistoricalDataItem {
    timestamp: string;
    originalData: number;
    multipliedData: number;
    dividedData: number;
    time: string;
  }

  const [historicalData, setHistoricalData] = useState<HistoricalDataItem[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/historical-data')
      .then(res => res.json())
      .then(data => {
        const formattedData = data.map((item: HistoricalDataItem) => ({
          ...item,
          time: new Date(item.timestamp).toLocaleTimeString()
        }));
        setHistoricalData(formattedData);
      })
      .catch(err => console.error('Error Fetching Historical Data :', err));
  }, []);

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 text-center">Historical Data Analysis</h1>

      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md w-full max-w-6xl mx-auto">
        <h2 className="text-lg md:text-xl font-semibold mb-4 text-center">All Measurements</h2>
        <div className="w-full h-64 md:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" className="text-xs md:text-sm" />
              <YAxis className="text-xs md:text-sm" />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="originalData" 
                stroke="#2563eb" 
                name="Original"
              />
              <Line 
                type="monotone" 
                dataKey="multipliedData" 
                stroke="#16a34a" 
                name="Multiplied"
              />
              <Line 
                type="monotone" 
                dataKey="dividedData" 
                stroke="#dc2626" 
                name="Divided"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default HistoricalData;