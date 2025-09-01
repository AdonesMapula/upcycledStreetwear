"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native"
import Feather from "react-native-vector-icons/Feather"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { useAuth } from "../AuthContext"
import { cartService, productService } from "../firebase/services"

export default function CartScreen({ navigation }) {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchCartItems()
    }
  }, [user])

  const fetchCartItems = async () => {
    try {
      setLoading(true)
      const userCart = await cartService.getUserCart(user.uid)
      
      // Fetch product details for each cart item
      const cartWithProducts = await Promise.all(
        userCart.map(async (cartItem) => {
          const product = await productService.getProductById(cartItem.productId)
          return {
            ...cartItem,
            product
          }
        })
      )
      
      setCartItems(cartWithProducts.filter(item => item.product)) // Only show items with valid products
    } catch (error) {
      console.error("Error fetching cart items:", error)
      Alert.alert("Error", "Failed to load cart items")
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      await removeFromCart(cartItemId)
      return
    }

    try {
      setUpdating(true)
      await cartService.updateCartItemQuantity(cartItemId, newQuantity)
      setCartItems(cartItems.map(item => 
        item.id === cartItemId ? { ...item, quantity: newQuantity } : item
      ))
    } catch (error) {
      console.error("Error updating quantity:", error)
      Alert.alert("Error", "Failed to update quantity")
    } finally {
      setUpdating(false)
    }
  }

  const removeFromCart = async (cartItemId) => {
    try {
      setUpdating(true)
      await cartService.removeFromCart(cartItemId)
      setCartItems(cartItems.filter(item => item.id !== cartItemId))
      Alert.alert("Success", "Item removed from cart")
    } catch (error) {
      console.error("Error removing from cart:", error)
      Alert.alert("Error", "Failed to remove item")
    } finally {
      setUpdating(false)
    }
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (parseFloat(item.product.price) * item.quantity)
    }, 0)
  }

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert("Empty Cart", "Please add items to your cart before checkout")
      return
    }

    Alert.alert(
      "Checkout",
      `Total: ₱${calculateTotal().toLocaleString()}\n\nProceed to checkout?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Proceed", onPress: () => navigation.navigate("Checkout", { cartItems, total: calculateTotal() }) }
      ]
    )
  }

  const formatPrice = (price) => {
    return `₱${parseFloat(price).toLocaleString()}`
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <MaterialCommunityIcons name="cart-off" size={64} color="#ccc" />
        <Text style={styles.title}>Sign In Required</Text>
        <Text style={styles.message}>Please sign in to view your cart</Text>
        <TouchableOpacity 
          style={styles.signInButton}
          onPress={() => navigation.navigate("SignIn")}
        >
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2E6A2E" />
        <Text style={styles.loadingText}>Loading your cart...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Cart</Text>
        <Text style={styles.itemCount}>{cartItems.length} items</Text>
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="cart-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyMessage}>Add some products to get started</Text>
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={() => navigation.navigate("Bidding")}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView style={styles.cartList} showsVerticalScrollIndicator={false}>
            {cartItems.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                <Image 
                  source={{ uri: item.product.imageUrl || "https://via.placeholder.com/80x80/CCCCCC/FFFFFF?text=Product" }} 
                  style={styles.itemImage} 
                />
                
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
                  <Text style={styles.itemCategory}>{item.product.category}</Text>
                  <Text style={styles.itemSize}>Size: {item.product.size}</Text>
                  <Text style={styles.itemPrice}>{formatPrice(item.product.price)}</Text>
                </View>

                <View style={styles.itemActions}>
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={updating}
                    >
                      <Feather name="minus" size={16} color="#2E6A2E" />
                    </TouchableOpacity>
                    
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={updating}
                    >
                      <Feather name="plus" size={16} color="#2E6A2E" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.itemTotal}>
                    {formatPrice(item.product.price * item.quantity)}
                  </Text>

                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removeFromCart(item.id)}
                    disabled={updating}
                  >
                    <Feather name="trash-2" size={16} color="#D0021B" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>{formatPrice(calculateTotal())}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.checkoutButton}
              onPress={handleCheckout}
              disabled={updating}
            >
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
              <Feather name="arrow-right" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2E6A2E",
    marginBottom: 5,
  },
  itemCount: {
    fontSize: 16,
    color: "#666",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  shopButton: {
    backgroundColor: "#2E6A2E",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  shopButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
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
  cartList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cartItem: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    marginVertical: 8,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  itemDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 12,
    color: "#2E6A2E",
    fontWeight: "500",
  },
  itemSize: {
    fontSize: 12,
    color: "#666",
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E6A2E",
  },
  itemActions: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: "center",
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E6A2E",
    marginTop: 8,
  },
  removeButton: {
    padding: 8,
    marginTop: 8,
  },
  footer: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E6A2E",
  },
  checkoutButton: {
    backgroundColor: "#2E6A2E",
    borderRadius: 25,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2E6A2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  checkoutButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 10,
  },
})
