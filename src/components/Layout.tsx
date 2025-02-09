import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, FileSpreadsheet, Home, Menu, Moon, Sun, X } from 'lucide-react';
import { Theme } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  theme: Theme;
}

const Layout: React.FC<LayoutProps> = ({ children, theme }) => {
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className={`min-h-screen ${theme.isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <header className={`${theme.isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className={`text-2xl font-bold ${theme.isDark ? 'text-white' : 'text-gray-800'}`}>MedicoTracker</h1>
          
          <div className="flex items-center gap-4 md:hidden">
            <button className="p-2" onClick={theme.toggle}>
              {theme.isDark ? <Sun size={24} className="text-white" /> : <Moon size={24} className="text-gray-800" />}
            </button>
            <button onClick={() => setIsDrawerOpen(true)} title="Open Menu">
              <Menu size={24} className={theme.isDark ? 'text-white' : 'text-gray-800'} />
            </button>
          </div>
          
          <div className="hidden md:flex gap-4 items-center">
            <button className="p-2" onClick={theme.toggle}>
              {theme.isDark ? <Sun size={24} className="text-white" /> : <Moon size={24} className="text-gray-800" />}
            </button>
            {['/', '/live', '/csv'].map((path, index) => {
              const labels = ['Home', 'Live Data', 'CSV Data'];
              const icons = [Home, Activity, FileSpreadsheet];
              const Icon = icons[index];
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    location.pathname === path
                      ? theme.isDark
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-200 text-gray-800'
                      : theme.isDark
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={16} />
                  {labels[index]}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {isDrawerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={() => setIsDrawerOpen(false)}>
          <div className={`${theme.isDark ? 'bg-gray-800' : 'bg-white'} w-64 h-auto shadow-lg p-4 rounded-lg`} onClick={(e) => e.stopPropagation()}>
            <button className="mb-4" onClick={() => setIsDrawerOpen(false)} title="Close">
              <X size={24} className={theme.isDark ? 'text-white' : 'text-gray-800'} />
            </button>
            <nav className="flex flex-col gap-4">
              {['/', '/live', '/csv'].map((path, index) => {
                const labels = ['Home', 'Live Data', 'CSV Data'];
                const icons = [Home, Activity, FileSpreadsheet];
                const Icon = icons[index];
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      location.pathname === path
                        ? theme.isDark
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-200 text-gray-800'
                        : theme.isDark
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    <Icon size={16} />
                    {labels[index]}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className={`${theme.isDark ? 'bg-gray-800' : 'bg-white'} mt-auto`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-center">
          <p className={theme.isDark ? 'text-gray-400' : 'text-gray-600'}>
          MedicoTracker © 2025 - All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;