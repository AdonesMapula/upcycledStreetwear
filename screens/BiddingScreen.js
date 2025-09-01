import React, { useState, useCallback, useMemo, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, TextInput } from "react-native"
import { useAuth } from "../AuthContext"
import { productService, biddingService } from "../firebase/services"
import Feather from "react-native-vector-icons/Feather"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"

export default function BiddingScreen({ navigation }) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("available")
  const [availableProducts, setAvailableProducts] = useState([])
  const [myClaims, setMyClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState(null)
  const [bidAmount, setBidAmount] = useState("")

  // Fetch bidding data from Firebase
  const fetchBiddingData = async () => {
    try {
      setLoading(true)
      
      // Fetch available products for bidding
      const available = await productService.getAvailableProducts()
      setAvailableProducts(available)

      // Fetch user's claims if logged in
      if (user?.uid) {
        const claims = await biddingService.getUserClaims(user.uid)
        setMyClaims(claims)
      }

    } catch (error) {
      console.error("Error fetching bidding data:", error)
      Alert.alert("Error", "Failed to load bidding data")
    } finally {
      setLoading(false)
    }
  }

  // Load bidding data on component mount
  useEffect(() => {
    fetchBiddingData()
  }, [user?.uid])

  // Handle Mine claim
  const handleMine = async (product) => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to claim items")
      return
    }

    try {
      await biddingService.claimMine(product.id, user.uid, user.displayName || user.email)
      Alert.alert("Success", "You've claimed 'Mine' on this item! Bidding starts now.")
      fetchBiddingData() // Refresh the data
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to claim Mine")
    }
  }

  // Handle Grab claim
  const handleGrab = async (product) => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to grab items")
      return
    }

    Alert.alert(
      "Grab Item",
      `Are you sure you want to grab "${product.name}" for ₱${product.price}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Grab It!",
          onPress: async () => {
            try {
              await biddingService.claimGrab(product.id, user.uid, user.displayName || user.email)
              Alert.alert("Success", "You've grabbed this item! It's yours unless someone steals it.")
              fetchBiddingData()
            } catch (error) {
              Alert.alert("Error", error.message || "Failed to grab item")
            }
          }
        }
      ]
    )
  }

  // Handle Steal bid
  const handleSteal = async (product) => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to steal items")
      return
    }

    setSelectedItem(product)
    setBidAmount((product.currentBid + 50).toString())
  }

  const handlePlaceStealBid = async () => {
    if (!selectedItem) return

    const amount = parseFloat(bidAmount)
    if (isNaN(amount) || amount <= selectedItem.currentBid) {
      Alert.alert("Invalid Bid", "Bid amount must be higher than current bid")
      return
    }

    try {
      await biddingService.placeStealBid(selectedItem.id, user.uid, user.displayName || user.email, amount)
      Alert.alert("Success", `You've stolen this item with a bid of ₱${amount}!`)
      setSelectedItem(null)
      setBidAmount("")
      fetchBiddingData()
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to place steal bid")
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "available": return "#2E6A2E"
      case "mine": return "#F5A623"
      case "grab": return "#4A90E2"
      case "sold": return "#D0021B"
      default: return "#888"
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "available": return "Available"
      case "mine": return "Mine Claimed"
      case "grab": return "Grab Claimed"
      case "sold": return "Sold"
      default: return "Unknown"
    }
  }

  const formatPrice = (price) => {
    return `₱${parseFloat(price).toLocaleString()}`
  }

  const getTimeRemaining = (claimTime) => {
    if (!claimTime) return "No time limit"
    
    const now = new Date()
    const claimDate = claimTime.toDate()
    const hoursDiff = (now - claimDate) / (1000 * 60 * 60)
    const remainingHours = 24 - hoursDiff
    
    if (remainingHours <= 0) return "Expired"
    if (remainingHours < 1) return `${Math.floor(remainingHours * 60)}m left`
    return `${Math.floor(remainingHours)}h left`
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#2E6A2E" />
        <Text style={styles.loadingText}>Loading bidding items...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bidding Center</Text>
        <Text style={styles.headerSubtitle}>Mine • Grab • Steal</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "available" && styles.activeTab]}
          onPress={() => setActiveTab("available")}
        >
          <Text style={[styles.tabText, activeTab === "available" && styles.activeTabText]}>
            Available ({availableProducts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "myClaims" && styles.activeTab]}
          onPress={() => setActiveTab("myClaims")}
        >
          <Text style={[styles.tabText, activeTab === "myClaims" && styles.activeTabText]}>
            My Claims ({myClaims.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === "available" ? (
          <View style={styles.productsContainer}>
            {availableProducts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="package-variant" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No available items</Text>
                <Text style={styles.emptySubtext}>Check back later for new items</Text>
              </View>
            ) : (
              availableProducts.map((product) => (
                <View key={product.id} style={styles.productCard}>
                  <Image source={{ uri: product.imageUrl || "https://via.placeholder.com/120x120/CCCCCC/FFFFFF?text=Product" }} style={styles.productImage} />
                  <View style={styles.productContent}>
                    <Text style={styles.productTitle}>{product.name}</Text>
                    <Text style={styles.productCategory}>{product.category}</Text>
                    
                    <View style={styles.bidInfo}>
                      <Text style={styles.priceLabel}>Price:</Text>
                      <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(product.status) + "20" }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(product.status) }]}>
                        {getStatusText(product.status)}
                      </Text>
                    </View>

                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.mineButton]}
                        onPress={() => handleMine(product)}
                      >
                        <Text style={styles.mineButtonText}>MINE</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.actionButton, styles.grabButton]}
                        onPress={() => handleGrab(product)}
                      >
                        <Text style={styles.grabButtonText}>GRAB</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.myClaimsContainer}>
            {!user ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Please sign in to view your claims</Text>
                <TouchableOpacity 
                  style={styles.signInButton}
                  onPress={() => navigation.navigate("SignIn")}
                >
                  <Text style={styles.signInButtonText}>Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : myClaims.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No claims yet</Text>
                <Text style={styles.emptySubtext}>Start bidding on available items</Text>
              </View>
            ) : (
              myClaims.map((product) => (
                <View key={product.id} style={styles.claimCard}>
                  <Image source={{ uri: product.imageUrl || "https://via.placeholder.com/80x80/CCCCCC/FFFFFF?text=Product" }} style={styles.claimImage} />
                  <View style={styles.claimContent}>
                    <Text style={styles.claimTitle}>{product.name}</Text>
                    
                    <View style={styles.claimDetails}>
                      <Text style={styles.claimLabel}>Your Bid:</Text>
                      <Text style={styles.claimAmount}>{formatPrice(product.currentBid)}</Text>
                    </View>

                    <View style={styles.claimFooter}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(product.status) + "20" }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(product.status) }]}>
                          {getStatusText(product.status)}
                        </Text>
                      </View>
                      <Text style={styles.timeRemaining}>
                        {getTimeRemaining(product.mineClaimedAt || product.grabClaimedAt)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Steal Bid Modal */}
      {selectedItem && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Steal "{selectedItem.name}"</Text>
            <Text style={styles.modalSubtitle}>Current Bid: {formatPrice(selectedItem.currentBid)}</Text>
            
            <TextInput
              style={styles.bidInput}
              placeholder="Enter your bid amount"
              value={bidAmount}
              onChangeText={setBidAmount}
              keyboardType="numeric"
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setSelectedItem(null)
                  setBidAmount("")
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handlePlaceStealBid}
              >
                <Text style={styles.confirmButtonText}>Steal It!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  header: {
    backgroundColor: "#2E6A2E",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "white",
    opacity: 0.9,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: -15,
    borderRadius: 15,
    padding: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: "#2E6A2E",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: "white",
  },
  content: {
    flex: 1,
    marginTop: 20,
    paddingBottom: 100, // Add bottom padding to prevent navbar overlap
  },
  productsContainer: {
    paddingHorizontal: 20,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
  },
  signInButton: {
    backgroundColor: "#2E6A2E",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
  },
  signInButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  productCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 15,
  },
  productContent: {
    flex: 1,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  productCategory: {
    fontSize: 12,
    color: "#666",
    marginBottom: 10,
  },
  bidInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 5,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E6A2E",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  mineButton: {
    backgroundColor: "#F5A623",
  },
  mineButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  grabButton: {
    backgroundColor: "#4A90E2",
  },
  grabButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  myClaimsContainer: {
    paddingHorizontal: 20,
  },
  claimCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  claimImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 15,
  },
  claimContent: {
    flex: 1,
  },
  claimTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  claimDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  claimLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 5,
  },
  claimAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E6A2E",
  },
  claimFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeRemaining: {
    fontSize: 12,
    color: "#F5A623",
    fontWeight: "600",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  modal: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 25,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  bidInput: {
    width: "100%",
    height: 50,
    borderColor: "#E0E0E0",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 18,
    color: "#333",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  cancelButton: {
    backgroundColor: "#D0021B",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  cancelButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  confirmButton: {
    backgroundColor: "#2E6A2E",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
})
