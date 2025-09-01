"use client"

import { useState, useCallback, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  ImageBackground,
  Alert,
  Animated, // Re-import Animated
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native"
import Feather from "react-native-vector-icons/Feather"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { useAuth } from "../AuthContext"

// Import your images
import Background_SignIn from "../images/SignIn/Bg-SignIn.png"
import Text_SignIn from "../images/SignIn/Text-SignIn.png"

const { width, height } = Dimensions.get("window")

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isEmailFocused, setIsEmailFocused] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Animation values - RESTORED
  const [fadeAnim] = useState(new Animated.Value(0))
  const [slideUpAnim] = useState(new Animated.Value(50))
  const [scaleAnim] = useState(new Animated.Value(0.9))
  const [textImageScale] = useState(new Animated.Value(0.8))
  const [shakeAnim] = useState(new Animated.Value(0))
  const [buttonPulse] = useState(new Animated.Value(1))

  const { signIn } = useAuth()

  useEffect(() => {
    StatusBar.setBarStyle("light-content", true)

    // Entry animations sequence - RESTORED
    const entranceAnimation = Animated.sequence([
      // Fade in background
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Scale and slide animations
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideUpAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(textImageScale, {
          toValue: 1,
          tension: 120,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
    ])

    entranceAnimation.start()

    // Continuous button pulse when ready - RESTORED
    setTimeout(() => {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(buttonPulse, {
            toValue: 1.02,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(buttonPulse, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      )
      pulseAnimation.start()
    }, 2000)
  }, []) // Dependencies for useEffect

  const handleSignIn = useCallback(async () => {
    console.log("Sign In pressed with:", { email, password })

    if (!email || !password) {
      // Shake animation for empty fields - RESTORED
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start()
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    setIsLoading(true)

    try {
      const result = await signIn(email, password)
      if (!result.success) {
        setIsLoading(false)
        // Shake animation for invalid credentials - RESTORED
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 15, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -15, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 15, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start()
        Alert.alert("Login Failed", result.error || "Invalid email or password. Please try again.")
      }
    } catch (error) {
      setIsLoading(false)
      console.error("Sign in error:", error)
      Alert.alert("Error", "An unexpected error occurred. Please try again.")
    }
  }, [email, password, signIn]) // Dependencies for useCallback

  const handleSignUp = useCallback(() => {
    console.log("Sign Up pressed")
    navigation.navigate("SignUp")
  }, [navigation]) // Dependencies for useCallback

  const handleInputFocus = (isFocused) => {
    // Simplified, no inputType needed
    // Subtle scale animation on input focus - RESTORED
    // This animation is applied directly to the inputContainer's style
    // The Animated.Value for inputAnim is not stored in state, it's created on demand.
    // This is a common pattern for transient animations.
    const inputAnim = new Animated.Value(1)
    if (isFocused) {
      Animated.spring(inputAnim, {
        toValue: 1.02,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.spring(inputAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }).start()
    }
  }

  return (
    <ImageBackground source={Background_SignIn} style={styles.fullScreenBackground} resizeMode="cover">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardContainer}>
        <Animated.View
          style={[
            styles.contentArea,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY: slideUpAnim }, { translateX: shakeAnim }],
            },
          ]}
        >
          {/* Floating background elements - REMOVED */}
          {/* The section with random MaterialCommunityIcons is removed for a cleaner UI */}

          {/* SIGN IN Text Image with animation */}
          <Animated.View
            style={[
              styles.textImageContainer,
              {
                transform: [{ scale: textImageScale }],
              },
            ]}
          >
            <Image source={Text_SignIn} style={styles.signInText} resizeMode="contain" />
          </Animated.View>

          <Animated.View
            style={[
              styles.descriptionContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            <Text style={styles.descriptionText}>
              Log in with your email and password to continue where you left off.
            </Text>
          </Animated.View>

          {/* Email Input with animation */}
          <Animated.View
            style={[
              styles.inputGroup,
              {
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            <Text style={styles.inputLabel}>Email:</Text>
            <Animated.View style={[styles.inputContainer, isEmailFocused && styles.inputFocused]}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter Email"
                placeholderTextColor="#888"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => {
                  setIsEmailFocused(true)
                  handleInputFocus(true) // Simplified call
                }}
                onBlur={() => {
                  setIsEmailFocused(false)
                  handleInputFocus(false) // Simplified call
                }}
              />
            </Animated.View>
          </Animated.View>

          {/* Password Input with animation */}
          <Animated.View
            style={[
              styles.inputGroup,
              {
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            <Text style={styles.inputLabel}>Password:</Text>
            <Animated.View style={[styles.inputContainer, isPasswordFocused && styles.inputFocused]}>
              <MaterialCommunityIcons name="lock-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter Password"
                placeholderTextColor="#888"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                onFocus={() => {
                  setIsPasswordFocused(true)
                  handleInputFocus(true) // Simplified call
                }}
                onBlur={() => {
                  setIsPasswordFocused(false)
                  handleInputFocus(false) // Simplified call
                }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.iconButton}
                activeOpacity={0.7}
              >
                <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#888" />
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* Sign In Button with animations */}
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                transform: [{ scale: buttonPulse }, { translateY: slideUpAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.signInButton, isLoading && styles.signInButtonLoading]}
              onPress={handleSignIn}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Animated.View // Animated for spinner rotation
                    style={[
                      styles.loadingSpinner,
                      {
                        transform: [
                          {
                            rotate: fadeAnim.interpolate({
                              // Using fadeAnim for rotation, can be a dedicated anim
                              inputRange: [0, 1],
                              outputRange: ["0deg", "360deg"],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <MaterialCommunityIcons name="loading" size={20} color="#fff" />
                  </Animated.View>
                  <Text style={styles.signInButtonText}>Signing In...</Text>
                </View>
              ) : (
                <>
                  <MaterialCommunityIcons name="login" size={18} color="#fff" />
                  <Text style={styles.signInButtonText}>Sign In</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Sign Up Link with animation */}
          <Animated.View
            style={[
              styles.signUpContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleSignUp} activeOpacity={0.7}>
              <Text style={styles.signUpLink}>Sign Up!</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  fullScreenBackground: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#F5F5DC",
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  contentArea: {
    paddingHorizontal: 20,
    alignItems: "center",
    backgroundColor: "#FFFCF3",
    borderRadius: 30,
    paddingVertical: 30,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 15,
  },
  floatingElements: {
    // This style block is kept for reference but the JSX for floating elements is removed
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 0,
    overflow: "hidden",
  },
  floatingElement: {
    position: "absolute",
  },
  textImageContainer: {
    marginBottom: 10,
    zIndex: 1,
  },
  signInText: {
    width: width * 0.6,
    height: 60,
  },
  descriptionContainer: {
    marginBottom: 30,
    zIndex: 1,
  },
  descriptionText: {
    fontSize: 16,
    color: "#4A4A4A",
    textAlign: "center",
    paddingHorizontal: 20,
    fontWeight: "normal",
  },
  inputGroup: {
    width: "100%",
    marginBottom: 20,
    zIndex: 1,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E6A2E",
    marginBottom: 8,
    alignSelf: "flex-start",
    marginLeft: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#B0B0B0",
    paddingHorizontal: 15,
    height: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputFocused: {
    borderColor: "#2E6A2E",
    borderWidth: 2,
    shadowColor: "#2E6A2E",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  inputIcon: {
    marginRight: 10,
  },
  iconButton: {
    paddingLeft: 10,
    paddingVertical: 5,
  },
  buttonContainer: {
    width: "100%",
    marginTop: 10,
    marginBottom: 20,
    zIndex: 1,
  },
  signInButton: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: "#2E6A2E",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2E6A2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
  },
  signInButtonLoading: {
    backgroundColor: "#666",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingSpinner: {
    // Animation handled by transform
  },
  signInButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  signUpContainer: {
    flexDirection: "row",
    marginTop: 10,
    zIndex: 1,
  },
  signUpText: {
    fontSize: 14,
    color: "#4A4A4A",
  },
  signUpLink: {
    fontSize: 14,
    color: "#2E6A2E",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
})
