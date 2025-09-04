import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, setDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Calendar,
  Filter,
  FileText,
  BarChart3,
  Target,
  Download,
  X
} from 'lucide-react';
import ExportModal from "../modals/ExportModal";
import ReportModal from "../modals/ReportModal";
import SalesTargetsModal from "../modals/SalesTargetsModal";

const SalesAnalytics = () => {
  const navigate = useNavigate();
  const [salesData, setSalesData] = useState([]);
  const [filterPeriod, setFilterPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showTargetsModal, setShowTargetsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const [targets, setTargets] = useState(null);

  useEffect(() => {
    fetchSalesData();
  }, [filterPeriod]);

  // Fetch saved targets when component mounts
  useEffect(() => {
    const fetchTargets = async () => {
      try {
        const docRef = doc(db, "settings", "salesTargets");
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setTargets(snapshot.data());
        }
      } catch (error) {
        console.error("Error fetching targets:", error);
      }
    };
    fetchTargets();
  }, []);

  // Save new targets
  const handleSaveTargets = async (newTargets) => {
    try {
      const docRef = doc(db, "settings", "salesTargets");
      await setDoc(docRef, newTargets, { merge: true });

      setTargets(newTargets);

      toast.success("Sales targets saved to Firestore!");
    } catch (error) {
      console.error("Error saving targets:", error);
      toast.error("Failed to save targets.");
    }
  };
  const fetchSalesData = async () => {
    try {
      // Fetch orders from Firebase
      const ordersRef = collection(db, 'orders');
      const ordersSnapshot = await getDocs(ordersRef);
      
      if (!ordersSnapshot.empty) {
        const ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSalesData(ordersData);
      } else {
        setSalesData([]);
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const totalSales = data.reduce((sum, sale) => sum + sale.price, 0);
    const totalOrders = data.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    const statusCounts = data.reduce((acc, sale) => {
      acc[sale.status] = (acc[sale.status] || 0) + 1;
      return acc;
    }, {});

    const categorySales = data.reduce((acc, sale) => {
      acc[sale.category] = (acc[sale.category] || 0) + sale.price;
      return acc;
    }, {});

    return {
      totalSales,
      totalOrders,
      avgOrderValue,
      statusCounts,
      categorySales
    };
  };
  const getFilteredSales = () => {
    if (!salesData || salesData.length === 0) return [];

    const now = new Date();

    return salesData.filter((sale) => {
      const saleDate = new Date(sale.date); // convert string → Date

      switch (filterPeriod) {
        case 'week': {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(now.getDate() - 7);
          return saleDate >= oneWeekAgo && saleDate <= now;
        }
        case 'month': {
          return (
            saleDate.getMonth() === now.getMonth() &&
            saleDate.getFullYear() === now.getFullYear()
          );
        }
        case 'quarter': {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const saleQuarter = Math.floor(saleDate.getMonth() / 3);
          return (
            saleQuarter === currentQuarter &&
            saleDate.getFullYear() === now.getFullYear()
          );
        }
        case 'year': {
          return saleDate.getFullYear() === now.getFullYear();
        }
        default:
          return true;
      }
    });
  };
  const filteredSales = getFilteredSales();
  const stats = calculateStats(filteredSales);

    const formatPrice = (price) => {
      if (typeof price !== "number" || isNaN(price)) {
        return "₱0";
      }
      return `₱${price.toLocaleString()}`;
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'mine':
        return '💎';
      case 'grab':
        return '⚡';
      case 'steal':
        return '🔥';
      case 'confirmed':
        return '📦';
      case 'pending':
        return '⏳';
      case 'delivered':
        return '✅';
      case 'completed':
        return '🎉';
      default:
        return '❌';
    }
  };

  // Quick Action Handlers
  const handleGenerateReport = () => {
    setShowReportModal(true);
  };

  const handleViewCustomerAnalytics = () => {
    navigate('/customers');
  };

  const handleSetSalesTargets = () => {
    setShowTargetsModal(true);
  };

  const handleExportData = () => {
    setShowExportModal(true);
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
  // Prevent crashes when targets or salesData are missing
  if (!salesData || !Array.isArray(salesData)) {
    return <p className="text-gray-500">Loading sales data...</p>;
  }

  if (!targets) {
    return <p className="text-gray-500">Loading sales targets...</p>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary mb-2">Sales Analytics</h1>
          <p className="text-gray-600">Track your sales performance and insights</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="input-field"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>
      {/* Sales Targets Section */}
      {!targets ? (
        <p className="text-gray-500">Loading sales targets...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 p-4 rounded-2xl shadow-sm">
            <p className="text-sm font-medium text-gray-600">Revenue Target</p>
            <p className="text-2xl font-bold text-secondary">
              {formatPrice(targets.targetSales)}
            </p>
            <p className="text-sm text-gray-600">
              Achieved:{" "}
              <span className="font-medium text-green-600">
                {formatPrice(targets.achievedSales)}
              </span>
            </p>
            <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{
                  width: `${Math.min(
                    (targets.achievedSales / targets.targetSales) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl shadow-sm">
            <p className="text-sm font-medium text-gray-600">Orders Target</p>
            <p className="text-2xl font-bold text-secondary">
              {targets.targetOrders}
            </p>
            <p className="text-sm text-gray-600">
              Achieved:{" "}
              <span className="font-medium text-green-600">
                {targets.achievedOrders}
              </span>
            </p>
            <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{
                  width: `${Math.min(
                    (targets.achievedOrders / targets.targetOrders) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl shadow-sm">
            <p className="text-sm font-medium text-gray-600">Conversion Rate Target</p>
            <p className="text-2xl font-bold text-secondary">
              {targets.conversionTarget}%
            </p>
            <p className="text-sm text-gray-600">
              Achieved:{" "}
              <span className="font-medium text-green-600">
                {targets.conversionAchieved}%
              </span>
            </p>
            <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
              <div
                className="bg-orange-500 h-2 rounded-full"
                style={{
                  width: `${Math.min(
                    (targets.conversionAchieved / targets.conversionTarget) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-secondary">{formatPrice(stats.totalSales)}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                +12.5% from last period
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-secondary">{stats.totalOrders}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                +8.3% from last period
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Order</p>
              <p className="text-2xl font-bold text-secondary">{formatPrice(stats.avgOrderValue)}</p>
              <p className="text-sm text-red-600 flex items-center mt-1">
                <TrendingDown className="h-4 w-4 mr-1" />
                -2.1% from last period
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-secondary">68.5%</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                +5.2% from last period
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Sales by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary mb-4">Sales by Status</h3>
          <div className="space-y-4">
            {Object.entries(stats.statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getStatusIcon(status)}</span>
                  <div>
                    <p className="font-medium text-secondary capitalize">{status}</p>
                    <p className="text-sm text-gray-600">{count} order(s)</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                  {((count / stats.totalOrders) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-secondary mb-4">Sales by Category</h3>
          <div className="space-y-4">
            {Object.entries(stats.categorySales)
              .sort(([,a], [,b]) => b - a)
              .map(([category, sales]) => (
                <div key={category} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-secondary">{category}</p>
                    <p className="text-sm text-gray-600">{formatPrice(sales)}</p>
                  </div>
                  <span className="text-sm font-medium text-primary">
                    {((sales / stats.totalSales) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-secondary">Recent Sales</h3>
          <button onClick={handleExportData} className="btn-secondary">Export Data</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Customer</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Product</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Price</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(sale.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 font-medium">{sale.customer}</td>
                  <td className="py-3 px-4">{sale.product}</td>
                  <td className="py-3 px-4 text-gray-600">{sale.category}</td>
                  <td className="py-3 px-4 font-medium text-primary">{formatPrice(sale.price)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
                      {sale.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary mb-4">Top Insights</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="bg-green-100 p-2 rounded-full">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-secondary">Best Performing Category</p>
                <p className="text-sm text-gray-600">Jackets are your top seller with 40% of total sales</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-secondary">Customer Preference</p>
                <p className="text-sm text-gray-600">"Mine" status items have highest conversion rate</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-yellow-100 p-2 rounded-full">
                <Calendar className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-secondary">Peak Sales Time</p>
                <p className="text-sm text-gray-600">Weekends show 25% higher sales than weekdays</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-secondary mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={handleGenerateReport}
              className="w-full btn-primary flex items-center justify-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>Generate Sales Report</span>
            </button>
            <button 
              onClick={handleViewCustomerAnalytics}
              className="w-full btn-secondary flex items-center justify-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>View Customer Analytics</span>
            </button>
            <button 
              onClick={handleSetSalesTargets}
              className="w-full btn-secondary flex items-center justify-center space-x-2"
            >
              <Target className="h-4 w-4" />
              <span>Set Sales Targets</span>
            </button>
            <button 
              onClick={handleExportData}
              className="w-full btn-secondary flex items-center justify-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        show={showExportModal}
        onClose={() => setShowExportModal(false)}
        data={filteredSales}
      />
      {/* Report Modal */}
      <ReportModal
        show={showReportModal}
        onClose={() => setShowReportModal(false)}
        data={filteredSales}
      />
      {/* Targets Modal */}
      <SalesTargetsModal
        show={showTargetsModal}
        onClose={() => setShowTargetsModal(false)}
        onSave={handleSaveTargets}
      />
    </div>
  );
};

export default SalesAnalytics;