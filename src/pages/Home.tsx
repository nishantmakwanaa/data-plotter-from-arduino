import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, FileSpreadsheet } from 'lucide-react';
import { Theme } from '../types';

interface HomeProps {
  theme: Theme;
}

const Home: React.FC<HomeProps> = ({ theme }) => {
  return (
    <div className="space-y-8">
      <div className={`p-8 rounded-lg shadow-lg ${theme.isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <h1 className={`text-3xl font-bold mb-4 ${theme.isDark ? 'text-white' : 'text-gray-800'}`}>
          Welcome to Medical Data Visualization
        </h1>
        <p className={`text-lg mb-8 ${theme.isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Real-time medical data visualization tool with support for multiple data sources and advanced analysis features.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Link
            to="/live"
            className={`p-6 rounded-lg transition-transform transform hover:scale-105 ${
              theme.isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-4 mb-4">
              <Activity size={24} className={theme.isDark ? 'text-blue-400' : 'text-blue-600'} />
              <h2 className={`text-xl font-semibold ${theme.isDark ? 'text-white' : 'text-gray-800'}`}>
                Live Data Visualization
              </h2>
            </div>
            <p className={theme.isDark ? 'text-gray-300' : 'text-gray-600'}>
              Connect to various data sources including Arduino, Raspberry Pi, or use simulated localhost data for real-time visualization and analysis.
            </p>
          </Link>

          <Link
            to="/csv"
            className={`p-6 rounded-lg transition-transform transform hover:scale-105 ${
              theme.isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-4 mb-4">
              <FileSpreadsheet size={24} className={theme.isDark ? 'text-green-400' : 'text-green-600'} />
              <h2 className={`text-xl font-semibold ${theme.isDark ? 'text-white' : 'text-gray-800'}`}>
                CSV Data Analysis
              </h2>
            </div>
            <p className={theme.isDark ? 'text-gray-300' : 'text-gray-600'}>
              Upload and analyze previously recorded data from CSV files with our comprehensive visualization tools.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;