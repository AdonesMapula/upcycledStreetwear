
import React, { useCallback, useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"

const { width } = Dimensions.get("window")

// Memoized tab configuration
const tabs = [
  { name: "Home", icon: "home", route: "Home" },
  { name: "News", icon: "newspaper", route: "News" },
  { name: "Bidding", icon: "gavel", route: "Bidding" },
  { name: "Cart", icon: "cart", route: "Cart" },
  { name: "Profile", icon: "account", route: "Profile" },
]

function NavBarLayout({ children }) {
  const navigation = useNavigation()
  const route = useRoute()
  const [isNavigating, setIsNavigating] = useState(false)

  // Optimized navigation function
  const navigateTo = useCallback(
    (screenName) => {
      if (route.name === screenName || isNavigating) return

      setIsNavigating(true)

      try {
        navigation.replace(screenName)
      } catch (error) {
        console.warn("Navigation error:", error)
      } finally {
        setTimeout(() => setIsNavigating(false), 100)
      }
    },
    [navigation, route.name, isNavigating],
  )

  return (
    <View style={styles.container}>
      {/* Main Content Area */}
      <View style={styles.content}>{children}</View>

      {/* Fixed Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        {/* Removed the global indicator */}
        {/* <View style={[styles.indicator, { left: indicatorPosition }]} /> */}

        <View style={styles.bottomNav}>
          {tabs.map((tab) => {
            const isActive = route.name === tab.route
            return (
              <TouchableOpacity
                key={tab.name}
                style={styles.tabButton}
                onPress={() => navigateTo(tab.route)}
                activeOpacity={0.7}
                disabled={isNavigating}
              >
                <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
                  <MaterialCommunityIcons name={tab.icon} size={22} color={isActive ? "#2E6A2E" : "#888"} />
                </View>
                <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>{tab.name}</Text>
                {/* NEW: Indicator below the text */}
                {isActive && <View style={styles.activeTextBottomIndicator} />}
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Loading overlay */}
        {isNavigating && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#2E6A2E" />
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  content: {
    flex: 1,
    paddingBottom: 0,
  },
  bottomNavContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 15,
  },
  // Removed the global indicator style
  // indicator: { ... },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    position: "relative", // Needed for absolute positioning of the new indicator
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    backgroundColor: "transparent",
  },
  activeIconContainer: {
    backgroundColor: "rgba(46, 106, 46, 0.1)",
  },
  tabLabel: {
    fontSize: 11,
    color: "#888",
    fontWeight: "500",
    textAlign: "center",
  },
  activeTabLabel: {
    color: "#2E6A2E",
    fontWeight: "700",
  },
  // NEW STYLE for the indicator below the text
  activeTextBottomIndicator: {
    position: "absolute",
    bottom: 0, // Position at the very bottom of the tabButton
    width: "100%", // Adjust width as needed, or make it dynamic based on text width
    height: 2,
    backgroundColor: "#2E6A2E",
    borderRadius: 2,

  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
})

export default React.memo(NavBarLayout)
