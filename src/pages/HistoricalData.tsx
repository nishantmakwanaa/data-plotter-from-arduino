import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';

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
      .catch(err => console.error('Error Fetching Historical Data:', err));
  }, []);

  const loadCSVData = async () => {
    try {
      const response = await fetch('http://localhost:3000/historical-data.csv');
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        complete: (result: Papa.ParseResult<HistoricalDataItem>) => {
          const formattedData = result.data.map((item: HistoricalDataItem) => ({
            ...item,
            time: new Date(item.timestamp).toLocaleTimeString()
          }));
          setHistoricalData(formattedData);
        },
      });
    } catch (error) {
      console.error('Error Loading CSV Data :', error);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 text-center">Historical Data Analysis</h1>
      
      <div className="flex justify-center">
        <button
          onClick={loadCSVData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Load CSV Data
        </button>
      </div>

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