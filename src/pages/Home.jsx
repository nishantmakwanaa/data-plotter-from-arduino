import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div 
      className="h-screen flex flex-col items-center justify-center px-6 bg-cover bg-center space-y-8" 
      style={{ backgroundImage: "url('/medical-chart-bg.jpg')" }}
    >
      <h1 className="text-5xl font-bold text-black text-center drop-shadow-lg">
        Welcome To Our Medical Data Analytics Platform
      </h1>
      <p className="text-lg text-black text-center max-w-2xl drop-shadow-md">
        Monitor and analyze patient data effectively.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-lg">
      <Link 
          to="/live" 
          className="bg-green-600 text-white text-2xl font-semibold p-6 rounded-xl shadow-lg text-center 
          hover:bg-green-700 transform hover:scale-105 transition-all duration-300"
        >
          Live Monitoring
        </Link>
        <Link 
          to="/historical" 
          className="bg-blue-600 text-white text-2xl font-semibold p-6 rounded-xl shadow-lg text-center 
          hover:bg-blue-700 transform hover:scale-105 transition-all duration-300"
        >
          Historical Data
        </Link>
      </div>
    </div>
  );
};

export default Home;