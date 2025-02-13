import { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Activity, FileSpreadsheet, Menu, Moon, Sun, X } from 'lucide-react';
import Home from './pages/Home';
import LiveData from './pages/LiveData';
import CsvData from './pages/CsvData';
import { Theme } from './utils/types';

function App() {
  const [isDark, setIsDark] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const theme: Theme = {
    isDark,
    toggle: () => setIsDark(!isDark),
  };

  const location = useLocation();

  return (
    <div className={`min-h-screen transition-all duration-300 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>

      <header className={`shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            MedicoTracker
          </h1>

          <div className="flex items-center gap-4 md:hidden">
            <button className="p-2" onClick={theme.toggle}>
              {isDark ? <Sun size={24} className="text-white" /> : <Moon size={24} className="text-gray-800" />}
            </button>
            <button onClick={() => setIsDrawerOpen(true)} title="Open Menu">
              <Menu size={24} className={isDark ? 'text-white' : 'text-gray-800'} />
            </button>
          </div>

          <div className="hidden md:flex gap-4 items-center">
            <button className="p-2" onClick={theme.toggle}>
              {isDark ? <Sun size={24} className="text-white" /> : <Moon size={24} className="text-gray-800" />}
            </button>
            {[
              { path: '/', label: 'Home', Icon: Activity },
              { path: '/live', label: 'Live Data', Icon: Activity },
              { path: '/csv', label: 'CSV Data', Icon: FileSpreadsheet },
            ].map(({ path, label, Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                  location.pathname === path
                    ? isDark
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-200 text-gray-800'
                    : isDark
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {isDrawerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={() => setIsDrawerOpen(false)}>
          <div className={`w-64 h-auto shadow-lg p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            <button className="mb-4" onClick={() => setIsDrawerOpen(false)} title="Close">
              <X size={24} className={isDark ? 'text-white' : 'text-gray-800'} />
            </button>
            <nav className="flex flex-col gap-4">
              {[
                { path: '/', label: 'Home', Icon: Activity },
                { path: '/live', label: 'Live Data', Icon: Activity },
                { path: '/csv', label: 'CSV Data', Icon: FileSpreadsheet },
              ].map(({ path, label, Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    location.pathname === path
                      ? isDark
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-200 text-gray-800'
                      : isDark
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => setIsDrawerOpen(false)}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Home theme={theme} />} />
          <Route path="/live" element={<LiveData theme={theme} />} />
          <Route path="/csv" element={<CsvData theme={theme} />} />
        </Routes>
      </main>

      <footer className={`${isDark ? 'bg-gray-800' : 'bg-white'} mt-auto`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-center">
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            MedicoTracker © 2025 - All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;