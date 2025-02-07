import React from 'react';
import { Circuit } from 'lucide-react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import LiveData from './pages/LiveData';
import OfflineData from './pages/OfflineData';

function Header() {
  const location = useLocation();
  
  return (
    <header className="bg-white shadow-lg">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Circuit className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Arduino Visualizer</h1>
          </div>
          <div className="flex space-x-6">
            <Link
              to="/"
              className={`text-lg font-medium transition-colors ${
                location.pathname === '/' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Live Data
            </Link>
            <Link
              to="/offline"
              className={`text-lg font-medium transition-colors ${
                location.pathname === '/offline'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Offline Analysis
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-white shadow-lg mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center">
          <p className="text-gray-600">© 2025 Arduino Data Visualizer</p>
          <div className="flex space-x-4">
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Documentation</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">GitHub</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <Routes>
          <Route path="/" element={<LiveData />} />
          <Route path="/offline" element={<OfflineData />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;