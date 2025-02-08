import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import LiveMonitoring from './pages/LiveMonitoring';
import HistoricalData from './pages/HistoricalData';
import Home from './pages/Home';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/live" element={<LiveMonitoring />} />
            <Route path="/historical" element={<HistoricalData />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;