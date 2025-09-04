"use client"

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import Feather from "react-native-vector-icons/Feather"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"

import { useAuth } from "..//AuthContext"

const { width, height } = Dimensions.get("window")

export default function HomeScreen({ navigation }) {
  
  const { currentUser, isLoading } = useAuth()
  const user = currentUser || null

  
  console.log("[v0] HomeScreen - User data:", user)

  const getUserFirstName = () => {
    if (!user) {
      console.log("[v0] No user data available")
      return "User"
    }

    if (user.firstName) {
      return user.firstName
    }

    if (user.name) {
      return user.name.split(" ")[0]
    }

    if (user.email) {
      return user.email.split("@")[0]
    }

    return "User"
  }

  if (isLoading) {
  return (
    <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
      <Text>Loading...</Text>
    </View>
  )
}


  const featuredItems = [
    {
      id: 1,
      title: "Vintage Watch",
      currentBid: "$250",
      timeLeft: "2h 30m",
      image: "https://via.placeholder.com/150x150/CCCCCC/FFFFFF?text=Category",
    },
    {
      id: 2,
      title: "Designer Bag",
      currentBid: "$180",
      timeLeft: "1h 45m",
      image: "https://via.placeholder.com/150x150/CCCCCC/FFFFFF?text=Category",
    },
    {
      id: 3,
      title: "Art Piece",
      currentBid: "$320",
      timeLeft: "3h 15m",
      image: "https://via.placeholder.com/150x150/CCCCCC/FFFFFF?text=Category",
    },
  ]

  const categories = [
    { id: 1, name: "Electronics", icon: "smartphone", color: "#4A90E2" },
    { id: 2, name: "Fashion", icon: "shopping-bag", color: "#F5A623" },
    { id: 3, name: "Home", icon: "home", color: "#7ED321" },
    { id: 4, name: "Art", icon: "image", color: "#D0021B" },
  ]

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <LinearGradient colors={["#2E6A2E", "#4A8F4A"]} style={styles.headerSection}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>Welcome {getUserFirstName()}!</Text>
          <Text style={styles.headerSubtext}>Discover amazing deals and place your bids</Text>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Feather name="search" size={20} color="#888" style={styles.searchIcon} />
            <Text style={styles.searchPlaceholder}>Search for items...</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="gavel" size={24} color="#2E6A2E" />
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Active Bids</Text>
        </View>
        <View style={styles.statCard}>
          <Feather name="clock" size={24} color="#F5A623" />
          <Text style={styles.statNumber}>5</Text>
          <Text style={styles.statLabel}>Ending Soon</Text>
        </View>
        <View style={styles.statCard}>
          <Feather name="award" size={24} color="#D0021B" />
          <Text style={styles.statNumber}>8</Text>
          <Text style={styles.statLabel}>Won Items</Text>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Browse Categories</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryCard, { borderColor: category.color }]}
              onPress={() => navigation.navigate("Category", { categoryId: category.id })}
            >
              <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                <Feather name={category.icon} size={24} color="white" />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Featured Items */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Auctions</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Featured")}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredScroll}>
          {featuredItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.featuredCard}
              onPress={() => navigation.navigate("Item", { itemId: item.id })}
            >
              <Image source={{ uri: item.image }} style={styles.featuredImage} />
              <View style={styles.featuredContent}>
                <Text style={styles.featuredTitle}>{item.title}</Text>
                <Text style={styles.currentBid}>Current Bid: {item.currentBid}</Text>
                <View style={styles.timeContainer}>
                  <Feather name="clock" size={14} color="#F5A623" />
                  <Text style={styles.timeLeft}>{item.timeLeft} left</Text>
                </View>
                <TouchableOpacity
                  style={styles.bidButton}
                  onPress={() => navigation.navigate("Bid", { itemId: item.id })}
                >
                  <Text style={styles.bidButtonText}>Place Bid</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityContainer}>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Feather name="trending-up" size={16} color="#2E6A2E" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>You placed a bid on "Vintage Camera"</Text>
              <Text style={styles.activityTime}>2 hours ago</Text>
            </View>
          </View>

          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Feather name="award" size={16} color="#D0021B" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>You won "Designer Sunglasses"</Text>
              <Text style={styles.activityTime}>1 day ago</Text>
            </View>
          </View>
        </View>
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
  searchPlaceholder: {
    flex: 1,
    color: "#888",
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: -15,
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: 15,
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
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
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
  seeAllText: {
    fontSize: 14,
    color: "#2E6A2E",
    fontWeight: "600",
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    width: "48%",
    marginBottom: 15,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  featuredScroll: {
    marginTop: 10,
  },
  featuredCard: {
    backgroundColor: "white",
    borderRadius: 15,
    marginRight: 15,
    width: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredImage: {
    width: "100%",
    height: 120,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  featuredContent: {
    padding: 15,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  currentBid: {
    fontSize: 14,
    color: "#2E6A2E",
    fontWeight: "600",
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  timeLeft: {
    fontSize: 12,
    color: "#F5A623",
    marginLeft: 5,
    fontWeight: "500",
  },
  bidButton: {
    backgroundColor: "#2E6A2E",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  bidButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  activityContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  activityTime: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  bottomPadding: {
    height: 50, // Space for bottom navigation
  },
})
