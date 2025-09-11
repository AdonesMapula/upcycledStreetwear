import { X } from "lucide-react";
import * as XLSX from "xlsx";
import { useState } from "react";

const ExportModal = ({ show, onClose, data }) => {
  const [selectedFormat, setSelectedFormat] = useState("");

  if (!show) return null;

  const exportData = () => {
    if (selectedFormat === "excel") {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
      XLSX.writeFile(workbook, "orders.xlsx");
    } else if (selectedFormat === "print") {
      const printContent = `
        <html>
          <head>
            <title>Orders Report</title>
            <style>
              body { font-family: sans-serif; }
              table { border-collapse: collapse; width: 100%; margin-top: 20px; }
              th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h2>Orders Report</h2>
            <table>
              <thead>
                <tr>${Object.keys(data[0])
                  .map((key) => `<th>${key}</th>`)
                  .join("")}</tr>
              </thead>
              <tbody>
                ${data
                  .map(
                    (row) =>
                      `<tr>${Object.values(row)
                        .map((val) => `<td>${val}</td>`)
                        .join("")}</tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const printWindow = window.open("", "", "height=600,width=800");
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#f5f5dc] rounded-lg p-6 w-96 max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#135918]">
            Export Your Data
          </h3>
          <button
            onClick={onClose}
            className="text-[#135918] hover:text-[#0a380c] transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Choose your preferred format and click 'Export' to download your data.
        </p>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Export Format
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#135918]"
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
            >
              <option value="">-- Please Select --</option>
              <option value="excel">Excel (.xlsx)</option>
              <option value="print">Printable format</option>
            </select>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={exportData}
            disabled={!selectedFormat}
            className={`flex-1 px-4 py-2 rounded-lg text-white font-semibold transition-colors
              ${selectedFormat ? "bg-[#135918] hover:bg-[#0a380c]" : "bg-gray-400 cursor-not-allowed"}
            `}
          >
            Export
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;