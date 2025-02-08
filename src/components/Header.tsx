import { Link } from 'react-router-dom';
import { Activity, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        
        <Link to="/" className="flex items-center space-x-2">
          <Activity className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-800">Medical Monitoring App</span>
        </Link>

        <div className="hidden md:flex space-x-6">
          <Link to="/" className="text-gray-600 font-semibold hover:text-blue-600 transition-colors">
            Live
          </Link>
          <Link to="/historical" className="text-gray-600 font-semibold hover:text-blue-600 transition-colors">
            Historical
          </Link>
        </div>

        <div className="md:hidden">
          <button onClick={() => setIsDrawerOpen(!isDrawerOpen)} className="p-2" title="Open menu">
            <Menu className="h-7 w-7 text-gray-800" />
          </button>
        </div>
      </div>

      {isDrawerOpen && (
        <div className="absolute top-full left-0 w-full bg-white shadow-md p-6 z-50">

          <div className="flex justify-end">
            <button onClick={() => setIsDrawerOpen(false)} className="p-2" aria-label="Close menu">
              <X className="h-7 w-7 text-gray-800" />
            </button>
          </div>

          <div className="flex flex-col space-y-4 text-center mt-4">
          <Link
              to="/"
              onClick={() => setIsDrawerOpen(false)}
              className="text-gray-800 font-semibold text-lg hover:text-blue-600 transition-colors"
            >
              Home
            </Link>
            <Link
              to="/live"
              onClick={() => setIsDrawerOpen(false)}
              className="text-gray-800 font-semibold text-lg hover:text-blue-600 transition-colors"
            >
              Live
            </Link>
            <Link
              to="/historical"
              onClick={() => setIsDrawerOpen(false)}
              className="text-gray-800 font-semibold text-lg hover:text-blue-600 transition-colors"
            >
              Historical
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;