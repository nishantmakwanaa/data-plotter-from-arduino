import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import LiveData from './pages/LiveData';
import CsvData from './pages/CsvData';
import { Theme } from './types';

function App() {
  const [isDark, setIsDark] = useState(false);
  const theme: Theme = {
    isDark,
    toggle: () => setIsDark(!isDark),
  };

  return (
    <BrowserRouter>
      <Layout theme={theme}>
        <Routes>
          <Route path="/" element={<Home theme={theme} />} />
          <Route path="/live" element={<LiveData theme={theme} />} />
          <Route path="/csv" element={<CsvData theme={theme} />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;