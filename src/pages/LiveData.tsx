import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Play, Pause, Download, FunctionSquare as Function } from 'lucide-react';
import { chartOptions, generateDummyData } from '../utils/chartUtils';

export default function LiveData() {
  const [isRecording, setIsRecording] = useState(false);
  const [port, setPort] = useState('COM3');
  const [selectedFunction, setSelectedFunction] = useState('multiply');
  const [multiplier, setMultiplier] = useState(2);

  const dummyData = generateDummyData(50);

  const rawDataConfig = {
    labels: dummyData.map(d => d.x.toString()),
    datasets: [{
      label: 'Raw Data',
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
          <label className="text-gray-700 font-medium">Arduino Port :</label>
          <input
            type="text"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter port (e.g., COM3)"
          />
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-green-500 hover:bg-green-600'
            } text-white transition-colors`}
          >
            {isRecording ? (
              <>
                <Pause size={20} />
                <span>Stop Recording</span>
              </>
            ) : (
              <>
                <Play size={20} />
                <span>Start Recording</span>
              </>
            )}
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors">
            <Download size={20} />
            <span>Save to CSV</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex items-center space-x-4">
          <Function size={24} className="text-gray-600" />
          <label htmlFor="function-select" className="sr-only">Select Function</label>
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
            title="Multiplier"
            placeholder="Enter multiplier"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Raw Data</h2>
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