// Removed "use client"
import "react-native-gesture-handler" // Must be at the top
import React from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { AuthProvider, useAuth } from "./AuthContext"
import { View, ActivityIndicator, StyleSheet, Text, Animated } from "react-native"
import { enableScreens } from "react-native-screens"

// Import Firebase config to ensure it's initialized
import './firebase/config'

// Enable react-native-screens for better performance
enableScreens()

// Disable all navigation animations globally
const disableAnimations = {
  animationEnabled: false,
  gestureEnabled: false,
  transitionSpec: {
    open: { animation: "timing", config: { duration: 1000 } },
    close: { animation: "timing", config: { duration: 1000 } },
  },
  cardStyleInterpolator: () => ({}),
}

// Import your screen components
import SignInScreen from "./screens/SignInScreen"
import SignUpScreen from "./screens/SignUpScreen"
import WelcomeScreen from "./screens/WelcomeScreen"
import HomeScreen from "./screens/HomeScreen"
import NewsScreen from "./screens/NewsScreen"
import BiddingScreen from "./screens/BiddingScreen"
import ProfileScreen from "./screens/ProfileScreen"
import CartScreen from "./screens/CartScreen" // Import CartScreen
import ProductDetailScreen from "./screens/ProductDetailScreen" // Import ProductDetailScreen

// Import your NavBarLayout
import NavBarLayout from "./Layout/NavbarLayout"
import ErrorBoundary from "./components/ErrorBoundary"

const Stack = createStackNavigator()

// Enhanced Loading Component
const LoadingScreen = ({ message = "Loading..." }) => {
  const [fadeAnim] = React.useState(new Animated.Value(0))

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: true,
    }).start()
  }, [fadeAnim])

  return (
    <View style={styles.loadingContainer}>
      <Animated.View style={[styles.loadingContent, { opacity: fadeAnim }]}>
        <ActivityIndicator size="large" color="#2E6A2E" />
        <Text style={styles.loadingText}>{message}</Text>
      </Animated.View>
    </View>
  )
}

// --- Authentication Stack ---
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        ...disableAnimations,
        cardStyle: { backgroundColor: "transparent" },
      }}
      initialRouteName="SignIn"
    >
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  )
}

// --- Main App Stack ---
function MainAppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        ...disableAnimations,
        cardStyle: { backgroundColor: "transparent" },
      }}
      initialRouteName="Home"
    >
      {/* Welcome screen is the first screen after login */}
      <Stack.Screen name="Welcome" component={WelcomeScreen} />

      {/* Screens that use the NavBarLayout */}
      <Stack.Screen name="Home">
        {(props) => (
          <NavBarLayout>
            <HomeScreen {...props} />
          </NavBarLayout>
        )}
      </Stack.Screen>

      <Stack.Screen name="News">
        {(props) => (
          <NavBarLayout>
            <NewsScreen {...props} />
          </NavBarLayout>
        )}
      </Stack.Screen>

      <Stack.Screen name="Bidding">
        {(props) => (
          <NavBarLayout>
            <BiddingScreen {...props} />
          </NavBarLayout>
        )}
      </Stack.Screen>

      <Stack.Screen name="Cart">
        {/* Removed the extra space here */}
        {(props) => (
          <NavBarLayout>
            <CartScreen {...props} />
          </NavBarLayout>
        )}
      </Stack.Screen>

      <Stack.Screen name="Profile">
        {(props) => (
          <NavBarLayout>
            <ProfileScreen {...props} />
          </NavBarLayout>
        )}
      </Stack.Screen>

      {/* Account Screen */}
      <Stack.Screen name="Account">
        {(props) => (
          <NavBarLayout>
            <View style={styles.accountScreen}>
              <Text style={styles.accountText}>My Account Details</Text>
            </View>
          </NavBarLayout>
        )}
      </Stack.Screen>

      {/* Product Detail Screen */}
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </Stack.Navigator>
  )
}

// --- Root Navigator ---
function RootNavigator() {
  const { isLoggedIn, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen message="Checking authentication..." />
  }

  return (
    <NavigationContainer
      theme={{
        colors: {
          background: "#F8F9FA",
        },
      }}
    >
      {isLoggedIn ? <MainAppStack /> : <AuthStack />}
    </NavigationContainer>
  )
}

// --- Main App Component ---
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ErrorBoundary>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFCF3",
  },
  loadingContent: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#2E6A2E",
    fontWeight: "600",
    textAlign: "center",
  },
  accountScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  accountText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E6A2E",
  },
})
