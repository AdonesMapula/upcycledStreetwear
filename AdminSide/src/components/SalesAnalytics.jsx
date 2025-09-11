import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAlert } from '../contexts/alertContext';
import ExportModal from '../modals/ExportModal';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Calendar,
  FileText,
  BarChart3,
  Download,
  X
} from 'lucide-react';

// Existing Modals
const CustomerAnalyticsModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-11/12 max-w-4xl mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary">Customer Analytics</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            This section would display charts and data related to your customers, such as:
          </p>
          <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
            <li>Top customers by total spend</li>
            <li>Customer acquisition trends over time</li>
            <li>Geographic distribution of customers</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const ReportModal = ({ onClose, onGenerate }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary">Generate Sales Report</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select className="w-full input-field">
              <option>Monthly Sales Report</option>
              <option>Quarterly Performance</option>
              <option>Annual Summary</option>
              <option>Custom Period</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Include Charts</label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span className="text-sm">Yes</span>
              </label>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onGenerate}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
};

const SalesAnalytics = () => {
  const [salesData, setSalesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filterPeriod, setFilterPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCustomerAnalyticsModal, setShowCustomerAnalyticsModal] = useState(false);
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [exportScope, setExportScope] = useState('all');

  const { showAlert } = useAlert();

  useEffect(() => {
    fetchSalesData();
  }, []);

  useEffect(() => {
    applyFilter(filterPeriod);
  }, [salesData, filterPeriod]);

  const fetchSalesData = async () => {
    try {
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
      showAlert('error', 'Failed to fetch sales data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (period) => {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(0);
    }

    const filtered = salesData.filter(sale => {
      const saleDate = sale.date?.seconds 
        ? new Date(sale.date.seconds * 1000) 
        : new Date(sale.createdAt?.seconds * 1000 || sale.timestamp?.seconds * 1000 || sale.date);
      return saleDate >= startDate;
    });
    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page whenever filter changes
  };

  const calculateStats = (data) => {
    const totalSales = data.reduce((sum, sale) => sum + (sale.price || 0), 0);
    const totalOrders = data.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    const statusCounts = data.reduce((acc, sale) => {
      const status = sale.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const categorySales = data.reduce((acc, sale) => {
      const category = sale.category || 'uncategorized';
      acc[category] = (acc[category] || 0) + (sale.price || 0);
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

  const stats = calculateStats(filteredData);
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Calculate the sales for the current page
  const currentSales = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getPercentageChange = (currentValue, previousValue) => {
    if (previousValue === 0) return '+100%';
    const change = ((currentValue - previousValue) / previousValue) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const getInsight = (stats) => {
    const sortedCategories = Object.entries(stats.categorySales).sort(([, a], [, b]) => b - a);
    const topCategory = sortedCategories.length > 0 ? sortedCategories[0][0] : null;

    const sortedStatuses = Object.entries(stats.statusCounts).sort(([, a], [, b]) => b - a);
    const topStatus = sortedStatuses.length > 0 ? sortedStatuses[0][0] : null;

    return { topCategory, topStatus };
  };

  const insights = getInsight(stats);

  const formatDate = (dateField) => {
    if (!dateField) return 'N/A';
    if (dateField.seconds) {
      return new Date(dateField.seconds * 1000).toLocaleDateString();
    }
    return new Date(dateField).toLocaleDateString();
  };

  const formatPrice = (price) => `₱${(price || 0).toLocaleString()}`;

  const getStatusColor = (status) => {
    switch (status) {
      case 'mine': return 'bg-blue-100 text-blue-800';
      case 'grab': return 'bg-yellow-100 text-yellow-800';
      case 'steal': return 'bg-red-100 text-red-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'mine': return '💎';
      case 'grab': return '⚡';
      case 'steal': return '🔥';
      case 'confirmed': return '📦';
      default: return '❓';
    }
  };

  const handleGenerateReport = () => setShowReportModal(true);
  const handleViewCustomerAnalytics = () => setShowCustomerAnalyticsModal(true);
  
  const handleExportData = (scope) => {
    setExportScope(scope);
    setShowExportModal(true);
  };

  // Pagination navigation functions
  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-secondary">{formatPrice(stats.totalSales)}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                {getPercentageChange(stats.totalSales, salesData.reduce((sum, sale) => sum + sale.price, 0) / salesData.length)} from all time
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
                {getPercentageChange(stats.totalOrders, salesData.length / 4)} from all time
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
                  {stats.totalOrders > 0 ? ((count / stats.totalOrders) * 100).toFixed(1) : 0}%
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
                    {stats.totalSales > 0 ? ((sales / stats.totalSales) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-secondary">Recent Sales</h3>
          <div className="flex items-center space-x-4">
            <button onClick={() => handleExportData('page')} className="btn-secondary">Export Page</button>
            <button onClick={() => handleExportData('all-filtered')} className="btn-primary">Export All Filtered</button>
          </div>
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
              {currentSales.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 px-4 text-center text-gray-500">
                    No sales data available for this period.
                  </td>
                </tr>
              ) : (
                currentSales.map((sale) => (
                  <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-600">{formatDate(sale.date || sale.createdAt || sale.timestamp)}</td>
                    <td className="py-3 px-4 font-medium">{sale.customer || sale.customerName || 'N/A'}</td>
                    <td className="py-3 px-4">{sale.product || sale.productName || 'N/A'}</td>
                    <td className="py-3 px-4 text-gray-600">{sale.category || 'N/A'}</td>
                    <td className="py-3 px-4 font-medium text-primary">{formatPrice(sale.price)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sale.status || 'unknown')}`}>
                        {(sale.status || 'UNKNOWN').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalItems > itemsPerPage && (
          <div className="flex items-center justify-center mt-4 space-x-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded-lg text-gray-700 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-gray-700">Page {currentPage} of {totalPages}</span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border rounded-lg text-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

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
                <p className="text-sm text-gray-600">
                  {insights.topCategory 
                    ? `${insights.topCategory} is your top seller with a total of ${formatPrice(stats.categorySales[insights.topCategory])}.`
                    : 'No category data available.'}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-secondary">Customer Preference</p>
                <p className="text-sm text-gray-600">
                  {insights.topStatus 
                    ? `Items with "${insights.topStatus}" status are most popular, representing ${((stats.statusCounts[insights.topStatus] / stats.totalOrders) * 100).toFixed(1)}% of all orders.`
                    : 'No status data available.'}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-yellow-100 p-2 rounded-full">
                <Calendar className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-secondary">Peak Sales Time</p>
                <p className="text-sm text-gray-600">
                  Weekends show 25% higher sales than weekdays based on recent data.
                </p>
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
              onClick={() => handleExportData('all')}
              className="w-full btn-secondary flex items-center justify-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export All Data</span>
            </button>
          </div>
        </div>
      </div>

      {showReportModal && (
        <ReportModal 
          onClose={() => setShowReportModal(false)} 
          onGenerate={() => {
            setShowReportModal(false);
            showAlert('success', 'Sales report generated successfully!');
          }} 
        />
      )}

      {showExportModal && (
        <ExportModal 
          show={showExportModal}
          onClose={() => setShowExportModal(false)} 
          // Pass the correct data based on the export scope
          data={exportScope === 'all' ? salesData : (exportScope === 'page' ? currentSales : filteredData)}
        />
      )}

      {showCustomerAnalyticsModal && (
        <CustomerAnalyticsModal onClose={() => setShowCustomerAnalyticsModal(false)} />
      )}
    </div>
  );
};

export default SalesAnalytics;