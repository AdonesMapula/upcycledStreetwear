import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  endBefore,
  getDocs,
  doc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";

const PAGE_SIZE = 12;

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [lastDoc, setLastDoc] = useState(null);
  const [firstDoc, setFirstDoc] = useState(null);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Stats
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    declined: 0,
    grab: 0,
    sold: 0
  });

  // Format Firestore Timestamp or string date
  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    if (dateValue.toDate) {
      return dateValue.toDate().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return new Date(dateValue).toLocaleString();
  };

  // Calculate relative time
  const getRelativeTime = (dateValue) => {
    if (!dateValue) return "Unknown";
    const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateValue);
  };

  // Get status color and icon
  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: "⏳", label: "Pending" },
      confirmed: { color: "bg-green-100 text-green-800 border-green-200", icon: "✅", label: "Confirmed" },
      declined: { color: "bg-red-100 text-red-800 border-red-200", icon: "❌", label: "Declined" },
      grab: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: "🚚", label: "Ready for Pickup" },
      sold: { color: "bg-purple-100 text-purple-800 border-purple-200", icon: "💰", label: "Completed" },
      processing: { color: "bg-orange-100 text-orange-800 border-orange-200", icon: "⚙️", label: "Processing" }
    };
    return statusMap[status] || statusMap.pending;
  };

  // Calculate order statistics
  const calculateStats = (orderList) => {
    const stats = {
      total: orderList.length,
      pending: 0,
      confirmed: 0,
      declined: 0,
      grab: 0,
      sold: 0
    };

    orderList.forEach(order => {
      if (stats[order.status] !== undefined) {
        stats[order.status]++;
      }
    });

    setOrderStats(stats);
  };

  // Fetch paginated orders
  const fetchOrders = async (direction = "initial") => {
    setLoading(true);
    try {
      let q;
      const ordersRef = collection(db, "orders");
      let queryConstraints = [orderBy("date", "desc"), limit(PAGE_SIZE)];

      // Apply status filter
      if (statusFilter !== "all") {
        queryConstraints.unshift(where("status", "==", statusFilter));
      }

      if (direction === "next" && lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
      } else if (direction === "prev" && firstDoc) {
        queryConstraints.push(endBefore(firstDoc));
      }

      q = query(ordersRef, ...queryConstraints);
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        let orderList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Apply search filter
        if (searchTerm) {
          orderList = orderList.filter(order =>
            order.customerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.product?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        // Apply date filter
        if (dateFilter !== "all") {
          const now = new Date();
          orderList = orderList.filter(order => {
            const orderDate = order.date?.toDate ? order.date.toDate() : new Date(order.date);
            const diffDays = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));
            
            switch (dateFilter) {
              case "today": return diffDays === 0;
              case "week": return diffDays <= 7;
              case "month": return diffDays <= 30;
              default: return true;
            }
          });
        }

        setOrders(orderList);
        setFirstDoc(snapshot.docs[0]);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

        setHasPrev(direction !== "initial" && page > 1);
        setHasNext(snapshot.docs.length === PAGE_SIZE);

        if (direction === "next") setPage((prev) => prev + 1);
        if (direction === "prev") setPage((prev) => Math.max(prev - 1, 1));

        calculateStats(orderList);
      } else {
        setOrders([]);
        setOrderStats({
          total: 0,
          pending: 0,
          confirmed: 0,
          declined: 0,
          grab: 0,
          sold: 0
        });
      }
    } catch (err) {
      console.error("Error fetching orders: ", err);
      setError("Failed to load orders.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders("initial");
  }, [statusFilter, dateFilter, searchTerm]);

  // Update order status in Firestore
  const updateOrderStatus = async (id, newStatus) => {
    try {
      const orderRef = doc(db, "orders", id);
      await updateDoc(orderRef, { 
        status: newStatus,
        lastUpdated: new Date()
      });

      // Update locally
      setOrders((prev) =>
        prev.map((order) =>
          order.id === id ? { ...order, status: newStatus, lastUpdated: new Date() } : order
        )
      );
      setExpandedCard(null);

      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse';
      notification.textContent = `Order ${newStatus} successfully!`;
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 3000);

    } catch (err) {
      console.error("Error updating order status:", err);
      alert("Failed to update status.");
    }
  };

  // Bulk status update
  const bulkUpdateStatus = async (selectedOrders, newStatus) => {
    try {
      const updates = selectedOrders.map(orderId => {
        const orderRef = doc(db, "orders", orderId);
        return updateDoc(orderRef, { 
          status: newStatus,
          lastUpdated: new Date()
        });
      });

      await Promise.all(updates);
      fetchOrders("initial"); // Refresh data
    } catch (err) {
      console.error("Error bulk updating:", err);
      alert("Failed to bulk update orders.");
    }
  };

if (loading) {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="animate-pulse max-w-7xl mx-auto">
        <div className="h-10 bg-gray-200 rounded-lg w-1/3 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <p className="text-xl text-red-600 font-semibold mb-2">Error Loading Orders</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Management</h1>
              <p className="text-gray-600">Manage and track all customer orders</p>
            </div>
            
            {/* Quick Stats */}
            <div className="mt-4 lg:mt-0 grid grid-cols-3 lg:grid-cols-6 gap-4 text-center">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-3">
                <div className="text-2xl font-bold">{orderStats.total}</div>
                <div className="text-sm opacity-90">Total</div>
              </div>
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg p-3">
                <div className="text-2xl font-bold">{orderStats.pending}</div>
                <div className="text-sm opacity-90">Pending</div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-3">
                <div className="text-2xl font-bold">{orderStats.confirmed}</div>
                <div className="text-sm opacity-90">Confirmed</div>
              </div>
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg p-3">
                <div className="text-2xl font-bold">{orderStats.declined}</div>
                <div className="text-sm opacity-90">Declined</div>
              </div>
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg p-3">
                <div className="text-2xl font-bold">{orderStats.grab}</div>
                <div className="text-sm opacity-90">Pickup</div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-3">
                <div className="text-2xl font-bold">{orderStats.sold}</div>
                <div className="text-sm opacity-90">Completed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search orders, customers, products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">🔍</div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="declined">Declined</option>
              <option value="grab">Ready for Pickup</option>
              <option value="sold">Completed</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setStatusFilter("all");
                setDateFilter("all");
                setSearchTerm("");
              }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {orders.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {orders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-300 hover:shadow-lg cursor-pointer ${
                      expandedCard === order.id
                        ? "border-blue-400 shadow-lg transform scale-105"
                        : "border-gray-100 hover:border-gray-300"
                    }`}
                    onClick={() =>
                      setExpandedCard(
                        expandedCard === order.id ? null : order.id
                      )
                    }
                  >
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="text-sm text-gray-500 mb-1">Order ID</div>
                          <div className="font-semibold text-gray-900 truncate">#{order.id.slice(-8)}</div>
                        </div>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                          <span className="mr-1">{statusInfo.icon}</span>
                          {statusInfo.label}
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Customer:</span>
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {order.customerId || 'N/A'}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Product:</span>
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {order.product || 'N/A'}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Amount:</span>
                          <span className="text-lg font-bold text-green-600">
                            ₱{order.price?.toLocaleString() || '0'}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Date:</span>
                          <span className="text-sm text-gray-700">
                            {getRelativeTime(order.date)}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons - Show when expanded */}
                      {expandedCard === order.id && (
                        <div className="mt-6 pt-4 border-t border-gray-100">
                          <div className="flex flex-col space-y-2">
                            {order.status === 'pending' && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateOrderStatus(order.id, "confirmed");
                                  }}
                                  className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                                >
                                  ✅ Confirm Order
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateOrderStatus(order.id, "declined");
                                  }}
                                  className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                                >
                                  ❌ Decline Order
                                </button>
                              </>
                            )}

                            {order.status === 'confirmed' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateOrderStatus(order.id, "grab");
                                }}
                                className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                              >
                                🚚 Mark Ready for Pickup
                              </button>
                            )}

                            {order.status === 'grab' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateOrderStatus(order.id, "sold");
                                }}
                                className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                              >
                                💰 Mark as Completed
                              </button>
                            )}

                            {/* Additional Actions */}
                            <div className="flex space-x-2 mt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Add view details functionality
                                }}
                                className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                              >
                                👁️ Details
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Add contact customer functionality
                                }}
                                className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                              >
                                📞 Contact
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Expand indicator */}
                    <div className="px-6 pb-4">
                      <div className="text-center text-xs text-gray-400">
                        {expandedCard === order.id ? '▲ Click to collapse' : '▼ Click to expand'}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Fill remaining grid spaces */}
              {orders.length < PAGE_SIZE &&
                Array.from({ length: PAGE_SIZE - orders.length }).map(
                  (_, idx) => (
                    <div key={`placeholder-${idx}`} className="hidden lg:block" />
                  )
                )}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex justify-between items-center bg-white rounded-xl shadow-sm border p-6">
              <button
                disabled={!hasPrev}
                onClick={() => fetchOrders("prev")}
                className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                  hasPrev
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                ← Previous
              </button>

              <div className="flex items-center space-x-4">
                <span className="text-gray-600">Page {page}</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">{orders.length} orders</span>
              </div>

              <button
                disabled={!hasNext}
                onClick={() => fetchOrders("next")}
                className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                  hasNext
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                Next →
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {statusFilter !== "all" || dateFilter !== "all" || searchTerm
                ? "No orders match your current filters. Try adjusting your search criteria."
                : "No orders have been placed yet. Orders will appear here once customers start making purchases."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;