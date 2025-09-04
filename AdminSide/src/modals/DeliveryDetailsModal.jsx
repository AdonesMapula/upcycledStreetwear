import React, { useState } from "react";
import { X } from "lucide-react";
import { db } from "../firebase/config";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";

const DeliveryDetailsModal = ({ show, onClose, order }) => {
  const [recipientName, setRecipientName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  if (!show) return null;

  const handleSaveDelivery = async (e) => {
    e.preventDefault();
    if (!recipientName || !contactNumber || !address) {
      toast.error("Please fill in all details.");
      return;
    }

    setLoading(true);

    try {
      // 1. Add new delivery document to the 'deliveries' collection
      const deliveryRef = await addDoc(collection(db, "deliveries"), {
        orderId: order.id,
        recipientName,
        contactNumber,
        address,
        orderDate: order.date,
        price: order.price,
        status: "For Delivery",
        createdAt: new Date(),
      });

      // 2. Update the original order's status to 'Confirmed'
      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, {
        status: "Confirmed",
      });

      toast.success("Delivery details saved and order confirmed!");
      setLoading(false);
      onClose();
    } catch (error) {
      console.error("Error saving delivery details:", error);
      toast.error("Failed to save delivery details. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#f5f5dc] rounded-lg p-6 w-96 max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#135918]">
            Enter Delivery Details
          </h3>
          <button
            onClick={onClose}
            className="text-[#135918] hover:text-[#0a380c] transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Please provide the recipient's information to proceed with delivery.
        </p>

        <form onSubmit={handleSaveDelivery} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Name
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135918]"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Number
            </label>
            <input
              type="tel"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135918]"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Address
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135918]"
              rows="3"
              disabled={loading}
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-2 rounded-lg text-white font-semibold transition-colors ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#135918] hover:bg-[#0a380c]"
              }`}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save & Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeliveryDetailsModal;