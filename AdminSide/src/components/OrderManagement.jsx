import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config"; // ✅ use your config.js db

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format Firestore Timestamp or string date
  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    if (dateValue.toDate) {
      return dateValue.toDate().toLocaleString();
    }
    return dateValue; // fallback if it’s just a string like "2024-10-1"
  };

  useEffect(() => {
    try {
      const ordersRef = collection(db, "orders");

      // Get orders sorted by date (if stored as Timestamp or sortable string)
      const q = query(ordersRef, orderBy("date", "desc"));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const orderList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setOrders(orderList);
          setLoading(false);
        },
        (err) => {
          console.error("Error fetching orders: ", err);
          setError("Failed to load orders.");
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error("Error initializing orders: ", err);
      setError("Error loading orders.");
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-500 animate-pulse">Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-6 bg-white rounded-xl shadow-md text-center">
          <p className="text-lg text-red-500 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <div className="bg-white shadow-lg rounded-xl max-w-7xl mx-auto p-6 sm:p-8">
        <h2 className="text-3xl font-extrabold text-gray-800 border-b pb-4 mb-6">
          All Orders
        </h2>

        {orders.length > 0 ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <li
                key={order.id}
                className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300 hover:shadow-lg hover:border-gray-300"
              >
                <div className="flex flex-col space-y-3">
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-500 w-28">Customer ID:</span>
                    <span className="font-semibold text-gray-900">{order.customerId}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-500 w-28">Date:</span>
                    <span className="font-semibold text-gray-900">{formatDate(order.date)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-500 w-28">Product:</span>
                    <span className="font-semibold text-gray-900">{order.product}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-500 w-28">Price:</span>
                    <span className="font-semibold text-gray-900">₱{order.price}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-medium text-gray-500 w-28">Status:</span>
                    <span
                      className={`font-semibold ${
                        order.status === "grab"
                          ? "text-green-600"
                          : order.status === "sold"
                          ? "text-red-600"
                          : "text-blue-600"
                      }`}
                    >
                      {order.status}
                    </span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500 py-10 italic text-lg">
            No orders found.
          </p>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;
