import React, { useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";

const SalesTargetsModal = ({ show, onClose, onSave }) => {
  const [monthlyTarget, setMonthlyTarget] = useState("");
  const [orderTarget, setOrderTarget] = useState("");
  const [conversionRate, setConversionRate] = useState("");

  if (!show) return null;

  const handleSave = () => {
    if (!monthlyTarget || !orderTarget || !conversionRate) {
      toast.error("Please fill in all fields before saving.");
      return;
    }

    const newTargets = {
      targetSales: Number(monthlyTarget),
      targetOrders: Number(orderTarget),
      conversionTarget: Number(conversionRate),
      // We don't update achieved data here, as it's tracked separately.
      // This ensures we only set the targets.
    };

    // The onSave prop now calls the parent's Firebase function
    onSave(newTargets);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#f5f5dc] rounded-lg p-6 w-96 max-w-md mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-[#135918]">
            Set Sales Targets 🎯
          </h3>
          <button
            onClick={onClose}
            className="text-[#135918] hover:text-[#0a380c] transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-6">
          Define your key performance indicators to track your progress and goals.
        </p>

        {/* Input Fields */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Sales Target
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                ₱
              </span>
              <input
                type="number"
                placeholder="50,000"
                value={monthlyTarget}
                onChange={(e) => setMonthlyTarget(e.target.value)}
                className="w-full pl-8 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135918]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Target
            </label>
            <input
              type="number"
              placeholder="100 orders"
              value={orderTarget}
              onChange={(e) => setOrderTarget(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135918]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conversion Rate Target
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="75"
                value={conversionRate}
                onChange={(e) => setConversionRate(e.target.value)}
                className="w-full pr-8 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135918]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                %
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-[#135918] text-white rounded-lg hover:bg-[#0a380c] transition-colors font-semibold"
          >
            Save Targets
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesTargetsModal;