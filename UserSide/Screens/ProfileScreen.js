import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Modal, TextInput, ActivityIndicator, Dimensions, Platform, SafeAreaView } from "react-native"
import Feather from "react-native-vector-icons/Feather"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { launchImageLibrary, launchCamera } from 'react-native-image-picker'
import { useAuth } from "../AuthContext"
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase/firebase'

const { width } = Dimensions.get('window')

export default function ProfileScreen({ navigation }) {
  const { currentUser, signOut, isLoading, updateUserProfile } = useAuth()
  const [modalVisible, setModalVisible] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imagePickerVisible, setImagePickerVisible] = useState(false)

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

  const uploadImageToFirebase = async (imageUri) => {
    try {
      console.log('Starting upload for:', imageUri);
      setUploadingImage(true)
      console.log('Storage object:', storage);
      
      // Create a reference to the storage location
      const imageRef = ref(storage, `profile-images/${currentUser.uid}/${Date.now()}.jpg`)
      
      // Convert image to blob
      const response = await fetch(imageUri)
      const blob = await response.blob()
      
      // Upload the image
      const snapshot = await uploadBytes(imageRef, blob)
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      return downloadURL
    } catch (error) {
      console.error("Error uploading image:", error)
      throw error
    } finally {
      setUploadingImage(false)
    }
  }

  const handleImagePicker = () => {
    console.log("Opening image picker modal")
    setImagePickerVisible(true)
  }

  const selectImageFromLibrary = () => {
    console.log("Selecting image from library")
    setImagePickerVisible(false)
    
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    }

    setTimeout(() => {
      launchImageLibrary(options, async (response) => {
        console.log('Image picker response:', response);
        
        if (response.didCancel) {
          console.log('User cancelled image picker');
          return
        }

        if (response.error) {
          console.log('ImagePicker Error: ', response.error);
          Alert.alert("Error", "Failed to select image. Please try again.")
          return
        }

        if (response.assets && response.assets[0]) {
          try {
            const imageUri = response.assets[0].uri
            console.log('Selected image URI:', imageUri)
            const downloadURL = await uploadImageToFirebase(imageUri)
            
            // Update user profile with new image URL
            if (currentUser?.uid) {
              const userRef = doc(db, 'users', currentUser.uid)
              await updateDoc(userRef, {
                photoURL: downloadURL,
                updatedAt: new Date().toISOString()
              })
              
              // Update local state
              setUserProfile(prev => ({
                ...prev,
                photoURL: downloadURL
              }))
              
              Alert.alert("Success", "Profile picture updated successfully!")
            }
          } catch (error) {
            console.error("Error updating profile picture:", error)
            Alert.alert("Error", "Failed to update profile picture. Please try again.")
          }
        }
      })
    }, 100)
  }

  const selectImageFromCamera = () => {
    console.log("Taking photo with camera")
    setImagePickerVisible(false)
    
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    }

    setTimeout(() => {
      launchCamera(options, async (response) => {
        console.log('Camera response:', response);
        
        if (response.didCancel) {
          console.log('User cancelled camera');
          return
        }

        if (response.error) {
          console.log('Camera Error: ', response.error);
          Alert.alert("Error", "Failed to take photo. Please try again.")
          return
        }

        if (response.assets && response.assets[0]) {
          try {
            const imageUri = response.assets[0].uri
            console.log('Captured image URI:', imageUri)
            const downloadURL = await uploadImageToFirebase(imageUri)
            
            // Update user profile with new image URL
            if (currentUser?.uid) {
              const userRef = doc(db, 'users', currentUser.uid)
              await updateDoc(userRef, {
                photoURL: downloadURL,
                updatedAt: new Date().toISOString()
              })
              
              // Update local state
              setUserProfile(prev => ({
                ...prev,
                photoURL: downloadURL
              }))
              
              Alert.alert("Success", "Profile picture updated successfully!")
            }
          } catch (error) {
            console.error("Error updating profile picture:", error)
            Alert.alert("Error", "Failed to update profile picture. Please try again.")
          }
        }
      })
    }, 100)
  }

  const closeImagePicker = () => {
    console.log("Closing image picker modal")
    setImagePickerVisible(false)
  }

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
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#2E6A2E" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
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
    { 
      id: 2, 
      title: "My Bids", 
      subtitle: "View your bidding history", 
      icon: "gavel", 
      iconType: "material", 
      onPress: () => navigation.navigate("Bidding") 
    },
    { 
      id: 3, 
      title: "Won Items", 
      subtitle: "Items you've successfully won", 
      icon: "award", 
      iconType: "feather", 
      onPress: () => console.log("Navigate to Won Items") 
    },
    { 
      id: 4, 
      title: "Watchlist", 
      subtitle: "Items you're watching", 
      icon: "heart", 
      iconType: "feather", 
      onPress: () => console.log("Navigate to Watchlist") 
    },
    { 
      id: 5, 
      title: "Notifications", 
      subtitle: "Manage notification preferences", 
      icon: "bell", 
      iconType: "feather", 
      onPress: () => console.log("Navigate to Notifications") 
    },
    { 
      id: 6, 
      title: "Help & Support", 
      subtitle: "Get help and contact support", 
      icon: "help-circle", 
      iconType: "feather", 
      onPress: () => console.log("Navigate to Help") 
    },
    { 
      id: 7, 
      title: "Logout", 
      subtitle: "Sign out of your account", 
      icon: "log-out", 
      iconType: "feather", 
      onPress: handleLogout,
      isLogout: true
    },
  ]

  const renderIcon = (item) => {
    const iconColor = item.isLogout ? "#E74C3C" : "#666"
    if (item.iconType === "material") {
      return <MaterialCommunityIcons name={item.icon} size={24} color={iconColor} />
    } else {
      return <Feather name={item.icon} size={24} color={iconColor} />
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ 
                  uri: userData?.photoURL || "https://via.placeholder.com/100x100/CCCCCC/FFFFFF?text=Avatar" 
                }}
                style={styles.avatar}
              />
              <TouchableOpacity 
                style={styles.cameraButton} 
                onPress={handleImagePicker}
                disabled={uploadingImage}
                activeOpacity={0.7}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Feather name="camera" size={16} color="white" />
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{getDisplayName()}</Text>
              <Text style={styles.userEmail}>{userData?.email || "No email available"}</Text>
              
              {/* Contact Number */}
              {getContactNumber() ? (
                <View style={styles.detailRow}>
                  <Feather name="phone" size={14} color="#2E6A2E" />
                  <Text style={styles.userDetail}>{getContactNumber()}</Text>
                </View>
              ) : (
                <Text style={styles.userDetailEmpty}>No contact number set</Text>
              )}
              
              {/* Location */}
              {getLocation() ? (
                <View style={styles.detailRow}>
                  <Feather name="map-pin" size={14} color="#2E6A2E" />
                  <Text style={styles.userDetail}>{getLocation()}</Text>
                </View>
              ) : (
                <Text style={styles.userDetailEmpty}>No location set</Text>
              )}
              
              {/* Member Since */}
              {userData?.createdAt && (
                <View style={styles.detailRow}>
                  <Feather name="calendar" size={14} color="#888" />
                  <Text style={styles.memberSince}>
                    Member since {new Date(userData.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
            
            <TouchableOpacity style={styles.editButton} onPress={handleEditPress} activeOpacity={0.7}>
              <Feather name="edit-2" size={18} color="#2E6A2E" />
            </TouchableOpacity>
          </View>
        </View>

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
            <TouchableOpacity key={item.id} style={[
              styles.menuItem,
              item.isLogout && styles.logoutMenuItem
            ]} onPress={item.onPress} activeOpacity={0.7}>
              <View style={styles.menuItemLeft}>
                <View style={[
                  styles.menuIcon,
                  item.isLogout && styles.logoutMenuIcon
                ]}>
                  {renderIcon(item)}
                </View>
                <View style={styles.menuText}>
                  <Text style={[
                    styles.menuTitle,
                    item.isLogout && styles.logoutMenuTitle
                  ]}>{item.title}</Text>
                  <Text style={[
                    styles.menuSubtitle,
                    item.isLogout && styles.logoutMenuSubtitle
                  ]}>{item.subtitle}</Text>
                </View>
              </View>
              <Feather 
                name="chevron-right" 
                size={20} 
                color={item.isLogout ? "#E74C3C" : "#888"} 
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Image Picker Modal */}
      <Modal 
        visible={imagePickerVisible} 
        animationType="slide" 
        transparent={true}
        onRequestClose={closeImagePicker}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={closeImagePicker}
        >
          <TouchableOpacity 
            style={styles.imagePickerModal}
            activeOpacity={1}
            onPress={() => {}} // Prevent modal from closing when touching inside
          >
            <Text style={styles.imagePickerTitle}>Choose Profile Picture</Text>
            
            <TouchableOpacity 
              style={styles.imagePickerOption} 
              onPress={selectImageFromCamera}
              activeOpacity={0.7}
            >
              <Feather name="camera" size={24} color="#2E6A2E" />
              <Text style={styles.imagePickerText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.imagePickerOption} 
              onPress={selectImageFromLibrary}
              activeOpacity={0.7}
            >
              <Feather name="image" size={24} color="#2E6A2E" />
              <Text style={styles.imagePickerText}>Choose from Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.imagePickerCancel} 
              onPress={closeImagePicker}
              activeOpacity={0.7}
            >
              <Text style={styles.imagePickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Profile Edit Modal */}
      <Modal 
        visible={modalVisible} 
        animationType="slide" 
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={() => {}} // Prevent modal from closing when touching inside
          >
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
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, updating && styles.disabledButton]}
                onPress={handleSave}
                disabled={updating}
                activeOpacity={0.7}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F8F9FA" 
  },
  header: {
    backgroundColor: "#2E6A2E",
    paddingTop: Platform.OS === 'ios' ? 10 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: "bold", 
    color: "white" 
  },
  scrollView: { 
    flex: 1 
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  profileSection: { 
    paddingHorizontal: 20, 
    marginTop: 20 
  },
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
  avatarContainer: {
    position: "relative",
    marginRight: 15,
  },
  avatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#2E6A2E",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2E6A2E",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  profileInfo: { 
    flex: 1 
  },
  userName: { 
    fontSize: 22, 
    fontWeight: "bold", 
    color: "#333", 
    marginBottom: 4 
  },
  userEmail: { 
    fontSize: 14, 
    color: "#666", 
    marginBottom: 8 
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  userDetail: { 
    fontSize: 13, 
    color: "#555", 
    marginLeft: 6,
    fontWeight: "500" 
  },
  userDetailEmpty: { 
    fontSize: 12, 
    color: "#999", 
    marginBottom: 2,
    fontStyle: "italic" 
  },
  memberSince: { 
    fontSize: 12, 
    color: "#888", 
    marginLeft: 6 
  },
  editButton: { 
    padding: 10,
    backgroundColor: "#f0f8f0",
    borderRadius: 10,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  // Image Picker Modal Styles
  imagePickerModal: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    width: width * 0.85,
    alignItems: "center",
    maxWidth: 400,
  },
  imagePickerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  imagePickerOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    width: "100%",
    marginBottom: 10,
  },
  imagePickerText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 15,
    fontWeight: "500",
  },
  imagePickerCancel: {
    marginTop: 10,
    padding: 15,
  },
  imagePickerCancelText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  statsSection: { 
    paddingHorizontal: 20, 
    marginTop: 25 
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#333", 
    marginBottom: 15 
  },
  statsContainer: { 
    flexDirection: "row", 
    justifyContent: "space-between" 
  },
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
  statValue: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#333", 
    marginBottom: 4 
  },
  statLabel: { 
    fontSize: 12, 
    color: "#666", 
    textAlign: "center" 
  },
  menuSection: { 
    paddingHorizontal: 20, 
    marginTop: 25 
  },
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
  logoutMenuItem: {
    borderWidth: 1,
    borderColor: "#FFE6E6",
    backgroundColor: "#FFF5F5",
  },
  menuItemLeft: { 
    flexDirection: "row", 
    alignItems: "center", 
    flex: 1 
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  logoutMenuIcon: {
    backgroundColor: "#FFE6E6",
  },
  menuText: { 
    flex: 1 
  },
  menuTitle: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#333", 
    marginBottom: 2 
  },
  logoutMenuTitle: {
    color: "#E74C3C",
  },
  menuSubtitle: { 
    fontSize: 14, 
    color: "#666" 
  },
  logoutMenuSubtitle: {
    color: "#E74C3C",
    opacity: 0.7,
  },
  bottomPadding: { 
    height: 100 
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
    maxWidth: 400,
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