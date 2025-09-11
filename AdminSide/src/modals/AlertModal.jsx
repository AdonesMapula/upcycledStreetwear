import { X, CheckCircle, AlertCircle } from 'lucide-react';

const AlertModal = ({ type, message, onClose }) => {
  if (!message) return null;

  const isSuccess = type === 'success';
  const icon = isSuccess ? <CheckCircle className="h-6 w-6 text-green-500" /> : <AlertCircle className="h-6 w-6 text-red-500" />;
  const title = isSuccess ? 'Success' : 'Error';
  const buttonColor = isSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-sm mx-4 text-center">
        <div className="flex justify-center mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-secondary mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <button
          onClick={onClose}
          className={`w-full px-4 py-2 text-white rounded-lg transition-colors ${buttonColor}`}
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default AlertModal;