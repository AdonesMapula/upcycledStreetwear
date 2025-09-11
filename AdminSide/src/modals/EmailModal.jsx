import React, { useState } from "react";

const EmailModal = ({ recipient, onClose }) => {
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [isSending, setIsSending] = useState(false);

    const handleSendEmail = async () => {
        setIsSending(true);
        try {
            // Replace with your actual Cloud Function call
            // await sendEmailCloudFunction({ to: recipient, subject, body });
            console.log("Simulating email send to:", recipient);
            console.log("Subject:", subject);
            console.log("Body:", body);
            alert("Email sent successfully!");
            onClose(); // Close the modal on success
        } catch (error) {
            console.error("Failed to send email:", error);
            alert("Failed to send email. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
            <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white">
                <h3 className="text-lg font-bold">Compose Email</h3>
                <p className="text-sm text-gray-500">To: {recipient}</p>
                <div className="mt-4">
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Subject"
                        className="w-full p-2 border rounded mb-3"
                    />
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Email body"
                        rows="5"
                        className="w-full p-2 border rounded"
                    ></textarea>
                </div>
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="mr-2 px-4 py-2 text-gray-700 bg-gray-200 rounded-md"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSendEmail}
                        disabled={isSending}
                        className="px-4 py-2 bg-red-500 text-white rounded-md disabled:bg-red-300"
                    >
                        {isSending ? "Sending..." : "Send"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailModal;