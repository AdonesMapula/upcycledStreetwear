import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
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
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import Icon from 'react-native-vector-icons/Feather';

const { width, height } = Dimensions.get('window');

const UpcycledUserAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const scrollViewRef = useRef(null);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // User data states
  const [userStats, setUserStats] = useState({
    totalOrders: 0,
    pendingClaims: 0,
    availableCredits: 0,
    recentActivity: []
  });

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeChat();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => {
    // Load user statistics when component mounts
    loadUserStats();
  }, []);

  // Animation effects
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const initializeChat = () => {
    const welcomeMessage = {
      id: 1,
      text: "Hey there! 👋 Welcome to Upcycled Streetwear! I'm here to help you with:\n\n• Finding unique items\n• Claiming procedures\n• Order tracking\n• Account questions\n• Style recommendations\n\nWhat can I help you with today?",
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  // Load user statistics from database
  const loadUserStats = async () => {
    try {
      // User's orders (you'd need to filter by current user ID in real app)
      const ordersQuery = query(
        collection(db, 'orders'),
        // where('userId', '==', currentUserId), // Add user filtering
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const ordersSnap = await getDocs(ordersQuery);
      
      let pendingClaims = 0;
      ordersSnap.docs.forEach(doc => {
        const orderData = doc.data();
        if (orderData.status === 'pending' || orderData.status === 'claiming') {
          pendingClaims++;
        }
      });

      // Get available products for browsing
      const productsQuery = query(
        collection(db, 'products'),
        where('quantity', '>', 0),
        limit(5)
      );
      const productsSnap = await getDocs(productsQuery);

      setUserStats({
        totalOrders: ordersSnap.size,
        pendingClaims,
        availableCredits: 1500, // This would come from user profile
        recentActivity: productsSnap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          price: doc.data().price
        }))
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  // Enhanced AI response with user-focused database queries
  const getUserResponse = async (userMessageText) => {
    try {
      const lowerInput = userMessageText.toLowerCase();
      
      // User-focused responses
      if (lowerInput.includes('order') || lowerInput.includes('track') || lowerInput.includes('status')) {
        const recentOrdersQuery = query(
          collection(db, 'orders'),
          // where('userId', '==', currentUserId), // Filter by user
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const ordersSnap = await getDocs(recentOrdersQuery);
        
        return `📦 **Your Orders:**\n\n• Total Orders: ${userStats.totalOrders}\n• Pending Claims: ${userStats.pendingClaims}\n\n**Recent Orders:**\n${ordersSnap.docs.map((doc, idx) => {
          const data = doc.data();
          return `${idx + 1}. Order #${doc.id.slice(-6)} - ${data.status} - ₱${data.total}`;
        }).join('\n') || 'No recent orders found.'}\n\nNeed help with a specific order? Just give me the order number!`;
      }

      if (lowerInput.includes('claim') || lowerInput.includes('how to claim') || lowerInput.includes('claiming')) {
        return `🎯 **How to Claim Items:**\n\n**Step 1:** Browse available items in the app\n**Step 2:** When you see "CLAIM NOW" - tap it fast!\n**Step 3:** Complete the claiming form\n**Step 4:** Wait for admin approval\n**Step 5:** Proceed to payment\n\n**💡 Pro Tips:**\n• Be ready when drops happen\n• Follow our social media for drop announcements\n• Keywords sometimes trigger special claims\n\n**Current Status:** ${userStats.pendingClaims} pending claims\n\nNeed help with a specific claim?`;
      }

      if (lowerInput.includes('product') || lowerInput.includes('item') || lowerInput.includes('browse') || lowerInput.includes('shop')) {
        const availableProductsQuery = query(
          collection(db, 'products'),
          where('quantity', '>', 0),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const productsSnap = await getDocs(availableProductsQuery);
        
        return `🛍️ **Available Items:**\n\n${productsSnap.docs.map((doc, idx) => {
          const data = doc.data();
          return `${idx + 1}. ${data.name} - ₱${data.price}\n   Stock: ${data.quantity} left`;
        }).join('\n\n') || 'No items currently available - check back soon!'}\n\n💫 **Quick Actions:**\n• "Show me hoodies" - Filter by category\n• "Under ₱1000" - Filter by price\n• "New arrivals" - Latest drops\n\nWhat style are you looking for?`;
      }

      if (lowerInput.includes('account') || lowerInput.includes('profile') || lowerInput.includes('credit')) {
        return `👤 **Your Account:**\n\n• Total Orders: ${userStats.totalOrders}\n• Pending Claims: ${userStats.pendingClaims}\n• Available Credits: ₱${userStats.availableCredits}\n• Member Since: Premium User 🌟\n\n**Quick Account Actions:**\n• Update profile info\n• Change password\n• View order history\n• Check claim status\n\nNeed help with account settings?`;
      }

      if (lowerInput.includes('payment') || lowerInput.includes('gcash') || lowerInput.includes('pay')) {
        return `💳 **Payment Options:**\n\n**Accepted Methods:**\n• GCash - Instant payment\n• Bank Transfer - 1-2 days processing\n• Credit/Debit Cards - Instant\n• Store Credits - Use accumulated credits\n\n**Payment Process:**\n1. Complete your claim\n2. Wait for admin approval\n3. Receive payment instructions\n4. Submit payment proof\n5. Item ships after verification\n\n**Current Credits:** ₱${userStats.availableCredits}\n\nHaving payment issues?`;
      }

      if (lowerInput.includes('shipping') || lowerInput.includes('delivery')) {
        return `🚚 **Shipping Information:**\n\n**Metro Manila:** ₱150 - 1-2 days\n**Provincial:** ₱200-300 - 3-5 days\n**Island Areas:** ₱350+ - 5-7 days\n\n**Shipping Partners:**\n• LBC Express\n• J&T Express  \n• Grab Express (Metro Manila)\n\n**📍 Tracking:**\nOnce shipped, you'll receive tracking details via SMS and app notifications.\n\nNeed to update your shipping address?`;
      }

      // General user responses
      const userResponses = {
        "help": `🆘 **I can help you with:**\n\n📦 **Orders:** "track my order", "order status"\n🎯 **Claims:** "how to claim", "claim status"\n🛍️ **Shopping:** "show products", "new arrivals"\n👤 **Account:** "my account", "credits balance"\n💳 **Payment:** "payment methods", "gcash payment"\n🚚 **Shipping:** "delivery options", "tracking"\n\n**Just ask naturally!** 💬\nExample: "Do you have any hoodies?" or "How do I claim items?"`,
        
        "greeting": "Hello! Welcome to Upcycled Streetwear! 🌟 I'm your personal shopping assistant. I can help you find unique pieces, guide you through claiming, track your orders, and answer any questions. What would you like to explore today?",
        
        "style": "🎨 **Style Recommendations:**\n\nBased on our trending items:\n• Vintage oversized hoodies\n• Distressed denim jackets  \n• Upcycled graphic tees\n• Sustainable streetwear sets\n\nTell me your style preference:\n• Casual & comfy\n• Edgy & bold\n• Vintage & retro\n• Minimalist & clean\n\nWhat's your vibe?",
        
        "default": "I'm here to make your Upcycled Streetwear experience amazing! 🌟 I can help you discover unique pieces, guide you through claiming items, track orders, or answer any questions. What would you like to know more about?"
      };

      // Determine response type
      if (lowerInput.includes('help') || lowerInput.includes('what can you')) {
        return userResponses.help;
      } else if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
        return userResponses.greeting;
      } else if (lowerInput.includes('style') || lowerInput.includes('recommend') || lowerInput.includes('suggest')) {
        return userResponses.style;
      } else {
        return userResponses.default;
      }

    } catch (error) {
      console.error('User AI Error:', error);
      return "I'm having a little trouble right now 😅 Please try asking again, or let me know if you need immediate help with an order!";
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
      setInputText('');

      // Get user AI response with database queries
      const aiResponse = await getUserResponse(inputText);
      
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          text: aiResponse,
          sender: "bot",
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, botMessage]);
        setIsBotTyping(false);
        setLoading(false);
      }, 1500); // Simulate typing delay

    } catch (err) {
      console.error("Error:", err);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Oops! Something went wrong 😅 Please try again or contact support if this persists.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsBotTyping(false);
      setLoading(false);
    }
  };

  const quickUserActions = [
    { text: "Track my orders", icon: "package" },
    { text: "How to claim items", icon: "target" },
    { text: "Show available products", icon: "shopping-bag" },
    { text: "Payment methods", icon: "credit-card" },
    { text: "Style recommendations", icon: "heart" },
  ];

  const sendQuickAction = (actionText) => {
    setInputText(actionText);
    setTimeout(() => sendMessage(), 100);
  };

  const toggleChat = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
    
    setIsOpen(!isOpen);
  };

  const chatTransform = {
    transform: [
      {
        translateY: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [height, 0],
        }),
      },
    ],
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Floating Chat Button */}
      {!isOpen && (
        <Animated.View style={[styles.floatingButton, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity
            onPress={toggleChat}
            style={styles.chatButton}
            activeOpacity={0.8}
          >
            <Icon name="message-circle" size={28} color="white" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Chat Modal */}
      {isOpen && (
        <Animated.View style={[styles.chatModal, chatTransform]}>
          <KeyboardAvoidingView 
            style={styles.chatContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIcon}>
                  <Icon name="message-circle" size={18} color="white" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>Upcycled Assistant</Text>
                  <Text style={styles.headerSubtitle}>Here to help you! 🌟</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                style={styles.closeButton}
              >
                <Icon name="x" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Quick Stats Bar */}
            <View style={styles.statsBar}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userStats.totalOrders}</Text>
                <Text style={styles.statLabel}>Orders</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userStats.pendingClaims}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>₱{userStats.availableCredits}</Text>
                <Text style={styles.statLabel}>Credits</Text>
              </View>
            </View>

            {/* Chat Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((msg, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.messageWrapper,
                    msg.sender === 'user' ? styles.userMessageWrapper : styles.botMessageWrapper
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      msg.sender === 'user' ? styles.userMessage : styles.botMessage
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        msg.sender === 'user' ? styles.userMessageText : styles.botMessageText
                      ]}
                    >
                      {msg.text}
                    </Text>
                  </View>
                </View>
              ))}

              {isBotTyping && (
                <View style={styles.botMessageWrapper}>
                  <View style={[styles.messageBubble, styles.botMessage, styles.typingBubble]}>
                    <View style={styles.typingIndicator}>
                      <View style={[styles.typingDot, { animationDelay: '0ms' }]} />
                      <View style={[styles.typingDot, { animationDelay: '150ms' }]} />
                      <View style={[styles.typingDot, { animationDelay: '300ms' }]} />
                    </View>
                  </View>
                </View>
              )}

              {/* Quick Actions */}
              {messages.length <= 1 && (
                <View style={styles.quickActionsContainer}>
                  <Text style={styles.quickActionsTitle}>Quick Actions:</Text>
                  {quickUserActions.map((action, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => sendQuickAction(action.text)}
                      style={styles.quickActionButton}
                      activeOpacity={0.7}
                    >
                      <Icon name={action.icon} size={16} color="#135918" />
                      <Text style={styles.quickActionText}>{action.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Input Area */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Ask me anything about orders, claims, products..."
                  placeholderTextColor="#999"
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  onPress={sendMessage}
                  disabled={loading || !inputText.trim()}
                  style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
                  activeOpacity={0.7}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Icon name="send" size={18} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      )}
    </View>
  );
};

const styles = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 1001,
  },
  chatButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#135918',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  chatModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.7,
    backgroundColor: '#FFFEF7',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  chatContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#135918',
    paddingTop: 15,
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  closeButton: {
    padding: 5,
  },
  statsBar: {
    backgroundColor: '#f0f9f0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#e0f0e0',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#135918',
  },
  statLabel: {
    fontSize: 11,
    color: '#4a7c59',
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10,
  },
  messageWrapper: {
    marginBottom: 12,
  },
  userMessageWrapper: {
    alignItems: 'flex-end',
  },
  botMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userMessage: {
    backgroundColor: '#135918',
    borderBottomRightRadius: 5,
  },
  botMessage: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0f0e0',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: 'white',
  },
  botMessageText: {
    color: '#333',
  },
  typingBubble: {
    paddingVertical: 16,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4a7c59',
    marginHorizontal: 2,
    // Add animation here if needed
  },
  quickActionsContainer: {
    marginTop: 15,
  },
  quickActionsTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    fontWeight: '500',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9f0',
    borderWidth: 1,
    borderColor: '#d0e7d0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  quickActionText: {
    marginLeft: 10,
    fontSize: 13,
    color: '#135918',
    fontWeight: '500',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0f0e0',
    backgroundColor: '#FFFEF7',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d0e7d0',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: 'white',
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#135918',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
};

export default UpcycledUserAssistant;