import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea } from 'recharts';
import { DataPoint } from '../types';

interface GraphProps {
  data: DataPoint[];
  title: string;
  color: string;
  isDark: boolean;
}

const Graph: React.FC<GraphProps> = ({ data, title, color, isDark }) => {
  const [left, setLeft] = useState<string | null>(null);
  const [right, setRight] = useState<string | null>(null);
  const [refAreaLeft, setRefAreaLeft] = useState<string>('');
  const [refAreaRight, setRefAreaRight] = useState<string>('');
  const [top, setTop] = useState<number | 'auto'>('auto');
  const [bottom, setBottom] = useState<number | 'auto'>('auto');

  const formattedData = data.map(point => ({
    timestamp: new Date(point.timestamp).toLocaleTimeString(),
    value: point.value
  }));

  const getAxisYDomain = (from: string, to: string, ref: string) => {
    const refData = formattedData.slice(
      formattedData.findIndex(d => d.timestamp === from),
      formattedData.findIndex(d => d.timestamp === to) + 1
    );

    let [bottom, top] = [refData[0][ref], refData[0][ref]];
    refData.forEach(d => {
      if (d[ref] > top) top = d[ref];
      if (d[ref] < bottom) bottom = d[ref];
    });

    return [(bottom | 0) - 10, (top | 0) + 10];
  };

  const zoom = () => {
    if (refAreaLeft === refAreaRight || refAreaRight === '') {
      setRefAreaLeft('');
      setRefAreaRight('');
      return;
    }

    let [newBottom, newTop] = getAxisYDomain(refAreaLeft, refAreaRight, 'value');

    setRefAreaLeft('');
    setRefAreaRight('');
    setLeft(refAreaLeft);
    setRight(refAreaRight);
    setBottom(newBottom);
    setTop(newTop);
  };

  const zoomOut = () => {
    setRefAreaLeft('');
    setRefAreaRight('');
    setLeft(null);
    setRight(null);
    setTop('auto');
    setBottom('auto');
  };

  return (
    <div className={`w-full h-[500px] p-6 rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{title}</h3>
        <button
          onClick={zoomOut}
          className={`px-3 py-1 rounded ${
            isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Reset Zoom
        </button>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={formattedData}
          onMouseDown={e => e && setRefAreaLeft(e.activeLabel || '')}
          onMouseMove={e => refAreaLeft && e && setRefAreaRight(e.activeLabel || '')}
          onMouseUp={zoom}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
          <XAxis
            dataKey="timestamp"
            allowDataOverflow
            domain={[left || 'auto', right || 'auto']}
            type="category"
            tick={{ fill: isDark ? '#D1D5DB' : '#374151' }}
          />
          <YAxis
            domain={[bottom || 'auto', top || 'auto']}
            type="number"
            tick={{ fill: isDark ? '#D1D5DB' : '#374151' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
              color: isDark ? '#D1D5DB' : '#374151'
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            dot={false}
            name="Value"
            strokeWidth={2}
          />
          {refAreaLeft && refAreaRight && (
            <ReferenceArea
              x1={refAreaLeft}
              x2={refAreaRight}
              strokeOpacity={0.3}
              fill={isDark ? '#374151' : '#E5E7EB'}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Graph;