import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, FileSpreadsheet, Home, Moon, Sun } from 'lucide-react';
import { Theme } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  theme: Theme;
}

const Layout: React.FC<LayoutProps> = ({ children, theme }) => {
  const location = useLocation();

  return (
    <div className={`min-h-screen ${theme.isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <header className={`${theme.isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className={`text-2xl font-bold ${theme.isDark ? 'text-white' : 'text-gray-800'}`}>
              Medical Data Viz
            </h1>
            <div className="flex gap-4">
              <Link
                to="/"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  location.pathname === '/'
                    ? theme.isDark
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-200 text-gray-800'
                    : theme.isDark
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Home size={16} />
                Home
              </Link>
              <Link
                to="/live"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  location.pathname === '/live'
                    ? theme.isDark
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-200 text-gray-800'
                    : theme.isDark
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Activity size={16} />
                Live Data
              </Link>
              <Link
                to="/csv"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  location.pathname === '/csv'
                    ? theme.isDark
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-200 text-gray-800'
                    : theme.isDark
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FileSpreadsheet size={16} />
                CSV Data
              </Link>
            </div>
          </div>
          <button
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              theme.isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
            onClick={theme.toggle}
          >
            {theme.isDark ? <Sun size={16} /> : <Moon size={16} />}
            {theme.isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className={`${theme.isDark ? 'bg-gray-800' : 'bg-white'} mt-auto`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-center">
          <p className={theme.isDark ? 'text-gray-400' : 'text-gray-600'}>
            © 2024 Medical Data Visualization. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;