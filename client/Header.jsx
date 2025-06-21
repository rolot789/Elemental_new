import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, User, Settings } from 'lucide-react';

const Header = ({ user, onLogout }) => {
  const location = useLocation();

  return (
    <header className="glass-card border-b border-white/10 p-4">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-white">
          Elemental
        </Link>
        
        <nav className="flex items-center space-x-4">
          <Link 
            to="/" 
            className={`px-4 py-2 rounded-lg transition-colors ${
              location.pathname === '/' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            홈
          </Link>
          
          <Link 
            to="/my-bookings" 
            className={`px-4 py-2 rounded-lg transition-colors ${
              location.pathname === '/my-bookings' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            내 예약
          </Link>
          
          {user?.isAdmin && (
            <Link 
              to="/admin" 
              className={`px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/admin' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              관리자
            </Link>
          )}
        </nav>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-white">
            <User className="w-4 h-4" />
            <span>{user?.name || user?.studentId}</span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onLogout}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;

