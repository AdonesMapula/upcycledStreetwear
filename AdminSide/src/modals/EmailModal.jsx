import React, { useState } from "react";
import { useAlert } from "../contexts/alertContext";

const EmailModal = ({ recipient, onClose }) => {
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [isSending, setIsSending] = useState(false);
    const { showAlert } = useAlert();
    
    const handleSendEmail = async () => {
        if (!subject || !body) {
            showAlert("error", "Please enter both a subject and a message.");
            return;
        }

        setIsSending(true);
        try {
            console.log("Simulating email send to:", recipient);
            console.log("Subject:", subject);
            console.log("Body:", body);

            // Simulate a network request
            await new Promise((resolve) => setTimeout(resolve, 1500));

            showAlert("success", "Email sent successfully!");
            onClose();
        } catch (error) {
            console.error("Failed to send email:", error);
            showAlert("error", "Failed to send email. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all scale-100 opacity-100 animate-fadeIn">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-800">Compose Email</h3>
                    <p className="text-sm text-gray-500 mt-1">To: <span className="font-medium text-gray-700">{recipient}</span></p>
                </div>

                <div className="p-6 space-y-4">
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Subject"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Email body"
                        rows="6"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
                    ></textarea>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end items-center space-x-3 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-medium text-gray-600 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSendEmail}
                        disabled={isSending}
                        className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-full hover:bg-green-700 disabled:bg-green-300 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        {isSending ? "Sending..." : "Send"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailModal;