import React, { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import './AiChatbot.css'; // We'll create this file next

const AiChatbot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [user, setUser] = useState(null);

    const functions = getFunctions();
    const db = getFirestore();
    const auth = getAuth();

    // Check for user authentication and set up Firestore listener
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

                return () => unsubscribeFirestore(); // Cleanup Firestore listener
            } else {
                setUser(null);
                setMessages([]);
            }
        });

        return () => unsubscribeAuth(); // Cleanup auth listener
    }, [auth, db]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !user) return;

        // Add user message to UI immediately
        const userMessage = { user: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const chatWithAI = httpsCallable(functions, 'chatWithAI');

        try {
            const result = await chatWithAI({ prompt: input });
            const aiMessage = { ai: result.data.text, timestamp: new Date() };
            // The Firestore listener will automatically update the state, so we don't
            // need to manually add the AI message here.
            console.log("AI Response received and stored in Firestore.");
        } catch (error) {
            console.error("Error sending message to AI:", error);
            const errorMessage = { ai: 'Sorry, something went wrong. Please try again.', timestamp: new Date() };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="ai-chatbot-container">
            <button className="chat-toggle-button" onClick={() => setIsChatOpen(!isChatOpen)}>
                {isChatOpen ? 'Close Chat' : 'Open Chat'}
            </button>

            {isChatOpen && (
                <div className="chat-window">
                    <div className="chat-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.user ? 'user-message' : 'ai-message'}`}>
                                {msg.user || msg.ai}
                            </div>
                        ))}
                        {isLoading && <div className="loading-message">...</div>}
                    </div>
                    <form onSubmit={handleSendMessage} className="chat-input-form">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            disabled={isLoading || !user}
                        />
                        <button type="submit" disabled={isLoading || !user}>Send</button>
                    </form>
                    {!user && (
                        <div className="auth-required-message">Please log in to use the chatbot.</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AiChatbot;