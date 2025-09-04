import React, { useEffect, useState, useRef } from "react";
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
import DeliveryDetailsModal from "../modals/DeliveryDetailsModal";
import { Package, Truck, ShoppingBag, XCircle } from "lucide-react";
import toast from "react-hot-toast";

const PAGE_SIZE = 12;

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("orders");

  const [page, setPage] = useState(1);
  const [lastDoc, setLastDoc] = useState(null);
  const [firstDoc, setFirstDoc] = useState(null);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const [expandedCard, setExpandedCard] = useState(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    if (dateValue.toDate) {
      return dateValue.toDate().toLocaleString();
    }
    return dateValue;
  };

  const fetchOrders = async (direction = "initial") => {
    setLoading(true);
    setError(null);
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
        setHasPrev(direction === "next" || (direction === "prev" && page > 1));
        setHasNext(snapshot.docs.length === PAGE_SIZE);
        if (direction === "next") setPage((prev) => prev + 1);
        if (direction === "prev") setPage((prev) => Math.max(prev - 1, 1));
      } else {
        if (direction === "next") setHasNext(false);
        if (direction === "prev") setHasPrev(false);
      }
    } catch (err) {
      console.error("Error fetching orders: ", err);
      setError("Failed to load orders.");
      toast.error("Failed to load orders.");
    }
    setLoading(false);
  };

  const fetchDeliveries = async () => {
    setLoading(true);
    setError(null);
    try {
      const deliveriesRef = collection(db, "deliveries");
      const q = query(deliveriesRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const deliveryList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDeliveries(deliveryList);
    } catch (err) {
      console.error("Error fetching deliveries: ", err);
      setError("Failed to load deliveries.");
      toast.error("Failed to load deliveries.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrders("initial");
    } else {
      fetchDeliveries();
    }
  }, [activeTab]);

  // Dragging logic
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const updateOrderStatus = async (id, newStatus) => {
    try {
      const orderRef = doc(db, "orders", id);
      await updateDoc(orderRef, { status: newStatus });
      setOrders((prev) =>
        prev.map((order) =>
          order.id === id ? { ...order, status: newStatus } : order
        )
      );
      toast.success(`Order status updated to "${newStatus}"!`);
      setExpandedCard(null);
    } catch (err) {
      console.error("Error updating order status:", err);
      toast.error("Failed to update status.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Grab":
        return "bg-purple-600";
      case "Confirmed":
        return "bg-green-600";
      case "Declined":
        return "bg-red-600";
      case "Sold":
        return "bg-blue-600";
      default:
        return "bg-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-500 animate-pulse">
          Loading {activeTab}...
        </p>
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
    <div className="flex flex-col min-h-screen max-w-full bg-[#f5f5dc] p-3">
      <div className="bg-white shadow-lg rounded-xl max-w-7xl mx-auto flex flex-col flex-grow p-6 sm:p-8">
        {/* Tabs Navigation */}
        <div className="flex space-x-4 mb-6 border-b-2 border-gray-200">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center space-x-2 px-4 py-2 text-lg font-bold transition-all duration-200 ${
              activeTab === "orders"
                ? "text-[#135918] border-b-2 border-[#135918]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <ShoppingBag className="h-6 w-6" />
            <span>Orders</span>
          </button>
          <button
            onClick={() => setActiveTab("deliveries")}
            className={`flex items-center space-x-2 px-4 py-2 text-lg font-bold transition-all duration-200 ${
              activeTab === "deliveries"
                ? "text-[#135918] border-b-2 border-[#135918]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Truck className="h-6 w-6" />
            <span>Deliveries</span>
          </button>
        </div>

        {/* Conditional Content based on active tab */}
        {activeTab === "orders" ? (
          <>
            <h2 className="text-2xl font-extrabold text-[#135918] mb-4">
              Order List
            </h2>
            {/* Action buttons floating across the top-right of the order list */}
            {expandedCard && (
              <div
                ref={containerRef}
                className="fixed z-50 transition-all duration-300 transform"
                style={{
                  top: `calc(50% + ${position.y}px)`,
                  left: `calc(50% + ${position.x}px)`,
                }}
                onMouseDown={handleMouseDown}
              >
                <div className="flex items-center bg-white p-4 rounded-full shadow-2xl space-x-4">
                  <button
                    onClick={() => setExpandedCard(null)}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <XCircle className="h-8 w-8" />
                  </button>
                  {(() => {
                    const order = orders.find((o) => o.id === expandedCard);
                    if (!order) return null;
                    return (
                      <>
                        {order.status !== "Confirmed" &&
                          order.status !== "Declined" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(order);
                                setShowDeliveryModal(true);
                              }}
                              className="px-4 py-2 rounded-full bg-[#135918] text-white font-bold hover:bg-[#0a380c] transition-colors shadow-lg cursor-pointer"
                            >
                              Confirm
                            </button>
                          )}
                        {order.status !== "Confirmed" &&
                          order.status !== "Declined" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOrderStatus(order.id, "Declined");
                              }}
                              className="px-4 py-2 rounded-full bg-red-900 text-white font-bold hover:bg-red-800 transition-colors shadow-lg cursor-pointer"
                            >
                              Decline
                            </button>
                          )}
                        {order.status !== "Grab" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(order.id, "Grab");
                            }}
                            className="px-4 py-2 rounded-full bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors shadow-lg cursor-pointer"
                          >
                            Grab
                          </button>
                        )}
                        {order.status !== "Sold" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(order.id, "Sold");
                            }}
                            className="px-4 py-2 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg cursor-pointer"
                          >
                            Sold
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 flex-grow">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <li
                    key={order.id}
                    className={`relative p-6 border rounded-xl shadow-sm transition-all duration-300 cursor-pointer bg-[#f5f5dc] border-green-300 hover:shadow-lg hover:border-green-400 ${
                      expandedCard === order.id ? "ring-2 ring-[#135918]" : ""
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
                          Order ID:
                        </span>
                        <span className="font-bold text-[#135918] text-right">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="font-medium text-gray-500 w-28">
                          Date:
                        </span>
                        <span className="font-semibold text-gray-900 text-right">
                          {formatDate(order.date)}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="font-medium text-gray-500 w-28">
                          Product:
                        </span>
                        <span className="font-semibold text-gray-900 text-right">
                          {order.product}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="font-medium text-gray-500 w-28">
                          Price:
                        </span>
                        <span className="font-bold text-[#135918] text-right">
                          ₱{order.price.toFixed(2)}
                        </span>
                      </p>
                      <p className="flex justify-between items-center">
                        <span className="font-medium text-gray-500 w-28">
                          Status:
                        </span>
                        <span
                          className={`font-semibold text-right px-2 py-1 rounded-full text-white ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </p>
                    </div>
                  </li>
                ))
              ) : (
                <p className="col-span-4 text-center text-gray-500 py-10 italic text-lg">
                  No orders found.
                </p>
              )}
            </ul>
            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-6">
              <button
                disabled={!hasPrev}
                onClick={() => fetchOrders("prev")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
          <>
            <h2 className="text-2xl font-extrabold text-[#135918] mb-4">
              Delivery List
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 flex-grow">
              {deliveries.length > 0 ? (
                deliveries.map((delivery) => (
                  <li
                    key={delivery.id}
                    className="p-6 border rounded-xl shadow-sm bg-[#f5f5dc] border-green-300"
                  >
                    <div className="flex flex-col space-y-3">
                      <p className="flex justify-between">
                        <span className="font-medium text-gray-500 w-28">
                          Order ID:
                        </span>
                        <span className="font-bold text-[#135918] text-right">
                          #{delivery.orderId.slice(0, 8).toUpperCase()}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="font-medium text-gray-500 w-28">
                          Recipient:
                        </span>
                        <span className="font-semibold text-gray-900 text-right">
                          {delivery.recipientName}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="font-medium text-gray-500 w-28">
                          Contact:
                        </span>
                        <span className="font-semibold text-gray-900 text-right">
                          {delivery.contactNumber}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="font-medium text-gray-500 w-28">
                          Address:
                        </span>
                        <span className="font-semibold text-gray-900 text-right">
                          {delivery.address}
                        </span>
                      </p>
                      <p className="flex justify-between items-center">
                        <span className="font-medium text-gray-500 w-28">
                          Status:
                        </span>
                        <span className="font-semibold text-right px-2 py-1 rounded-full text-white bg-green-600">
                          {delivery.status}
                        </span>
                      </p>
                    </div>
                  </li>
                ))
              ) : (
                <p className="col-span-4 text-center text-gray-500 py-10 italic text-lg">
                  No deliveries found.
                </p>
              )}
            </ul>
          </>
        )}
      </div>
      {showDeliveryModal && selectedOrder && (
        <DeliveryDetailsModal
          show={showDeliveryModal}
          onClose={() => setShowDeliveryModal(false)}
          order={selectedOrder}
          onSave={() => {
            fetchDeliveries();
            setActiveTab("deliveries");
          }}
        />
      )}
    </div>
  );
};

export default OrderManagement;