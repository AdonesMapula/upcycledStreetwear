import React, { useState, useRef, useEffect } from "react";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  getDocs,
  where,
  limit,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { 
  X, 
  Send, 
  MessageCircle,
  BarChart3,
  Users,
  Package,
  ShoppingBag,
  FileText,
  TrendingUp,
  Calendar,
  DollarSign
} from "lucide-react";

const UpcycledAdminAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Admin data states
  const [adminStats, setAdminStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    totalProducts: 0,
    monthlyRevenue: 0,
    pendingOrders: 0,
    lowStockItems: 0
  });

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeChat();
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Load admin statistics when component mounts
    loadAdminStats();
  }, []);

  const initializeChat = () => {
    const welcomeMessage = {
      id: 1,
      text: "Hello Admin! I'm your Upcycled Streetwear assistant. I can help you with:\n\n• Customer Management\n• Order Management\n• Product Management\n• Sales Analytics\n• News Management\n\nWhat would you like to know?",
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  // Load admin statistics from database
  const loadAdminStats = async () => {
    try {
      // Customers count
      const customersQuery = query(collection(db, 'users'));
      const customersSnap = await getDocs(customersQuery);
      
      // Orders count and revenue
      const ordersQuery = query(collection(db, 'orders'));
      const ordersSnap = await getDocs(ordersQuery);
      let monthlyRevenue = 0;
      let pendingOrders = 0;
      
      ordersSnap.docs.forEach(doc => {
        const orderData = doc.data();
        const orderDate = orderData.createdAt?.toDate();
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        if (orderDate && orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
          monthlyRevenue += orderData.total || 0;
        }
        
        if (orderData.status === 'pending') {
          pendingOrders++;
        }
      });
      
      // Products count and low stock
      const productsQuery = query(collection(db, 'products'));
      const productsSnap = await getDocs(productsQuery);
      let lowStockItems = 0;
      
      productsSnap.docs.forEach(doc => {
        const productData = doc.data();
        if (productData.quantity <= 5) {
          lowStockItems++;
        }
      });

      setAdminStats({
        totalCustomers: customersSnap.size,
        totalOrders: ordersSnap.size,
        totalProducts: productsSnap.size,
        monthlyRevenue,
        pendingOrders,
        lowStockItems
      });
    } catch (error) {
      console.error('Error loading admin stats:', error);
    }
  };

  // Enhanced AI response with database queries
  const getAdminResponse = async (userMessageText) => {
    try {
      const lowerInput = userMessageText.toLowerCase();
      
      // Database-connected responses
      if (lowerInput.includes('sales') || lowerInput.includes('revenue') || lowerInput.includes('analytics')) {
        // Get recent sales data
        const ordersQuery = query(
          collection(db, 'orders'),
          where('createdAt', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
          orderBy('createdAt', 'desc')
        );
        const ordersSnap = await getDocs(ordersQuery);
        
        let totalSales = 0;
        let completedOrders = 0;
        ordersSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.status === 'completed') {
            totalSales += data.total || 0;
            completedOrders++;
          }
        });

        return `📊 **Sales Analytics (Last 30 days):**
        
• Total Revenue: ₱${totalSales.toLocaleString()}
• Completed Orders: ${completedOrders}
• Monthly Revenue: ₱${adminStats.monthlyRevenue.toLocaleString()}
• Pending Orders: ${adminStats.pendingOrders}
• Average Order Value: ₱${completedOrders > 0 ? Math.round(totalSales / completedOrders) : 0}

Would you like detailed reports on specific metrics?`;
      }

      if (lowerInput.includes('customer') || lowerInput.includes('user')) {
        const recentCustomersQuery = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentCustomersSnap = await getDocs(recentCustomersQuery);
        
        return `👥 **Customer Management Overview:**
        
• Total Customers: ${adminStats.totalCustomers}
• New Customers (Last 5): ${recentCustomersSnap.size}
• Active Sessions: Available in user analytics

**Recent Customer Activities:**
${recentCustomersSnap.docs.map((doc, idx) => 
  `${idx + 1}. ${doc.data().name || 'Customer'} - ${doc.data().email}`
).join('\n')}

Need help with customer queries, account management, or user analytics?`;
      }

      if (lowerInput.includes('product') || lowerInput.includes('inventory') || lowerInput.includes('stock')) {
        const lowStockQuery = query(
          collection(db, 'products'),
          where('quantity', '<=', 5)
        );
        const lowStockSnap = await getDocs(lowStockQuery);
        
        return `📦 **Product Management Status:**
        
• Total Products: ${adminStats.totalProducts}
• Low Stock Items: ${adminStats.lowStockItems}
• Out of Stock: ${lowStockSnap.docs.filter(doc => doc.data().quantity === 0).length}

**🚨 Low Stock Alert:**
${lowStockSnap.docs.map((doc, idx) => {
  const data = doc.data();
  return `${idx + 1}. ${data.name} - ${data.quantity} left`;
}).join('\n') || 'All items well stocked!'}

Need help updating inventory, adding products, or managing categories?`;
      }

      if (lowerInput.includes('order') || lowerInput.includes('claim')) {
        const pendingOrdersQuery = query(
          collection(db, 'orders'),
          where('status', '==', 'pending'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const pendingOrdersSnap = await getDocs(pendingOrdersQuery);
        
        return `🛍️ **Order Management Dashboard:**
        
• Total Orders: ${adminStats.totalOrders}
• Pending Orders: ${adminStats.pendingOrders}
• Processing Queue: ${pendingOrdersSnap.size}

**Recent Pending Orders:**
${pendingOrdersSnap.docs.map((doc, idx) => {
  const data = doc.data();
  return `${idx + 1}. Order #${doc.id.slice(-6)} - ₱${data.total} - ${data.customerName}`;
}).join('\n') || 'No pending orders!'}

Need help processing claims, updating order status, or managing the bidding system?`;
      }

      if (lowerInput.includes('news') || lowerInput.includes('announcement') || lowerInput.includes('update')) {
        return `📰 **News & Content Management:**
        
• Create announcements for item drops
• Schedule time-based releases
• Manage keyword claiming events
• Update store policies

**Popular Actions:**
• "Schedule new drop" - Set up timed releases
• "Create announcement" - Notify customers
• "Update policies" - Modify terms and conditions
• "Manage keywords" - Set claiming triggers

What type of content would you like to manage?`;
      }

      // General responses for admin functions
      const adminResponses = {
        "help": `🔧 **Admin Functions Available:**
        
**📊 Analytics:** "show sales", "revenue report", "monthly stats"
**👥 Customers:** "customer list", "user management", "account issues"  
**📦 Products:** "inventory status", "low stock", "add product"
**🛍️ Orders:** "pending orders", "order status", "claims queue"
**📰 News:** "create announcement", "schedule drop", "manage content"

Just ask naturally! Example: "Show me this month's sales" or "Any low stock items?"`,
        
        "greeting": "Welcome to Upcycled Streetwear Admin Panel! I can help you manage customers, orders, products, sales analytics, and news content. What do you need assistance with?",
        
        "default": "I'm here to help you manage your Upcycled Streetwear operations! I can assist with customer management, order processing, inventory tracking, sales analytics, and content management. What specific area would you like help with?"
      };

      // Determine response type
      if (lowerInput.includes('help') || lowerInput.includes('what can you')) {
        return adminResponses.help;
      } else if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
        return adminResponses.greeting;
      } else {
        return adminResponses.default;
      }

    } catch (error) {
      console.error('Admin AI Error:', error);
      return "I'm having trouble accessing the admin data right now. Please try again, or check if you need to refresh the database connection.";
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    try {
      setLoading(true);
      setIsBotTyping(true);

      // Save user message
      const userMessage = {
        id: Date.now(),
        text: inputText,
        sender: "user",
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInputText("");

      // Get admin AI response with database queries
      const aiResponse = await getAdminResponse(inputText);
      
      const botMessage = {
        id: Date.now() + 1,
        text: aiResponse,
        sender: "bot",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error("Error:", err);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble accessing the admin system right now. Please try again.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setIsBotTyping(false);
    }
  };

  const quickAdminActions = [
    { text: "Show today's sales", icon: <DollarSign size={16} /> },
    { text: "Pending orders status", icon: <ShoppingBag size={16} /> },
    { text: "Low stock items", icon: <Package size={16} /> },
    { text: "Customer management", icon: <Users size={16} /> },
    { text: "Schedule item drop", icon: <Calendar size={16} /> },
  ];

  const sendQuickAction = (action) => {
    setInputText(action);
    setTimeout(() => sendMessage(), 100);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
          style={{ backgroundColor: '#135918' }}
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Modal */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl w-96 h-96 flex flex-col border-2 border-green-100"
             style={{ backgroundColor: '#FFFEF7' }}>
          {/* Header */}
          <div className="p-4 rounded-t-2xl flex items-center justify-between"
               style={{ backgroundColor: '#135918' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <BarChart3 size={16} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Admin Assistant</h3>
                <p className="text-green-100 text-xs">Upcycled Streetwear</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-green-200 p-1 rounded"
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Stats Bar */}
          <div className="px-4 py-2 bg-green-50 border-b border-green-100">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="font-semibold text-green-800">{adminStats.totalCustomers}</div>
                <div className="text-green-600">Customers</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-800">{adminStats.pendingOrders}</div>
                <div className="text-green-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-800">₱{adminStats.monthlyRevenue.toLocaleString()}</div>
                <div className="text-green-600">Revenue</div>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-xs text-sm ${
                    msg.sender === "user"
                      ? "text-white rounded-br-sm"
                      : "bg-gray-50 text-gray-800 rounded-bl-sm border border-green-100"
                  }`}
                  style={msg.sender === "user" ? { backgroundColor: '#135918' } : {}}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}

            {isBotTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-50 border border-green-100 p-3 rounded-2xl rounded-bl-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            {messages.length <= 1 && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">Quick Actions:</p>
                <div className="space-y-2">
                  {quickAdminActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => sendQuickAction(action.text)}
                      className="w-full p-2 text-left text-xs bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 flex items-center gap-2 transition-colors"
                    >
                      {action.icon}
                      {action.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-green-100">
            <div className="flex items-end gap-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about orders, customers, sales..."
                className="flex-1 px-3 py-2 text-sm border border-green-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
                rows="1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !inputText.trim()}
                className="p-2 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ backgroundColor: '#135918' }}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcycledAdminAssistant;