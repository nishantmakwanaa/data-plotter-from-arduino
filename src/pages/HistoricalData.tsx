import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const HistoricalData = () => {
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  useEffect(() => {
    // In a real application, this would fetch from your backend
    fetch('http://localhost:3000/historical-data')
      .then(res => res.json())
      .then(data => {
        const formattedData = data.map((item: any) => ({
          ...item,
          time: new Date(item.timestamp).toLocaleTimeString()
        }));
        setHistoricalData(formattedData);
      })
      .catch(err => console.error('Error fetching historical data:', err));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Historical Data Analysis</h1>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">All Measurements</h2>
          <LineChart width={1000} height={400} data={historicalData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
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
        </div>
      </div>
    </div>
  );
};

export default HistoricalData;