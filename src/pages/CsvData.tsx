import React, { useState } from 'react';
import { ProcessedData, Theme } from '../types';
import Graph from '../components/Graph';

interface CsvDataProps {
  theme: Theme;
}

function CsvData({ theme }: CsvDataProps) {
  const [data, setData] = useState<ProcessedData>({
    original: [],
    processed: [],
    relation: [],
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').slice(1);
      const importedData: ProcessedData = {
        original: [],
        processed: [],
        relation: [],
      };

      lines.forEach(line => {
        const [timestamp, original, processed, relation] = line.split(',');
        if (timestamp && original && processed && relation) {
          const ts = parseInt(timestamp);
          importedData.original.push({ timestamp: ts, value: parseFloat(original) });
          importedData.processed.push({ timestamp: ts, value: parseFloat(processed) });
          importedData.relation.push({ timestamp: ts, value: parseFloat(relation) });
        }
      });

      setData(importedData);
    };
    reader.readAsText(file);
  };

  const handleRemoveData = () => {
    setData({
      original: [],
      processed: [],
      relation: [],
    });
  };

  return (
    <div className="max-w-7xl mx-auto min-h-screen flex flex-col items-center justify-center space-y-12 p-8">
      {!data.original.length ? (
        <div className="p-8 rounded-lg shadow-lg text-center w-96">
          <label className="flex flex-col items-center justify-center w-full">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <span className={`px-6 py-3 text-lg font-semibold rounded-lg cursor-pointer ${
              theme.isDark
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}>
              Upload CSV File
            </span>
          </label>
        </div>
      ) : (
        <div className="space-y-12 w-full">
          <Graph
            data={data.original}
            title="Original Data"
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

          <div className="flex justify-center">
            <button
              onClick={handleRemoveData}
              className="px-6 py-3 text-lg font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700"
            >
              Remove CSV Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CsvData;