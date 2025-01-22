import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  Ticket,
  Book,
  Settings,
  LogOut,
  User,
} from 'lucide-react';

function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Ticket className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">
                  ModernDesk
                </span>
              </div>
              
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
                <Link
                  to="/tickets"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  <Ticket className="h-4 w-4 mr-2" />
                  Tickets
                </Link>
                <Link
                  to="/knowledge-base"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  <Book className="h-4 w-4 mr-2" />
                  Knowledge Base
                </Link>
              </div>
            </div>

            <div className="flex items-center">
              <Link
                to="/settings"
                className="p-2 text-gray-500 hover:text-gray-900"
              >
                <Settings className="h-5 w-5" />
              </Link>
              
              <div className="ml-3 relative flex items-center space-x-4">
                <div className="flex items-center">
                  <User className="h-8 w-8 text-gray-400 bg-gray-100 rounded-full p-1" />
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {user?.email}
                  </span>
                </div>
                
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-500 hover:text-gray-900"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;