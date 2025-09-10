import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from "react-native"
import Icon from 'react-native-vector-icons/MaterialIcons'
import { useAuth } from "../AuthContext"
import { collection, onSnapshot } from "firebase/firestore"
import { db } from "../firebase/firebase"

export default function CartScreen({ route, navigation }) {
  const { currentUser } = useAuth()
  const [orderItem, setOrderItem] = useState(null)
  const [cartItems, setCartItems] = useState([])

  useEffect(() => {
    // If navigated with an orderItem param, show it immediately
    if (route?.params?.orderItem) {
      setOrderItem(route.params.orderItem)
      setCartItems([route.params.orderItem])
    }

    // Subscribe to won bids (successful bids) for current user
    if (currentUser?.uid) {
      const unsub = onSnapshot(collection(db, 'products'), (snap) => {
        const nowon = []
        snap.docs.forEach(d => {
          const data = d.data()
          // Find user's bid on this product
          const userBid = (data.bids || []).find(b => b.bidderId === currentUser.uid)
          if (!userBid) return
          // Determine if user won: prefer explicit highestBidder, else compute
          const explicitWon = data.status === 'sold' && (data.highestBidder === userBid.bidderName || data.highestBidderId === currentUser.uid)
          let computedWon = false
          if (!explicitWon && Array.isArray(data.bids) && data.bids.length > 0) {
            const top = data.bids.reduce((max, b) => (b.amount > (max?.amount || -Infinity) ? b : max), null)
            computedWon = data.status === 'sold' && top && (top.bidderId === currentUser.uid)
          }
          if (explicitWon || computedWon) {
            const soldAt = data.soldAt?.toDate ? data.soldAt.toDate() : (data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date())
            nowon.push({
              id: d.id,
              title: data.name,
              category: data.category || '',
              image: data.imageUrls?.[0] || "https://via.placeholder.com/120x120/CCCCCC/FFFFFF?text=Item",
              myBid: userBid.amount,
              currentBid: data.currentBid || userBid.amount,
              orderId: data.orderId || (data.numericId ? `Id ${data.numericId}` : `Id ${d.id.slice(-4)}`),
              orderDate: soldAt.toISOString(),
              status: 'won',
            })
          }
        })
        // Sort by sold date desc
        nowon.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
        if (!route?.params?.orderItem) {
          setCartItems(nowon)
        }
      })
      return () => unsub()
    }
  }, [currentUser?.uid, route?.params?.orderItem])

  const handleCheckout = () => {
    navigation.navigate('Checkout', { items: cartItems })
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.myBid || item.currentBid), 0)
  }

  if (cartItems.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>My Won Bids</Text>
        <Text style={styles.message}>Your successful bids will appear here once auctions are finalized.</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Won Bids</Text>
        <Text style={styles.subtitle}>Review your successful auction items</Text>
      </View>

      {cartItems.map((item, index) => (
        <View key={index} style={styles.orderCard}>
          <Image source={{ uri: item.image }} style={styles.orderImage} />
          <View style={styles.orderContent}>
            <Text style={styles.orderTitle}>{item.title}</Text>
            <Text style={styles.orderCategory}>{item.category}</Text>
            
            <View style={styles.orderDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Winning Bid:</Text>
                <Text style={styles.detailValue}>₱{item.myBid?.toLocaleString()}</Text>
              </View>
              {item.orderId && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order ID:</Text>
                  <Text style={styles.detailValue}>{item.orderId}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order Date:</Text>
                <Text style={styles.detailValue}>
                  {new Date(item.orderDate).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={[styles.statusBadge, { backgroundColor: '#4A90E2' }]}>
                  <Text style={styles.statusText}>Won</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      ))}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Order Summary</Text>
        {cartItems.map((item, idx) => (
          <View key={idx} style={styles.summaryRow}> 
            <Text style={[styles.summaryLabel, { flex: 1 }]} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.summaryValue}>₱{(item.myBid || item.currentBid).toLocaleString()}</Text>
          </View>
        ))}
        <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: '#E0E0E0', paddingTop: 10, marginTop: 5 }]}>
          <Text style={styles.summaryLabel}>Subtotal:</Text>
          <Text style={styles.summaryValue}>₱{calculateTotal().toLocaleString()}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Shipping:</Text>
          <Text style={styles.summaryValue}>₱150</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>₱{(calculateTotal() + 150).toLocaleString()}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
        <Icon name="shopping-cart" size={20} color="white" style={styles.checkoutIcon} />
        <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    marginBottom: 50,
  },
  header: {
    backgroundColor: "#2E6A2E",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
  },
  message: {
    fontSize: 16,
    color: "#4A4A4A",
    textAlign: "center",
    lineHeight: 24,
  },
  orderCard: {
    backgroundColor: "white",
    margin: 15,
    borderRadius: 15,
    padding: 15,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  orderContent: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  orderCategory: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  orderDetails: {
    flex: 1,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: "white",
    fontWeight: "bold",
  },
  summaryCard: {
    backgroundColor: "white",
    margin: 15,
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: "#666",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 10,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E6A2E",
  },
  checkoutButton: {
    backgroundColor: "#2E6A2E",
    margin: 15,
    borderRadius: 15,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  checkoutIcon: {
    marginRight: 10,
  },
  checkoutButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  bottomPadding: {
    height: 50,
  },
})
