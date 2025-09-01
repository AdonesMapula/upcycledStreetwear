"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, TextInput, Alert } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import Feather from "react-native-vector-icons/Feather"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { useAuth } from "../AuthContext"
import { productService, cartService, biddingService } from "../firebase/services"

const { width, height } = Dimensions.get("window")

export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [userStats, setUserStats] = useState({
    activeBids: 0,
    endingSoon: 0,
    wonItems: 0
  })
  const { user } = useAuth()

  const categories = [
    { id: "all", name: "All", icon: "grid", color: "#2E6A2E" },
    { id: "electronics", name: "Electronics", icon: "smartphone", color: "#4A90E2" },
    { id: "fashion", name: "Fashion", icon: "shopping-bag", color: "#F5A623" },
    { id: "home", name: "Home", icon: "home", color: "#7ED321" },
    { id: "art", name: "Art", icon: "image", color: "#D0021B" },
  ]

  useEffect(() => {
    fetchProducts()
    if (user) {
      fetchUserStats()
    }
  }, [user])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, selectedCategory])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const fetchedProducts = await productService.getAllProducts()
      setProducts(fetchedProducts)
    } catch (error) {
      console.error("Error fetching products:", error)
      Alert.alert("Error", "Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  const fetchUserStats = async () => {
    if (!user?.uid) return
    
    try {
      const userBids = await biddingService.getUserBids(user.uid)
      const userClaims = await biddingService.getUserClaims(user.uid)
      
      setUserStats({
        activeBids: userClaims.filter(item => item.status !== 'sold').length,
        endingSoon: userClaims.filter(item => {
          if (item.status === 'sold') return false
          const claimTime = item.mineClaimedAt || item.grabClaimedAt
          if (!claimTime) return false
          const hoursDiff = (new Date() - claimTime.toDate()) / (1000 * 60 * 60)
          return hoursDiff >= 20 // Show as ending soon if within 4 hours of 24-hour limit
        }).length,
        wonItems: userClaims.filter(item => item.status === 'sold' && item.currentBidder === user.uid).length
      })
    } catch (error) {
      console.error("Error fetching user stats:", error)
    }
  }

  const filterProducts = () => {
    let filtered = products.filter(product => 
      product.status === 'available' && 
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => 
        product.category.toLowerCase() === selectedCategory.toLowerCase()
      )
    }

    setFilteredProducts(filtered)
  }

  // Handle Mine claim - Start bidding
  const handleMine = async (product) => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to claim items")
      return
    }

    try {
      await biddingService.claimMine(product.id, user.uid, user.displayName || user.email)
      Alert.alert("Success", "You've claimed 'Mine' on this item! Bidding starts now.")
      fetchProducts() // Refresh the list
      fetchUserStats() // Update stats
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to claim Mine")
    }
  }

  // Handle Grab claim - Accept the set price
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
              fetchProducts()
              fetchUserStats()
            } catch (error) {
              Alert.alert("Error", error.message || "Failed to grab item")
            }
          }
        }
      ]
    )
  }

  // Handle Steal bid - Place a higher bid
  const handleSteal = async (product) => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to steal items")
      return
    }

    // Show input dialog for bid amount
    Alert.prompt(
      "Steal This Item",
      `Current bid: ₱${product.currentBid}\nEnter your bid amount (must be higher):`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Steal It!",
          onPress: async (bidAmount) => {
            const amount = parseFloat(bidAmount)
            if (isNaN(amount) || amount <= product.currentBid) {
              Alert.alert("Invalid Bid", "Bid amount must be higher than current bid")
              return
            }

            try {
              await biddingService.placeStealBid(product.id, user.uid, user.displayName || user.email, amount)
              Alert.alert("Success", `You've stolen this item with a bid of ₱${amount}!`)
              fetchProducts()
              fetchUserStats()
            } catch (error) {
              Alert.alert("Error", error.message || "Failed to place steal bid")
            }
          }
        }
      ],
      "plain-text",
      (product.currentBid + 50).toString()
    )
  }

  const handleProductPress = (product) => {
    navigation.navigate("ProductDetail", { product })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#2E6A2E'
      case 'mine': return '#F5A623'
      case 'grab': return '#4A90E2'
      case 'sold': return '#D0021B'
      default: return '#666'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Available'
      case 'mine': return 'Mine Claimed'
      case 'grab': return 'Grab Claimed'
      case 'sold': return 'Sold'
      default: return 'Unknown'
    }
  }

  const formatPrice = (price) => {
    return `₱${parseFloat(price).toLocaleString()}`
  }

  const getTimeLeft = (endDate) => {
    if (!endDate) return "No time limit"
    const now = new Date()
    const end = new Date(endDate)
    const diff = end - now
    
    if (diff <= 0) return "Ended"
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hours}h ${minutes}m`
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <LinearGradient colors={["#2E6A2E", "#4A8F4A"]} style={styles.headerSection}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>Welcome Back!</Text>
          <Text style={styles.headerSubtext}>Discover amazing deals and place your bids</Text>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Feather name="search" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for items..."
              placeholderTextColor="#888"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
        </View>
      </LinearGradient>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="gavel" size={24} color="#2E6A2E" />
          <Text style={styles.statNumber}>{userStats.activeBids}</Text>
          <Text style={styles.statLabel}>Active Bids</Text>
        </View>
        <View style={styles.statCard}>
          <Feather name="clock" size={24} color="#F5A623" />
          <Text style={styles.statNumber}>{userStats.endingSoon}</Text>
          <Text style={styles.statLabel}>Ending Soon</Text>
        </View>
        <View style={styles.statCard}>
          <Feather name="award" size={24} color="#D0021B" />
          <Text style={styles.statNumber}>{userStats.wonItems}</Text>
          <Text style={styles.statLabel}>Won Items</Text>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Browse Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {categories.map((category) => (
            <TouchableOpacity 
              key={category.id} 
              style={[
                styles.categoryCard, 
                { 
                  borderColor: category.color,
                  backgroundColor: selectedCategory === category.id ? category.color + '20' : 'white'
                }
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                <Feather name={category.icon} size={24} color="white" />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Products Grid */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === "all" ? "All Products" : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`}
          </Text>
          <Text style={styles.productCount}>{filteredProducts.length} items</Text>
        </View>

        {filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="package-variant" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or category filter</Text>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {filteredProducts.map((product) => (
              <TouchableOpacity 
                key={product.id} 
                style={styles.productCard}
                onPress={() => handleProductPress(product)}
              >
                <Image 
                  source={{ uri: product.imageUrl || "https://via.placeholder.com/150x150/CCCCCC/FFFFFF?text=Product" }} 
                  style={styles.productImage} 
                />
                <View style={styles.productContent}>
                  <Text style={styles.productTitle} numberOfLines={2}>{product.name}</Text>
                  <Text style={styles.productDescription} numberOfLines={2}>{product.description}</Text>
                  
                  <View style={styles.productDetails}>
                    <Text style={styles.productCategory}>{product.category}</Text>
                    <Text style={styles.productSize}>Size: {product.size}</Text>
                  </View>
                  
                  <View style={styles.productFooter}>
                    <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
                    {product.currentBid > 0 && (
                      <Text style={styles.currentBid}>Current: {formatPrice(product.currentBid)}</Text>
                    )}
                  </View>
                  
                  {/* Status Badge */}
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(product.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(product.status) }]}>
                      {getStatusText(product.status)}
                    </Text>
                  </View>
                  
                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    {product.status === 'available' && (
                      <>
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
                      </>
                    )}
                    
                    {(product.status === 'mine' || product.status === 'grab') && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.stealButton]}
                        onPress={() => handleSteal(product)}
                      >
                        <Text style={styles.stealButtonText}>STEAL</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Bottom padding for navigation */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  headerSection: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  headerSubtext: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#333",
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: -15,
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
    minWidth: 80,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  productCount: {
    fontSize: 14,
    color: "#666",
  },
  categoriesScroll: {
    marginTop: 10,
  },
  categoryCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    marginRight: 15,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 100,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 5,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  productCard: {
    backgroundColor: "white",
    borderRadius: 15,
    marginBottom: 15,
    width: "48%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: "100%",
    height: 120,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  productContent: {
    padding: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  productDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  productCategory: {
    fontSize: 10,
    color: "#2E6A2E",
    fontWeight: "600",
  },
  productSize: {
    fontSize: 10,
    color: "#666",
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E6A2E",
  },
  currentBid: {
    fontSize: 12,
    color: "#F5A623",
    fontWeight: "600",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 6,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  mineButton: {
    backgroundColor: "#F5A623",
  },
  mineButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 10,
  },
  grabButton: {
    backgroundColor: "#4A90E2",
  },
  grabButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 10,
  },
  stealButton: {
    backgroundColor: "#D0021B",
  },
  stealButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 10,
  },
  addToCartButton: {
    backgroundColor: "#2E6A2E",
    borderRadius: 20,
    padding: 8,
  },
  bottomPadding: {
    height: 50,
  },
})
