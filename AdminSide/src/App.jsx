import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import ProductManagement from './components/ProductManagement';
import SalesAnalytics from './components/SalesAnalytics';
import CustomerManagement from './components/CustomerManagement';
import OrderManagement from './components/OrderManagement';

import Sidebar from './Layout/Sidebar';
import { auth } from './firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import NewsManagement from './components/NewsManagement';
import MessageChatbot from './ai/UpcycledAdminAssistant';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);  
      setLoading(false);
    });

    // 🚨 Logout when user leaves or refreshes page
    const handleUnload = () => {
      signOut(auth);
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      unsubscribe();
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Router>
      <div className="flex h-screen bg-cream">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <MessageChatbot/>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<ProductManagement />} />
            <Route path="/news" element={<NewsManagement />} />
            <Route path="/orders" element={<OrderManagement />} />
            <Route path="/sales" element={<SalesAnalytics />} />
            <Route path="/customers" element={<CustomerManagement />} />  
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
