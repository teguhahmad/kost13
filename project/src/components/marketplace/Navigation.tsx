import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Heart, MessageSquare, User, Store } from 'lucide-react';

interface NavigationProps {
  className?: string;
}

const Navigation: React.FC<NavigationProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/marketplace', label: 'Beranda', icon: Home },
    { path: '/marketplace/saved', label: 'Favorit', icon: Heart },
    { path: '/marketplace/chat', label: 'Chat', icon: MessageSquare },
    { path: '/marketplace/profile', label: 'Akun', icon: User },
  ];

  return (
    <>
      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden">
        <div className="grid grid-cols-4 h-16">
          {navItems.map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              className={`flex flex-col items-center justify-center ${
                isActive(path) ? 'text-blue-600' : 'text-gray-600'
              }`}
              onClick={() => navigate(path)}
            >
              <Icon size={20} />
              <span className="text-xs mt-1">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className={`hidden lg:flex flex-col bg-white border-r border-gray-200 h-screen fixed left-0 top-0 w-20 ${className}`}>
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          <Store className="h-8 w-8 text-blue-600" />
        </div>
        <div className="flex flex-col items-center py-8 space-y-8">
          {navItems.map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              className={`flex flex-col items-center justify-center w-full p-2 group relative ${
                isActive(path) ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
              }`}
              onClick={() => navigate(path)}
            >
              <Icon size={24} />
              <span className="text-xs mt-1">{label}</span>
              {isActive(path) && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Navigation;