import React, { useState, useCallback, useMemo, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native"
import Feather from "react-native-vector-icons/Feather"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { useAuth } from "../AuthContext"
import { userService } from "../firebase/services"

export default function ProfileScreen({ navigation }) {
  const { signOut, user } = useAuth()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState([
    { label: "Total Bids", value: "0", icon: "gavel", iconType: "material", color: "#2E6A2E" },
    { label: "Won Auctions", value: "0", icon: "award", iconType: "feather", color: "#F5A623" },
    { label: "Success Rate", value: "0%", icon: "trending-up", iconType: "feather", color: "#4A90E2" },
  ])

  // Fetch user data from Firebase
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) {
        setLoading(false)
        return
      }

      try {
        const data = await userService.getUserProfile(user.uid)
        if (data) {
          setUserData(data)
          
          // Update stats with real data (placeholder for now)
          // In a real app, you'd fetch this from a separate stats collection
          setStats([
            { label: "Total Bids", value: data.totalBids?.toString() || "0", icon: "gavel", iconType: "material", color: "#2E6A2E" },
            { label: "Won Auctions", value: data.wonAuctions?.toString() || "0", icon: "award", iconType: "feather", color: "#F5A623" },
            { label: "Success Rate", value: data.successRate?.toString() || "0%", icon: "trending-up", iconType: "feather", color: "#4A90E2" },
          ])
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        Alert.alert("Error", "Failed to load profile data")
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user?.uid])

  const menuItems = [
    {
      id: 1,
      title: "My Bids",
      subtitle: "View your bidding history",
      icon: "gavel",
      iconType: "material",
      onPress: () => navigation.navigate("Bidding"),
    },
    {
      id: 2,
      title: "Won Items",
      subtitle: "Items you've successfully won",
      icon: "award",
      iconType: "feather",
      onPress: () => console.log("Navigate to Won Items"),
    },
    {
      id: 3,
      title: "Watchlist",
      subtitle: "Items you're watching",
      icon: "heart",
      iconType: "feather",
      onPress: () => console.log("Navigate to Watchlist"),
    },
    {
      id: 4,
      title: "Payment Methods",
      subtitle: "Manage your payment options",
      icon: "credit-card",
      iconType: "feather",
      onPress: () => console.log("Navigate to Payment Methods"),
    },
    {
      id: 5,
      title: "Notifications",
      subtitle: "Manage notification preferences",
      icon: "bell",
      iconType: "feather",
      onPress: () => console.log("Navigate to Notifications"),
    },
    {
      id: 6,
      title: "Help & Support",
      subtitle: "Get help and contact support",
      icon: "help-circle",
      iconType: "feather",
      onPress: () => console.log("Navigate to Help"),
    },
    {
      id: 7,
      title: "Settings",
      subtitle: "App preferences and account settings",
      icon: "settings",
      iconType: "feather",
      onPress: () => console.log("Navigate to Settings"),
    },
  ]

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            signOut()
            // Navigation will automatically redirect to AuthStack due to App.js logic
          },
        },
      ],
      { cancelable: true },
    )
  }

  const renderIcon = (iconName, iconType, size, color) => {
    if (iconType === "material") {
      return <MaterialCommunityIcons name={iconName} size={size} color={color} />
    } else {
      return <Feather name={iconName} size={size} color={color} />
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#2E6A2E" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    )
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Please sign in to view your profile</Text>
        <TouchableOpacity style={styles.signInButton} onPress={() => navigation.navigate("SignIn")}>
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: userData?.photoURL || "https://via.placeholder.com/100x100/CCCCCC/FFFFFF?text=Avatar" }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.editAvatarButton}>
            <Feather name="camera" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userData?.displayName || user?.displayName || "User"}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Text style={styles.memberSince}>
            Member since {userData?.createdAt ? new Date(userData.createdAt.toDate()).toLocaleDateString() : "Recently"}
          </Text>
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Your Activity</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + "20" }]}>
                {renderIcon(stat.icon, stat.iconType, 24, stat.color)}
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>Account</Text>
        {menuItems.map((item) => (
          <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.onPress}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuItemIcon}>
                {renderIcon(item.icon, item.iconType, 20, "#666")}
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Feather name="log-out" size={20} color="#D0021B" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
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
    fontSize: 16,
    color: "#666",
  },
  signInButton: {
    marginTop: 20,
    backgroundColor: "#2E6A2E",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  signInButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  profileHeader: {
    backgroundColor: "#2E6A2E",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 15,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  editAvatarButton: {
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
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "white",
    marginBottom: 2,
  },
  memberSince: {
    fontSize: 14,
    color: "white",
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
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
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  menuContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
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
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "#FFE6E6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "600",
    color: "#D0021B",
  },
})

