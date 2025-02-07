import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Upload, FunctionSquare as Function } from 'lucide-react';
import { chartOptions, generateDummyData } from '../utils/chartUtils';

export default function OfflineData() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFunction, setSelectedFunction] = useState('multiply');
  const [multiplier, setMultiplier] = useState(2);

  const dummyData = generateDummyData(50);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const rawDataConfig = {
    labels: dummyData.map(d => d.x.toString()),
    datasets: [{
      label: 'CSV Data',
      data: dummyData.map(d => d.y),
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1,
    }],
  };

  const processedDataConfig = {
    labels: dummyData.map(d => d.x.toString()),
    datasets: [{
      label: 'Processed Data',
      data: dummyData.map(d => d.y * multiplier),
      borderColor: 'rgb(255, 99, 132)',
      tension: 0.1,
    }],
  };

  const correlationDataConfig = {
    labels: dummyData.map(d => d.x.toString()),
    datasets: [{
      label: 'Correlation',
      data: dummyData.map(d => d.y * 0.5),
      borderColor: 'rgb(153, 102, 255)',
      tension: 0.1,
    }],
  };

  return (
    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white transition-colors cursor-pointer">
            <Upload size={20} />
            <span>Load CSV File</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
          {selectedFile && (
            <span className="text-gray-600">
              Selected file: {selectedFile.name}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex items-center space-x-4">
          <label htmlFor="function-select" className="flex items-center space-x-2">
            <Function size={24} className="text-gray-600" />
            <span>Select Function</span>
          </label>
          <select
            id="function-select"
            value={selectedFunction}
            onChange={(e) => setSelectedFunction(e.target.value)}
            className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="multiply">Multiply</option>
            <option value="divide">Divide</option>
          </select>
          <input
            type="number"
            value={multiplier}
            onChange={(e) => setMultiplier(Number(e.target.value))}
            className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter multiplier"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">CSV Data</h2>
          <Line options={chartOptions} data={rawDataConfig} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Processed Data</h2>
          <Line options={chartOptions} data={processedDataConfig} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md col-span-full">
          <h2 className="text-lg font-semibold mb-4">Data Correlation</h2>
          <Line options={chartOptions} data={correlationDataConfig} />
        </div>
      </div>
    </main>
  );
}