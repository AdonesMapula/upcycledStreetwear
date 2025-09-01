import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  TrendingUp, 
  Users, 
  LogOut,
  X,
  Newspaper,
  ClipboardList // new icon for orders
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';

const Sidebar = () => {
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/products', icon: Package, label: 'Products' },
    { path: '/news', icon: Newspaper, label: 'News'},
    { path: '/orders', icon: ClipboardList, label: 'Orders' },
    { path: '/sales', icon: TrendingUp, label: 'Sales Analytics' },
    { path: '/customers', icon: Users, label: 'Customers' },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowLogoutModal(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const openLogoutModal = () => {
    setShowLogoutModal(true);
  };

  const closeLogoutModal = () => {
    setShowLogoutModal(false);
  };

  return (
    <>
      <div className="w-64 bg-primary text-white p-6 flex flex-col">
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Upcycled Streetwear Logo" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-xl font-bold">Upcycled Streetwear</h1>
              <p className="text-primary-light text-sm">Admin Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                  isActive 
                    ? 'bg-white text-primary' 
                    : 'text-primary-light hover:bg-white/10'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-8">
          <button
            onClick={openLogoutModal}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-primary-light hover:bg-white/10 transition-colors duration-200 w-full"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary">Confirm Logout</h3>
              <button
                onClick={closeLogoutModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to logout? You will need to sign in again to access the dashboard.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={closeLogoutModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
