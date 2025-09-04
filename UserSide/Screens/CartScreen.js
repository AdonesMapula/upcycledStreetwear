// Removed "use client"
import { View, Text, StyleSheet } from "react-native"

export default function CartScreen() {
  // console.log("CartScreen rendered"); // Added for debugging, can be removed later
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Cart</Text>
      <Text style={styles.message}>Items added to your cart will appear here.</Text>
      {/* You can add your cart items list, total, checkout button here */}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA", // Consistent with app background
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2E6A2E",
    marginBottom: 15,
  },
  message: {
    fontSize: 16,
    color: "#4A4A4A",
    textAlign: "center",
    lineHeight: 24,
  },
})
