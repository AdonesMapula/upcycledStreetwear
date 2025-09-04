import { useEffect, useState } from "react"
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

// Import your logo image and video
import USWLogo from "../assets/images/Welcome/USW-Logo.png"
const welcomeVideo = require("../assets/images/Welcome/USWvideo.mp4")

const { width, height } = Dimensions.get("window")

export default function WelcomeScreen({ navigation }) {
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0))
  const [slideUpAnim] = useState(new Animated.Value(50))
  const [logoScaleAnim] = useState(new Animated.Value(0.8))
  const [buttonScaleAnim] = useState(new Animated.Value(0.9))
  const [pulseAnim] = useState(new Animated.Value(1))
  const [textSlideAnim] = useState(new Animated.Value(30))

  // Using the new expo-video API
  const player = useVideoPlayer(welcomeVideo, (player) => {
    player.loop = true
    player.play()
    player.muted = true
  })

  useEffect(() => {
    // Sequential entrance animations
    const entranceAnimation = Animated.sequence([
      // Initial fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      // Logo animations
      Animated.spring(logoScaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
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
      ]),
    )

    setTimeout(() => pulseAnimation.start(), 3000)

    return () => {
      pulseAnimation.stop()
    }
  }, [])

  const handleStartBidding = () => {
    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      console.log("Start Bidding pressed")
      navigation.replace("Home")
    })
  }

  return (
    <View style={styles.fullScreenContainer}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background Video */}
      <VideoView
        style={styles.backgroundVideo}
        player={player}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
        contentFit="cover"
      />

      {/* Gradient Overlay */}
      <LinearGradient colors={["rgba(0, 0, 0, 0.45)", "rgba(0, 0, 0, 1)"]} style={styles.gradientOverlay}>
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          {/* Logo with animations */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ scale: logoScaleAnim }],
              },
            ]}
          >
            <View style={styles.logoGlow}>
              <Image source={USWLogo} style={styles.logo} resizeMode="contain" />
            </View>
          </Animated.View>

          {/* Content Area with slide animations */}
          <Animated.View style={[styles.contentArea, { transform: [{ translateY: slideUpAnim }] }]}>
            <Animated.View style={[styles.textContainer, { transform: [{ translateY: textSlideAnim }] }]}>
              <Text style={styles.descriptionText}>
                Fresh finds are waiting! Place your <Text style={styles.highlightText}>bids</Text>, grab the{" "}
                <Text style={styles.highlightText}>deals</Text>, and shop smart with style.
              </Text>
            </Animated.View>

            {/* Animated Start Bidding Button */}
            <Animated.View
              style={[styles.buttonContainer, { transform: [{ scale: buttonScaleAnim }, { scale: pulseAnim }] }]}
            >
              <TouchableOpacity style={styles.startButton} onPress={handleStartBidding} activeOpacity={0.9}>
                <LinearGradient colors={["#135918", "#1a7a1f", "#2E6A2E"]} style={styles.buttonGradient}>
                  <MaterialCommunityIcons name="gavel" size={20} color="#FFFCF3" />
                  <Text style={styles.startButtonText}>Start Bidding!</Text>
                  <MaterialCommunityIcons name="arrow-right" size={18} color="#a5eea8ff" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </LinearGradient>
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
})
