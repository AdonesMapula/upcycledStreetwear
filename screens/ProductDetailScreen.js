"use client"

import { useState, useEffect } from "react"
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  Alert,
  ActivityIndicator 
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import Feather from "react-native-vector-icons/Feather"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { useAuth } from "../AuthContext"
import { cartService, productService } from "../firebase/services"

const { width, height } = Dimensions.get("window")

export default function ProductDetailScreen({ route, navigation }) {
  const { product: initialProduct } = route.params
  const [product, setProduct] = useState(initialProduct)
  const [loading, setLoading] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const { user } = useAuth()

  useEffect(() => {
    if (!initialProduct.id) {
      fetchProductDetails()
    }
  }, [initialProduct.id])

  const fetchProductDetails = async () => {
    try {
      setLoading(true)
      const productDetails = await productService.getProductById(initialProduct.id)
      if (productDetails) {
        setProduct(productDetails)
      }
    } catch (error) {
      console.error("Error fetching product details:", error)
      Alert.alert("Error", "Failed to load product details")
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!user) {
      Alert.alert("Error", "Please sign in to add items to cart")
      return
    }

    try {
      setLoading(true)
      await cartService.addToCart(user.uid, product.id, quantity)
      Alert.alert("Success", "Item added to cart!")
      navigation.navigate("Cart")
    } catch (error) {
      console.error("Error adding to cart:", error)
      Alert.alert("Error", "Failed to add item to cart")
    } finally {
      setLoading(false)
    }
  }

  const handleBuyNow = () => {
    if (!user) {
      Alert.alert("Error", "Please sign in to purchase items")
      return
    }

    Alert.alert(
      "Buy Now",
      `Total: ₱${(parseFloat(product.price) * quantity).toLocaleString()}\n\nProceed to checkout?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Proceed", onPress: () => navigation.navigate("Checkout", { 
          cartItems: [{ product, quantity }], 
          total: parseFloat(product.price) * quantity 
        })}
      ]
    )
  }

  const formatPrice = (price) => {
    return `₱${parseFloat(price).toLocaleString()}`
  }

  const getConditionColor = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'excellent':
        return '#4CAF50'
      case 'good':
        return '#8BC34A'
      case 'fair':
        return '#FF9800'
      case 'poor':
        return '#F44336'
      default:
        return '#666'
    }
  }

  if (loading && !product.id) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E6A2E" />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#2E6A2E", "#4A8F4A"]} style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity 
          style={styles.cartButton}
          onPress={() => navigation.navigate("Cart")}
        >
          <Feather name="shopping-cart" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: product.imageUrl || "https://via.placeholder.com/400x400/CCCCCC/FFFFFF?text=Product" }} 
            style={styles.productImage}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay}>
            <View style={[styles.statusBadge, { backgroundColor: product.status === 'available' ? '#4CAF50' : '#F44336' }]}>
              <Text style={styles.statusText}>{product.status?.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productDescription}>{product.description}</Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            <View style={[styles.conditionBadge, { backgroundColor: getConditionColor(product.condition) + '20' }]}>
              <Text style={[styles.conditionText, { color: getConditionColor(product.condition) }]}>
                {product.condition}
              </Text>
            </View>
          </View>

          {/* Product Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category:</Text>
              <Text style={styles.detailValue}>{product.category}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Size:</Text>
              <Text style={styles.detailValue}>{product.size}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Condition:</Text>
              <Text style={styles.detailValue}>{product.condition}</Text>
            </View>
            {product.createdAt && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Added:</Text>
                <Text style={styles.detailValue}>
                  {new Date(product.createdAt.seconds * 1000).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>

          {/* Quantity Selector */}
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantity:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Feather name="minus" size={20} color="#2E6A2E" />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Feather name="plus" size={20} color="#2E6A2E" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Total Price */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalPrice}>{formatPrice(product.price * quantity)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.addToCartButton]}
          onPress={handleAddToCart}
          disabled={loading || product.status !== 'available'}
        >
          <MaterialCommunityIcons name="cart-plus" size={20} color="white" />
          <Text style={styles.actionButtonText}>Add to Cart</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.buyNowButton]}
          onPress={handleBuyNow}
          disabled={loading || product.status !== 'available'}
        >
          <Feather name="shopping-bag" size={20} color="white" />
          <Text style={styles.actionButtonText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    marginTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  cartButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 300,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    top: 20,
    right: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  productInfo: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  productDescription: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 20,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  price: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2E6A2E",
  },
  conditionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  conditionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  detailsContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: "center",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E6A2E",
  },
  actionContainer: {
    flexDirection: "row",
    padding: 20,
    paddingBottom: 30,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 25,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addToCartButton: {
    backgroundColor: "#2E6A2E",
  },
  buyNowButton: {
    backgroundColor: "#D0021B",
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
})
