import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Platform,
  StatusBar,
  Animated,
} from "react-native"
import { VideoView, useVideoPlayer } from "expo-video"
import { LinearGradient } from "expo-linear-gradient"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { useAuth } from "../AuthContext"
import { productService } from "../firebase/services"

// Import your logo image and video
import USWLogo from "../images/Welcome/USW-Logo.png"
const welcomeVideo = require("../images/Welcome/USWvideo.mp4")

const { width, height } = Dimensions.get("window")

export default function WelcomeScreen({ navigation }) {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeAuctions: 0,
    totalUsers: 0,
  })
  const [loading, setLoading] = useState(false)

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0))
  const [slideUpAnim] = useState(new Animated.Value(50))
  const [logoScaleAnim] = useState(new Animated.Value(0.8))
  const [logoRotateAnim] = useState(new Animated.Value(0))
  const [buttonScaleAnim] = useState(new Animated.Value(0.9))
  const [pulseAnim] = useState(new Animated.Value(1))
  const [textSlideAnim] = useState(new Animated.Value(30))

  // Using the new expo-video API
  const player = useVideoPlayer(welcomeVideo, (player) => {
    player.loop = true
    player.play()
    player.muted = true
  })

  // Fetch app stats from Firebase
  const fetchStats = async () => {
    try {
      setLoading(true)
      const products = await productService.getAllProducts()
      
      setStats({
        totalProducts: products.length,
        activeAuctions: products.filter(p => p.status === "available").length,
        totalUsers: Math.floor(Math.random() * 1000) + 500, // Mock user count
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
      // Fallback to default stats
      setStats({
        totalProducts: 150,
        activeAuctions: 25,
        totalUsers: 750,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Fetch stats when component mounts
    fetchStats()

    // Sequential entrance animations
    const entranceAnimation = Animated.sequence([
      // Initial fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      // Logo animations
      Animated.parallel([
        Animated.spring(logoScaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotateAnim, {
          toValue: 360,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
      // Content slide up
      Animated.parallel([
        Animated.timing(slideUpAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(textSlideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(buttonScaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
    ])

    entranceAnimation.start()

    // Continuous pulse animation for button
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    )

    pulseAnimation.start()

    return () => {
      pulseAnimation.stop()
    }
  }, [])

  const handleGetStarted = () => {
    // Navigate to the main app
    navigation.navigate("MainApp")
  }

  const handleSignIn = () => {
    // Navigate to sign in screen
    navigation.navigate("SignIn")
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E6A2E" />
      
      {/* Background Video */}
      <View style={styles.videoContainer}>
        <VideoView style={styles.video} player={player} />
        <View style={styles.videoOverlay} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Logo Section */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: logoScaleAnim },
                { rotate: logoRotateAnim.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg'],
                })},
              ],
            },
          ]}
        >
          <Image source={USWLogo} style={styles.logo} />
        </Animated.View>

        {/* Welcome Text */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: textSlideAnim }],
            },
          ]}
        >
          <Text style={styles.welcomeTitle}>Welcome to USW</Text>
          <Text style={styles.welcomeSubtitle}>
            Discover unique upcycled streetwear and sustainable fashion
          </Text>
        </Animated.View>

        {/* Stats Section */}
        <Animated.View
          style={[
            styles.statsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="tshirt-crew" size={24} color="#2E6A2E" />
              <Text style={styles.statNumber}>{stats.totalProducts}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="gavel" size={24} color="#F5A623" />
              <Text style={styles.statNumber}>{stats.activeAuctions}</Text>
              <Text style={styles.statLabel}>Live Auctions</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="account-group" size={24} color="#4A90E2" />
              <Text style={styles.statNumber}>{stats.totalUsers}</Text>
              <Text style={styles.statLabel}>Users</Text>
            </View>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: buttonScaleAnim }],
            },
          ]}
        >
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
              <LinearGradient
                colors={["#2E6A2E", "#1E4A1E"]}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.getStartedButtonText}>Get Started</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
            <Text style={styles.signInButtonText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  backgroundVideo: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: width,
    height: height,
  },
  floatingElementsContainer: {
    position: "absolute",
    width: width,
    height: height,
    zIndex: 1,
  },
  floatingElement: {
    position: "absolute",
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 20 : 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: height * 0.05,
  },

  logo: {
    width: width * 0.5,
    height: width * 0.5,
  },
  contentArea: {
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  textContainer: {
    width: "100%",
    marginBottom: 40,
  },
  descriptionText: {
    fontSize: 24,
    color: "#FFFCF3",
    textAlign: "left",
    lineHeight: 32,
    fontWeight: "400",
    marginLeft: 20,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  highlightText: {
    color: "#a5eea8ff",
    fontWeight: "bold",
  },
  buttonContainer: {
    width: "90%",
  },
  startButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#135918",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 8,
  },
  startButtonText: {
    color: "#FFFCF3",
    fontSize: 18,
    fontWeight: "bold",
  },
  videoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: width,
    height: height,
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: width,
    height: height,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFCF3',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  welcomeSubtitle: {
    fontSize: 20,
    color: '#FFFCF3',
    textAlign: 'center',
    marginBottom: 30,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  statsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  statCard: {
    backgroundColor: '#FFFCF3',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E6A2E',
    marginTop: 8,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  getStartedButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#135918',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 8,
  },
  getStartedButtonText: {
    color: '#FFFCF3',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signInButton: {
    marginTop: 15,
  },
  signInButtonText: {
    color: '#FFFCF3',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
})