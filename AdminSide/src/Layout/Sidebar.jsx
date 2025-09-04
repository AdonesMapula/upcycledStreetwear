"use client"

import { Link, useLocation } from "react-router-dom"
import { useState } from "react"
import { LayoutDashboard, Package, TrendingUp, Users, LogOut, X, Newspaper, Settings, Bell ,ClipboardList} from "lucide-react"
import { signOut } from "firebase/auth"
import { auth } from "../firebase/config"

const Sidebar = () => {
  const location = useLocation()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const menuItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/products", icon: Package, label: "Products" },
    { path: "/news", icon: Newspaper, label: "News" },
    { path: '/orders', icon: ClipboardList, label: 'Orders' },
    { path: "/sales", icon: TrendingUp, label: "Sales Analytics" },
    { path: "/customers", icon: Users, label: "Customers" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ] 

  const handleLogout = async () => {
    try {
      await signOut(auth)
      setShowLogoutModal(false)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const openLogoutModal = () => {
    setShowLogoutModal(true)
  }

  const closeLogoutModal = () => {
    setShowLogoutModal(false)
  }

  return (
    <>
      {/* Sidebar Container - Fixed responsive width */}
      <div className="w-full max-w-[240px] lg:max-w-[300px] bg-[#135918] flex flex-col min-h-screen border-r border-slate-800">
        {/* Header Section */}
        <div className="p-4 sm:p-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="relative flex-shrink-0">
              <img 
                src="/logo.png" 
                alt="Upcycled Streetwear Logo" 
                className="h-10 w-10 sm:h-12 sm:w-12 object-contain p-1 mt-3" 
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg font-bold text-white truncate">Upcycled Streetwear</h1>
              <p className="text-slate-400 text-xs sm:text-sm truncate">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* User Info Section */}
        <div className="p-4 sm:p-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Administrator</p>
              <p className="text-xs text-slate-400 truncate">admin@upcycled.com</p>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 overflow-y-auto">
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-3">
              Main Menu
            </p>
            <div className="space-y-1">
              {menuItems.slice(0, 6).map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group relative flex items-center space-x-2 sm:space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? "bg-[#113A14] text-white shadow-lg" 
                        : "text-slate-300 hover:text-white hover:bg-[#1d8525]"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00ff11] rounded-r-full"></div>
                    )}
                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"} transition-colors`} />
                    <span className="font-medium text-sm sm:text-base truncate">{item.label}</span>

                  </Link>
                )
              })}
            </div>
          </div>
          
        </nav>

        {/* Footer Section */}
        <div className="border-t border-slate-800 p-3 sm:p-4">
          <button
            onClick={openLogoutModal}
            className="group flex items-center space-x-2 sm:space-x-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 w-full"
          >
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-slate-400 group-hover:text-red-400 transition-colors" />
            <span className="font-medium text-sm sm:text-base truncate">Sign Out</span>
          </button>
          
          {/* Status Bar */}
          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="truncate">System Status</span>
              <div className="flex items-center space-x-1 flex-shrink-0">
                <div className="h-2 w-2 bg-[#135918] rounded-full"></div>
                <span>Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-md mx-4 border border-gray-200">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <LogOut className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">Sign Out</h3>
              </div>
              <button 
                onClick={closeLogoutModal} 
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-colors flex-shrink-0"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            <div className="mb-4 sm:mb-6">
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                Are you sure you want to sign out of your account? You'll need to enter your credentials again to access the admin portal.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={closeLogoutModal}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200 shadow-sm text-sm sm:text-base"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Sidebar