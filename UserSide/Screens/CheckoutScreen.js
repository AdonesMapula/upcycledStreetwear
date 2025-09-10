import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from "react-native"
import Icon from 'react-native-vector-icons/MaterialIcons'
import { useAuth } from "../AuthContext"

export default function CheckoutScreen({ route, navigation }) {
  const items = route?.params?.items || []
  const { currentUser, userData } = useAuth()

  const [firstName, setFirstName] = useState("")
  const [middleName, setMiddleName] = useState("")
  const [lastName, setLastName] = useState("")
  const [address, setAddress] = useState("")
  const [contactNumber, setContactNumber] = useState("")

  useEffect(() => {
    // Prefill from user profile if available
    const profile = userData || currentUser || {}
    const fullName = profile.name || ""
    if (fullName && !firstName && !lastName) {
      const parts = fullName.trim().split(/\s+/)
      if (parts.length === 1) {
        setFirstName(parts[0])
      } else if (parts.length === 2) {
        setFirstName(parts[0])
        setLastName(parts[1])
      } else if (parts.length >= 3) {
        setFirstName(parts[0])
        setMiddleName(parts.slice(1, -1).join(" "))
        setLastName(parts[parts.length - 1])
      }
    }
    if (profile.address && !address) setAddress(profile.address)
    if (profile.contactNumber && !contactNumber) setContactNumber(profile.contactNumber)
  }, [userData, currentUser])

  const handlePlaceOrder = () => {
    if (!firstName.trim() || !lastName.trim() || !address.trim() || !contactNumber.trim()) {
      Alert.alert("Missing Info", "Please complete all required fields.")
      return
    }
    Alert.alert("Order Placed", "Your order has been submitted successfully.", [
      { text: "OK", onPress: () => navigation.navigate('Cart') }
    ])
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Checkout</Text>
        <Text style={styles.subtitle}>Enter your information to complete the order</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <View style={styles.row}>
          <View style={[styles.inputGroup, { marginRight: 8 }]}> 
            <Text style={styles.label}>First Name</Text>
            <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="Juan" />
          </View>
          <View style={[styles.inputGroup, { marginLeft: 8 }]}> 
            <Text style={styles.label}>Middle Name</Text>
            <TextInput style={styles.input} value={middleName} onChangeText={setMiddleName} placeholder="Santos" />
          </View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Dela Cruz" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput style={[styles.input, styles.multiline]} value={address} onChangeText={setAddress} placeholder="House No, Street, Barangay, City, Province, ZIP" multiline />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contact Number</Text>
          <TextInput style={styles.input} value={contactNumber} onChangeText={setContactNumber} placeholder="09XXXXXXXXX" keyboardType="phone-pad" />
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <Text style={styles.summaryText}>Items: {items.length}</Text>
      </View>

      <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder}>
        <Icon name="check-circle" size={20} color="white" style={styles.checkoutIcon} />
        <Text style={styles.placeOrderText}>Place Order</Text>
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    marginbottom: 50,
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
  formCard: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
  },
  inputGroup: {
    flex: 1,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  multiline: {
    textAlignVertical: "top",
    minHeight: 80,
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
  summaryText: {
    fontSize: 16,
    color: "#333",
  },
  placeOrderButton: {
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
  placeOrderText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  bottomPadding: {
    height: 50,
  },
})


