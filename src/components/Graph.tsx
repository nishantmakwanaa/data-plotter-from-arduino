import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import { DataPoint } from '../types';
import { ZoomIn, ZoomOut, MoveHorizontal } from 'lucide-react';

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
  const [autoScroll, setAutoScroll] = useState(true);
  const [isZooming, setIsZooming] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [startX, setStartX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const formattedData = data.map(point => ({
    timestamp: new Date(point.timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    value: point.value,
    rawTimestamp: point.timestamp
  }));

  useEffect(() => {
    if (autoScroll && formattedData.length > 0) {
      const lastTimestamp = formattedData[formattedData.length - 1].timestamp;
      if (!left && !right) {
        const startIndex = Math.max(0, formattedData.length - 30);
        setLeft(formattedData[startIndex]?.timestamp || null);
        setRight(lastTimestamp);
      } else if (right) {
        setRight(lastTimestamp);
        const startIndex = formattedData.findIndex(d => d.timestamp === left);
        if (startIndex >= 0) {
          setLeft(formattedData[Math.max(0, startIndex)].timestamp);
        }
      }
    }
  }, [formattedData, autoScroll, left, right]);

  const getAxisYDomain = useCallback((from: string, to: string) => {
    const refData = formattedData.slice(
      formattedData.findIndex(d => d.timestamp === from),
      formattedData.findIndex(d => d.timestamp === to) + 1
    );

    if (refData.length === 0) return [0, 100];

    let [bottom, top] = [refData[0].value, refData[0].value];
    refData.forEach(d => {
      if (d.value > top) top = d.value;
      if (d.value < bottom) bottom = d.value;
    });

    const padding = (top - bottom) * 0.1;
    return [bottom - padding, top + padding];
  }, [formattedData]);

  const handleMouseWheel = useCallback((e: WheelEvent) => {
    if (!containerRef.current || !isZooming) return;
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const xPercent = x / rect.width;

    const currentViewData = formattedData.filter(d => {
      const index = formattedData.findIndex(item => item.timestamp === d.timestamp);
      return (!left || index >= formattedData.findIndex(item => item.timestamp === left)) &&
             (!right || index <= formattedData.findIndex(item => item.timestamp === right));
    });

    if (currentViewData.length < 2) return;

    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    const centerIndex = Math.floor(currentViewData.length * xPercent);
    const center = currentViewData[centerIndex]?.timestamp;

    if (!center) return;

    const newLeftIndex = Math.max(0, Math.floor(centerIndex - (centerIndex * zoomFactor)));
    const newRightIndex = Math.min(currentViewData.length - 1, Math.ceil(centerIndex + ((currentViewData.length - centerIndex) * zoomFactor)));

    const newLeft = currentViewData[newLeftIndex]?.timestamp;
    const newRight = currentViewData[newRightIndex]?.timestamp;

    if (newLeft && newRight) {
      setLeft(newLeft);
      setRight(newRight);
      const [newBottom, newTop] = getAxisYDomain(newLeft, newRight);
      setBottom(newBottom);
      setTop(newTop);
      setAutoScroll(false);
    }
  }, [isZooming, left, right, formattedData, getAxisYDomain]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!containerRef.current || !isPanning) return;
    setStartX(e.clientX);
  }, [isPanning]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current || !isPanning || !startX) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = (e.clientX - startX) / rect.width;
    const currentViewData = formattedData.filter(d => {
      const index = formattedData.findIndex(item => item.timestamp === d.timestamp);
      return (!left || index >= formattedData.findIndex(item => item.timestamp === left)) &&
             (!right || index <= formattedData.findIndex(item => item.timestamp === right));
    });

    const shift = Math.floor(currentViewData.length * deltaX);
    if (Math.abs(shift) < 1) return;

    const leftIndex = formattedData.findIndex(d => d.timestamp === left);
    const rightIndex = formattedData.findIndex(d => d.timestamp === right);

    const newLeftIndex = Math.max(0, leftIndex - shift);
    const newRightIndex = Math.min(formattedData.length - 1, rightIndex - shift);

    setLeft(formattedData[newLeftIndex]?.timestamp || null);
    setRight(formattedData[newRightIndex]?.timestamp || null);
    setStartX(e.clientX);
    setAutoScroll(false);
  }, [isPanning, startX, left, right, formattedData]);

  const handleMouseUp = useCallback(() => {
    setStartX(0);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleMouseWheel, { passive: false });
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseUp);

    return () => {
      container.removeEventListener('wheel', handleMouseWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [handleMouseWheel, handleMouseDown, handleMouseMove, handleMouseUp]);

  const zoom = useCallback(() => {
    if (refAreaLeft === refAreaRight || refAreaRight === '') {
      setRefAreaLeft('');
      setRefAreaRight('');
      return;
    }

    const [newBottom, newTop] = getAxisYDomain(refAreaLeft, refAreaRight);

    setRefAreaLeft('');
    setRefAreaRight('');
    setLeft(refAreaLeft);
    setRight(refAreaRight);
    setBottom(newBottom);
    setTop(newTop);
    setAutoScroll(false);
  }, [refAreaLeft, refAreaRight, getAxisYDomain]);

  const zoomOut = useCallback(() => {
    setRefAreaLeft('');
    setRefAreaRight('');
    setLeft(null);
    setRight(null);
    setTop('auto');
    setBottom('auto');
    setAutoScroll(true);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`w-full h-[500px] p-6 rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{title}</h3>
        <div className="flex gap-4">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-3 py-1 rounded flex items-center gap-2 ${
              autoScroll
                ? isDark
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
                : isDark
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {autoScroll ? 'Auto-Scroll On' : 'Auto-Scroll Off'}
          </button>
          <button
            onClick={() => setIsZooming(!isZooming)}
            className={`px-3 py-1 rounded flex items-center gap-2 ${
              isZooming
                ? isDark
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-purple-500 text-white hover:bg-purple-600'
                : isDark
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {isZooming ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
            {isZooming ? 'Zoom Active' : 'Zoom'}
          </button>
          <button
            onClick={() => setIsPanning(!isPanning)}
            className={`px-3 py-1 rounded flex items-center gap-2 ${
              isPanning
                ? isDark
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-green-500 text-white hover:bg-green-600'
                : isDark
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            <MoveHorizontal size={16} />
            {isPanning ? 'Pan Active' : 'Pan'}
          </button>
          <button
            onClick={zoomOut}
            className={`px-3 py-1 rounded ${
              isDark
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Reset View
          </button>
        </div>
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
            interval="preserveStartEnd"
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
            isAnimationActive={false}
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