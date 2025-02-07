import { ChartOptions } from 'chart.js';

export const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  animation: {
    duration: 0
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
      },
    },
    x: {
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: {
    legend: {
      position: 'top' as const,
    },
  },
};

export const generateDummyData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    x: i,
    y: Math.sin(i / 10) * 100 + Math.random() * 20,
  }));
};