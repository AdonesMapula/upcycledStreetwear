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
} from "firebase/firestore";
import { db } from "../firebase/config";

const PAGE_SIZE = 12; // how many orders per page

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [lastDoc, setLastDoc] = useState(null);
  const [firstDoc, setFirstDoc] = useState(null);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const [expandedCard, setExpandedCard] = useState(null); // which card is expanded

  // Format Firestore Timestamp or string date
  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    if (dateValue.toDate) {
      return dateValue.toDate().toLocaleString();
    }
    return dateValue;
  };

  // Fetch paginated orders
  const fetchOrders = async (direction = "initial") => {
    setLoading(true);
    try {
      let q;
      const ordersRef = collection(db, "orders");

      if (direction === "next" && lastDoc) {
        q = query(
          ordersRef,
          orderBy("date", "desc"),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
      } else if (direction === "prev" && firstDoc) {
        q = query(
          ordersRef,
          orderBy("date", "desc"),
          endBefore(firstDoc),
          limit(PAGE_SIZE)
        );
      } else {
        q = query(ordersRef, orderBy("date", "desc"), limit(PAGE_SIZE));
      }

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const orderList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setOrders(orderList);
        setFirstDoc(snapshot.docs[0]);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

        // check if more pages exist
        setHasPrev(direction !== "initial");
        setHasNext(snapshot.docs.length === PAGE_SIZE);

        if (direction === "next") setPage((prev) => prev + 1);
        if (direction === "prev") setPage((prev) => Math.max(prev - 1, 1));
      }
    } catch (err) {
      console.error("Error fetching orders: ", err);
      setError("Failed to load orders.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders("initial");
  }, []);

  // Update order status in Firestore
  const updateOrderStatus = async (id, newStatus) => {
    try {
      const orderRef = doc(db, "orders", id);
      await updateDoc(orderRef, { status: newStatus });

      // Update locally so UI reflects instantly
      setOrders((prev) =>
        prev.map((order) =>
          order.id === id ? { ...order, status: newStatus } : order
        )
      );
      setExpandedCard(null); // collapse card after action
    } catch (err) {
      console.error("Error updating order status:", err);
      alert("Failed to update status.");
    }
  };

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
    <div className="flex flex-col min-h-screen max-w-full bg-gray-100 p-3">
      <div className="bg-white shadow-lg rounded-xl max-w-7xl mx-auto flex flex-col flex-grow p-6 sm:p-8">
        <h2 className="text-3xl font-extrabold text-gray-800 border-b pb-4 mb-6">
          All Orders
        </h2>

        {orders.length > 0 ? (
          <>
            {/* Orders Grid */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 flex-grow">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className={`p-6 border rounded-xl shadow-sm transition-all duration-300 cursor-pointer ${
                    expandedCard === order.id
                      ? "bg-gray-50 border-gray-400 shadow-lg"
                      : "bg-white border-gray-200 hover:shadow-lg hover:border-gray-300"
                  }`}
                  onClick={() =>
                    setExpandedCard(
                      expandedCard === order.id ? null : order.id
                    )
                  }
                >
                  <div className="flex flex-col space-y-3">
                    <p className="flex justify-between">
                      <span className="font-medium text-gray-500 w-28">
                        Customer ID:
                      </span>
                      <span className="font-semibold text-gray-900">
                        {order.customerId}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-medium text-gray-500 w-28">
                        Date:
                      </span>
                      <span className="font-semibold text-gray-900">
                        {formatDate(order.date)}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-medium text-gray-500 w-28">
                        Product:
                      </span>
                      <span className="font-semibold text-gray-900">
                        {order.product}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-medium text-gray-500 w-28">
                        Price:
                      </span>
                      <span className="font-semibold text-gray-900">
                        ₱{order.price}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-medium text-gray-500 w-28">
                        Status:
                      </span>
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

                  {/* Confirm/Decline buttons when expanded */}
                  {expandedCard === order.id && (
                    <div className="flex justify-around mt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateOrderStatus(order.id, "confirmed");
                        }}
                        className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateOrderStatus(order.id, "declined");
                        }}
                        className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </li>
              ))}

              {/* Empty placeholders to keep grid height consistent */}
              {orders.length < PAGE_SIZE &&
                Array.from({ length: PAGE_SIZE - orders.length }).map(
                  (_, idx) => (
                    <li
                      key={`empty-${idx}`}
                      className="p-6 bg-transparent rounded-xl"
                    />
                  )
                )}
            </ul>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-6">
              <button
                disabled={!hasPrev}
                onClick={() => fetchOrders("prev")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  hasPrev
                    ? "bg-gray-200 hover:bg-gray-300 text-gray-800"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                Previous
              </button>
              <span className="text-gray-600">Page {page}</span>
              <button
                disabled={!hasNext}
                onClick={() => fetchOrders("next")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  hasNext
                    ? "bg-gray-200 hover:bg-gray-300 text-gray-800"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500 py-10 italic text-lg flex-grow">
            No orders found.
          </p>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;
