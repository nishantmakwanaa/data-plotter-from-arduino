import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-800">Medical Monitoring App</span>
          </Link>
          <div className="space-x-6">
            <Link 
              to="/" 
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Live Monitoring
            </Link>
            <Link 
              to="/historical" 
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Historical Data
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header