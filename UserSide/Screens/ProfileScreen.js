import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Modal, TextInput, Button } from "react-native"
import Feather from "react-native-vector-icons/Feather"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { useAuth } from "../AuthContext"
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/firebase'

export default function ProfileScreen({ navigation }) {
  const { currentUser, signOut, isLoading, updateUserProfile } = useAuth()
  const [modalVisible, setModalVisible] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [location, setLocation] = useState("")

  // Fetch user profile data from Firestore
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (currentUser?.uid) {
        try {
          console.log("[ProfileScreen] Fetching user profile for UID:", currentUser.uid)
          const userRef = doc(db, 'users', currentUser.uid)
          const userDoc = await getDoc(userRef)
          
          if (userDoc.exists()) {
            const userData = userDoc.data()
            console.log("[ProfileScreen] User data fetched:", userData)
            setUserProfile(userData)
            
            // Set form values
            setFirstName(userData.firstName || "")
            setLastName(userData.lastName || "")
            setContactNumber(userData.contactNumber || userData.phone || "")
            setLocation(userData.location || "")
          } else {
            console.log("[ProfileScreen] No user document found")
            // Use currentUser data as fallback
            setUserProfile(currentUser)
            setFirstName(currentUser.firstName || "")
            setLastName(currentUser.lastName || "")
            setContactNumber(currentUser.contactNumber || currentUser.phone || "")
            setLocation(currentUser.location || "")
          }
        } catch (error) {
          console.error("[ProfileScreen] Error fetching user profile:", error)
          // Use currentUser data as fallback
          setUserProfile(currentUser)
          setFirstName(currentUser?.firstName || "")
          setLastName(currentUser?.lastName || "")
          setContactNumber(currentUser?.contactNumber || currentUser?.phone || "")
          setLocation(currentUser?.location || "")
        }
      }
      setLoading(false)
    }

    fetchUserProfile()
  }, [currentUser])

  const handleSave = async () => {
    try {
      setUpdating(true)
      
      // Validate required fields
      if (!firstName.trim() || !lastName.trim()) {
        Alert.alert("Validation Error", "First name and last name are required.")
        return
      }

      console.log("[ProfileScreen] Updating user profile:", { firstName, lastName, contactNumber, location })

      // Update Firebase
      if (currentUser?.uid) {
        const userRef = doc(db, 'users', currentUser.uid)
        const updateData = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          contactNumber: contactNumber.trim(),
          phone: contactNumber.trim(), // Keep both for compatibility
          location: location.trim(),
          updatedAt: new Date().toISOString()
        }
        
        await updateDoc(userRef, updateData)
        console.log("[ProfileScreen] Firebase update successful")

        // Update local state
        setUserProfile(prev => ({
          ...prev,
          ...updateData
        }))

        // Update AuthContext if updateUserProfile function exists
        if (updateUserProfile) {
          updateUserProfile(updateData)
        }

        setModalVisible(false)
        
        Alert.alert(
          "Success",
          "Profile updated successfully!",
          [{ text: "OK" }]
        )
      } else {
        throw new Error("User ID not found")
      }
    } catch (error) {
      console.error("[ProfileScreen] Error updating profile:", error)
      Alert.alert(
        "Update Failed",
        `Failed to update profile: ${error.message}`,
        [{ text: "OK" }]
      )
    } finally {
      setUpdating(false)
    }
  }

  const handleEditPress = () => {
    // Reset form with current user data
    const userData = userProfile || currentUser
    setFirstName(userData?.firstName || "")
    setLastName(userData?.lastName || "")
    setContactNumber(userData?.contactNumber || userData?.phone || "")
    setLocation(userData?.location || "")
    setModalVisible(true)
  }

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => signOut(),
        },
      ],
      { cancelable: true },
    )
  }

  if (isLoading || loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text>Loading profile...</Text>
      </View>
    )
  }

  const userData = userProfile || currentUser

  const stats = [
    { label: "Total Bids", value: "47", icon: "gavel", iconType: "material", color: "#2E6A2E" },
    { label: "Won Auctions", value: "12", icon: "award", iconType: "feather", color: "#2E6A2E" },
    { label: "Success Rate", value: "85%", icon: "trending-up", iconType: "feather", color: "#2E6A2E" },
  ]

  const menuItems = [
    { 
      id: 1, 
      title: "Personal Information", 
      subtitle: "Update your profile details", 
      icon: "user", 
      iconType: "feather", 
      onPress: handleEditPress 
    },
    { id: 2, title: "My Bids", subtitle: "View your bidding history", icon: "gavel", iconType: "material", onPress: () => navigation.navigate("Bidding") },
    { id: 3, title: "Won Items", subtitle: "Items you've successfully won", icon: "award", iconType: "feather", onPress: () => console.log("Navigate to Won Items") },
    { id: 4, title: "Watchlist", subtitle: "Items you're watching", icon: "heart", iconType: "feather", onPress: () => console.log("Navigate to Watchlist") },
    { id: 6, title: "Notifications", subtitle: "Manage notification preferences", icon: "bell", iconType: "feather", onPress: () => console.log("Navigate to Notifications") },
    { id: 7, title: "Help & Support", subtitle: "Get help and contact support", icon: "help-circle", iconType: "feather", onPress: () => console.log("Navigate to Help") },
  ]

  const renderIcon = (item) => {
    if (item.iconType === "material") {
      return <MaterialCommunityIcons name={item.icon} size={24} color="#666" />
    } else {
      return <Feather name={item.icon} size={24} color="#666" />
    }
  }

  const getDisplayName = () => {
    if (userData?.firstName && userData?.lastName) {
      return `${userData.firstName} ${userData.lastName}`
    }
    if (userData?.name) {
      return userData.name
    }
    return "User"
  }

  const getContactNumber = () => {
    return userData?.contactNumber || userData?.phone || ""
  }

  const getLocation = () => {
    return userData?.location || ""
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Feather name="log-out" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <Image
              source={{ uri: userData?.photoURL || "https://via.placeholder.com/100x100/CCCCCC/FFFFFF?text=Avatar" }}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{getDisplayName()}</Text>
              <Text style={styles.userEmail}>{userData?.email || "No email available"}</Text>
              
              {/* Contact Number */}
              {getContactNumber() ? (
                <Text style={styles.userDetail}>
                  📞 {getContactNumber()}
                </Text>
              ) : (
                <Text style={styles.userDetailEmpty}>No contact number set</Text>
              )}
              
              {/* Location */}
              {getLocation() ? (
                <Text style={styles.userDetail}>
                  📍 {getLocation()}
                </Text>
              ) : (
                <Text style={styles.userDetailEmpty}>No location set</Text>
              )}
              
              {/* Member Since */}
              {userData?.createdAt && (
                <Text style={styles.memberSince}>
                  Member since {new Date(userData.createdAt).toLocaleDateString()}
                </Text>
              )}
            </View>
            <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
              <Feather name="edit-2" size={16} color="#2E6A2E" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal for Editing Profile */}
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Personal Information</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your first name"
                  value={firstName}
                  onChangeText={setFirstName}
                  editable={!updating}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your last name"
                  value={lastName}
                  onChangeText={setLastName}
                  editable={!updating}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Contact Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your contact number"
                  value={contactNumber}
                  onChangeText={setContactNumber}
                  keyboardType="phone-pad"
                  editable={!updating}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your location"
                  value={location}
                  onChangeText={setLocation}
                  editable={!updating}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                  disabled={updating}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton, updating && styles.disabledButton]}
                  onPress={handleSave}
                  disabled={updating}
                >
                  <Text style={styles.saveButtonText}>
                    {updating ? "Updating..." : "Save Changes"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: stat.color }]}>
                  {stat.iconType === "material" ? (
                    <MaterialCommunityIcons name={stat.icon} size={20} color="white" />
                  ) : (
                    <Feather name={stat.icon} size={20} color="white" />
                  )}
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.onPress}>
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>{renderIcon(item)}</View>
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color="#888" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    backgroundColor: "#2E6A2E",
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "white" },
  logoutButton: { padding: 8 },
  scrollView: { flex: 1 },
  profileSection: { paddingHorizontal: 20, marginTop: 20 },
  profileCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatar: { width: 70, height: 70, borderRadius: 35, marginRight: 15 },
  profileInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: "bold", color: "#333", marginBottom: 4 },
  userEmail: { fontSize: 14, color: "#666", marginBottom: 4 },
  userDetail: { 
    fontSize: 12, 
    color: "#555", 
    marginBottom: 2,
    fontWeight: "500" 
  },
  userDetailEmpty: { 
    fontSize: 12, 
    color: "#999", 
    marginBottom: 2,
    fontStyle: "italic" 
  },
  memberSince: { fontSize: 12, color: "#888", marginTop: 4 },
  editButton: { padding: 8 },
  statsSection: { paddingHorizontal: 20, marginTop: 25 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#333", marginBottom: 15 },
  statsContainer: { flexDirection: "row", justifyContent: "space-between" },
  statCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statValue: { fontSize: 20, fontWeight: "bold", color: "#333", marginBottom: 4 },
  statLabel: { fontSize: 12, color: "#666", textAlign: "center" },
  menuSection: { paddingHorizontal: 20, marginTop: 25 },
  menuItem: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  menuText: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 2 },
  menuSubtitle: { fontSize: 14, color: "#666" },
  bottomPadding: { height: 100 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 25,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: "bold", 
    marginBottom: 20, 
    color: "#333",
    textAlign: "center"
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 15,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  saveButton: {
    backgroundColor: "#2E6A2E",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
})

