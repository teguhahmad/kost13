import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Heart, MessageSquare, User } from 'lucide-react';

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
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-lg px-12 py-3 z-50 ${className}`}
    >
      <div className="flex items-center gap-10">
        {navItems.map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            className={`flex flex-col items-center ${
              isActive(path)
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            } transition-colors duration-300`}
            onClick={() => navigate(path)}
          >
            <Icon size={24} />
            <span className="text-xs mt-1">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Navigation;
