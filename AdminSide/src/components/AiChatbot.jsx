import React, { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const AiChatbot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [user, setUser] = useState(null);

    const functions = getFunctions();
    const db = getFirestore();
    const auth = getAuth();

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const chatHistoryRef = collection(db, `users/${currentUser.uid}/chatHistory`);
                const q = query(chatHistoryRef, orderBy('timestamp', 'asc'));
                const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
                    const chatMessages = snapshot.docs.map(doc => doc.data());
                    setMessages(chatMessages);
                });
                return () => unsubscribeFirestore();
            } else {
                setUser(null);
                setMessages([]);
            }
        });
        return () => unsubscribeAuth();
    }, [auth, db]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !user) return;

        const userMessage = { user: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const chatWithAI = httpsCallable(functions, 'chatWithAI');

        try {
            await chatWithAI({ prompt: userMessage.user });
        } catch (error) {
            console.error("Error sending message to AI:", error);
            const errorMessage = { ai: 'Sorry, something went wrong. Please try again.', timestamp: new Date() };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed top-4 right-8 z-[1000]">
            <button
            className="p-2 bg-transparent transition-colors duration-200"
            onClick={() => setIsChatOpen(!isChatOpen)}
            >
            <img
                src={isChatOpen ? "/public/AI-close.png" : "/public/AI-open.png"}
                alt={isChatOpen ? "Close Chat" : "Open Chat"}
                className="w-15 h-10"
            />
            </button>


            {isChatOpen && (
                <div className="w-80 h-[450px] bg-gray-100 rounded-lg shadow-xl flex flex-col overflow-hidden mt-4">
                    <div className="flex-1 p-4 overflow-y-auto flex flex-col space-y-4">
                        {messages.map((msg, index) => (
                            <div 
                                key={index} 
                                className={`p-3 rounded-lg max-w-[80%] break-words ${
                                    msg.user ? 'bg-green-200 self-end' : 'bg-gray-300 self-start'
                                }`}
                            >
                                {msg.user || msg.ai}
                            </div>
                        ))}
                        {isLoading && <div className="p-3 self-start text-gray-500">...</div>}
                    </div>
                    <form onSubmit={handleSendMessage} className="flex p-3 border-t border-gray-300">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            disabled={isLoading || !user}
                            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-200"
                        />
                        <button 
                            type="submit" 
                            disabled={isLoading || !user}
                            className="ml-3 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400"
                        >
                            Send
                        </button>
                    </form>
                    {!user && (
                        <div className="p-3 text-center text-sm text-red-500">
                            Please log in to use the chatbot.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AiChatbot;