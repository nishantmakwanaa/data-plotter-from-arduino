import React from 'react';
import Graph from './Graph';
import { StreamlineData } from '../types';

interface StreamlineGraphsProps {
  streamlineId: string;
  data: StreamlineData;
  isDark: boolean;
}

const StreamlineGraphs: React.FC<StreamlineGraphsProps> = ({ streamlineId, data, isDark }) => {
  return (
    <div className="space-y-8 mb-12">
      <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
        StreamLine {streamlineId}
      </h2>
      <Graph
        data={data.original}
        title="Live Data"
        color="#2563eb"
        isDark={isDark}
      />
      <Graph
        data={data.processed}
        title="Processed Data"
        color="#16a34a"
        isDark={isDark}
      />
      <Graph
        data={data.relation}
        title="Relational Data"
        color="#9333ea"
        isDark={isDark}
      />
    </div>
  );
};

export default StreamlineGraphs;