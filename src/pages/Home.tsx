import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, FileSpreadsheet } from 'lucide-react';
import { Theme } from '../utils/types';

interface HomeProps {
  theme: Theme;
}

const Home: React.FC<HomeProps> = ({ theme }: { theme: Theme }) => {
  return (
    <div className="min-h-screen space-y-8 flex items-center justify-center">
      <div className={`p-8 rounded-lg shadow-lg ${theme.isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <h1 className={`text-3xl font-bold mb-4 ${theme.isDark ? 'text-white' : 'text-gray-800'}`}>
          Welcome To MedicoTracker
        </h1>
        <p className={`text-lg mb-8 ${theme.isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Real-Time Medical Data Visualization Tool With Support For Multiple Data Sources And Advanced Analysis Features.
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
              Connect To Various Data Sources Including Arduino, Raspberry Pi, Or Use Simulated Localhost Data For Real-Time Visualization And Analysis.
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
              Upload And Analyze Previously Recorded Data From CSV Files With Our Comprehensive Visualization Tools.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;