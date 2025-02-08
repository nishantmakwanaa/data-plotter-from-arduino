import { Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white shadow-md mt-8">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center space-x-2">
          <Heart className="h-5 w-5 text-red-500" />
          <span className="text-gray-600">
            Medical Monitoring System {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;