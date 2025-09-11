import React from 'react';

const OrdersModal = ({ order, onClose }) => {
  if (!order) return null; // Don't render if there's no order

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-lg w-full transform transition-all">
        <div className="flex justify-between items-center pb-3 border-b">
          <h3 className="text-2xl font-bold text-gray-900">Order Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mt-4 space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 font-medium w-32">Order ID:</span>
            <span className="font-mono text-sm text-gray-700">{order.id}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 font-medium w-32">Customer ID:</span>
            <span className="font-semibold text-gray-900">{order.customerId || 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 font-medium w-32">Product:</span>
            <span className="font-semibold text-gray-900">{order.product || 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 font-medium w-32">Price:</span>
            <span className="text-lg font-bold text-green-600">₱{order.price?.toLocaleString() || '0'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 font-medium w-32">Status:</span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>
              {order.status}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 font-medium w-32">Date:</span>
            <span className="text-sm text-gray-700">
              {order.date?.toDate ? order.date.toDate().toLocaleString() : new Date(order.date).toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col space-y-2">
            <span className="text-gray-500 font-medium">Additional Notes:</span>
            <p className="text-gray-700 bg-gray-100 p-3 rounded-md">
              {order.notes || 'No additional notes provided.'}
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrdersModal;