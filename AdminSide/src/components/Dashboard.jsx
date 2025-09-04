import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign,
  Clock,
  AlertCircle,
  Plus,
  FileText,
  Settings,
  X
} from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config.js';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSales: 0,
    totalProducts: 0,
    totalCustomers: 0,
    monthlySales: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [latestNews, setLatestNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
  setLoading(true);
  try {
    // Fetch all products
    const productsSnap = await getDocs(collection(db, "products"));
    const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Fetch all orders
    const ordersSnap = await getDocs(collection(db, "orders"));
    const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Helper to get month/year from string date
    const getMonthYear = (dateStr) => {
      const d = new Date(dateStr);
      return { month: d.getMonth(), year: d.getFullYear() };
    };

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Filter orders by month
    const currentMonthOrders = orders.filter(order => {
      const { month, year } = getMonthYear(order.date);
      return month === currentMonth && year === currentYear;
    });

    const prevMonthOrders = orders.filter(order => {
      const { month, year } = getMonthYear(order.date);
      return month === prevMonth && year === prevYear;
    });

    // Calculate totals
    const totalSales = orders.reduce((sum, order) => sum + (order.price || 0), 0);
    const totalProducts = products.length;
    const totalCustomers = new Set(orders.map(order => order.customerId)).size;

    const monthlySales = currentMonthOrders.reduce((sum, order) => sum + (order.price || 0), 0);
    const prevMonthlySales = prevMonthOrders.reduce((sum, order) => sum + (order.price || 0), 0);

    const currentMonthCustomers = new Set(currentMonthOrders.map(order => order.customerId)).size;
    const prevMonthCustomers = new Set(prevMonthOrders.map(order => order.customerId)).size;

    // Growth calculation helper
    const calcGrowth = (current, prev) => {
      if (prev === 0 && current > 0) return 100; // from 0 to something
      if (prev === 0 && current === 0) return 0; // no change
      return (((current - prev) / prev) * 100).toFixed(1);
    };

    const salesGrowth = calcGrowth(monthlySales, prevMonthlySales);
    const customerGrowth = calcGrowth(currentMonthCustomers, prevMonthCustomers);

    // Set stats
    setStats({
      totalSales: totalSales || 0,
      totalProducts: totalProducts || 0,
      totalCustomers: totalCustomers || 0,
      monthlySales: monthlySales || 0,
      salesGrowth: salesGrowth,
      customerGrowth: customerGrowth
    });

    // Fetch recent orders (last 5)
    const recentOrdersQuery = query(
      collection(db, "orders"),
      orderBy("date", "desc"),
      limit(5)
    );
    const recentOrdersSnap = await getDocs(recentOrdersQuery);
    const recentOrders = recentOrdersSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date // already a string
    }));
    setRecentOrders(recentOrders);

    // --- NEW: Fetch latest 3 news ordered by createdAt descending ---
    const newsQuery = query(
      collection(db, "News"),
      orderBy("createdAt", "desc"),
      limit(3)
    );
    const newsSnap = await getDocs(newsQuery);
    const latestNews = newsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setLatestNews(latestNews); // <-- Make sure you have const [latestNews, setLatestNews] = useState([]); declared

  } catch (error) {
    console.error("Error fetching dashboard data:", error);
  } finally {
    setLoading(false);
  }
};


  const getStatusColor = (status) => {
    switch (status) {
      case 'mine':
        return 'bg-blue-100 text-blue-800';
      case 'grab':
        return 'bg-yellow-100 text-yellow-800';
      case 'steal':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price) => {
    return `₱${price.toLocaleString()}`;
  };

  // Quick Action Handlers
  const handleAddNewProduct = () => {
    setShowAddProductModal(true);
  };

  const handleViewSalesReport = () => {
    navigate('/sales');
  };

  const handleManageInventory = () => {
    setShowInventoryModal(true);
  };

  const handleViewAllOrders = () => {
    navigate('/sales');
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const StatCard = ({ label, value, growth, icon: Icon, bgColor, iconColor }) => {
    const isPositive = growth >= 0;
  
    return (
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{label}</p>
            <p className="text-2xl font-bold text-secondary">{value}</p>
            <p
              className={`text-sm flex items-center mt-1 ${
                isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {growth.toFixed(1)}% from last period
            </p>
          </div>
          <div className={`${bgColor} p-3 rounded-full`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to your Upcycled Streetwear admin panel</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-secondary">{formatPrice(stats.totalSales)}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Sales</p>
              <p className="text-2xl font-bold text-secondary">{formatPrice(stats.monthlySales)}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-secondary">{stats.totalProducts}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-secondary">{stats.totalCustomers}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-secondary">Recent Orders</h2>
          <button onClick={handleViewAllOrders} className="btn-secondary">View All</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Customer</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Product</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Price</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">{order.customer}</td>
                  <td className="py-3 px-4">{order.product}</td>
                  <td className="py-3 px-4 font-medium">{formatPrice(order.price)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

        {/* Latest News */}
        <div className="card mt-8">
          <h2 className="text-xl font-semibold text-secondary mb-4">Latest News</h2>
          {latestNews.length === 0 ? (
            <p className="text-gray-600">No news available.</p>
          ) : (
            <ul className="space-y-4">
              {latestNews.map((news) => (
                <li key={news.id} className="border-b border-gray-200 pb-3 last:border-none">
                  <h3 className="text-lg font-semibold text-primary">{news.name || news.title}</h3>
                  <p className="text-gray-600 line-clamp-2">{news.description}</p>
                  {news.imageUrl && (
                    <img
                      src={news.imageUrl}
                      alt={news.name || news.title}
                      className="mt-2 rounded-md w-full max-h-40 object-cover"
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={handleAddNewProduct}
              className="w-full btn-primary flex items-center justify-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Product</span>
            </button>
            <button 
              onClick={handleViewSalesReport}
              className="w-full btn-secondary flex items-center justify-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>View Sales Report</span>
            </button>
            <button 
              onClick={handleManageInventory}
              className="w-full btn-secondary flex items-center justify-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Manage Inventory</span>
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-secondary mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Database</span>
              <span className="text-green-600 font-medium">Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Storage</span>
              <span className="text-green-600 font-medium">Available</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Auto-cleanup</span>
              <span className="text-green-600 font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary">Add New Product</h3>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">
              Navigate to the Products page to add new items to your inventory.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddProductModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowAddProductModal(false);
                  navigate('/products');
                }}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Go to Products
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Management Modal */}
      {showInventoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary">Inventory Management</h3>
              <button
                onClick={() => setShowInventoryModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Available Products</span>
                <span className="font-semibold text-primary">{stats.totalProducts}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Low Stock Items</span>
                <span className="font-semibold text-orange-600">3</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Out of Stock</span>
                <span className="font-semibold text-red-600">1</span>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowInventoryModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowInventoryModal(false);
                  navigate('/products');
                }}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Manage Products
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;