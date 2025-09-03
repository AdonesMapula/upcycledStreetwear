import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import ProductManagement from './components/ProductManagement';
import SalesAnalytics from './components/SalesAnalytics';
import CustomerManagement from './components/CustomerManagement';
import NewsManagement from './components/NewsManagement';
import OrderManagement from './components/OrderManagement';
import AiChatbot from './components/AiChatbot'; 

import Sidebar from './components/Sidebar';
import { auth } from './firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
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
        <AiChatbot /> 
        <main className="flex-1 overflow-auto">
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
