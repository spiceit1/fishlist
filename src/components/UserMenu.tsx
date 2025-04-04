import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogIn, LogOut, ChevronDown, UserCircle, ShoppingBag, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const UserMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const handleLogout = async () => {
    try {
      await signOut();
      closeMenu();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleLogin = () => {
    closeMenu();
    navigate('/login');
  };

  const handleAccount = () => {
    closeMenu();
    navigate('/account');
  };

  const handleOrders = () => {
    closeMenu();
    navigate('/orders');
  };

  return (
    <div className="relative">
      <button
        onClick={toggleMenu}
        className="flex items-center gap-2 hover:bg-orange-600 px-3 py-2 rounded transition-colors"
        aria-expanded={isOpen}
      >
        <UserCircle className="h-6 w-6" />
        <span className="hidden md:block text-sm font-medium">
          {user ? (user.email?.split('@')[0] || 'Account') : 'Account'}
        </span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          {/* Invisible overlay to capture clicks outside the menu */}
          <div 
            className="fixed inset-0 z-10"
            onClick={closeMenu}
          />

          <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1">
              {user ? (
                <>
                  <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                    <p className="font-medium">Signed in as</p>
                    <p className="truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleAccount}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Your Account
                  </button>
                  <button
                    onClick={handleOrders}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Your Orders
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleLogin}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu; 