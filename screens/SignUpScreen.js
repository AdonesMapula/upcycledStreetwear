"use client"

import { useState, useCallback } from "react"
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView, // Import ScrollView
} from "react-native"
import Feather from "react-native-vector-icons/Feather"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { useAuth } from "../AuthContext" // Assuming AuthContext provides registerUser
import Text_SignUp from "../images/SignUp/Text-SignUp.png"

const { width } = Dimensions.get("window")

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // State for input focus
  const [isEmailFocused, setIsEmailFocused] = useState(false)
  const [isFirstNameFocused, setIsFirstNameFocused] = useState(false)
  const [isLastNameFocused, setIsLastNameFocused] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false)

  const { registerUser } = useAuth()

  const handleSignUp = useCallback(async () => {
    console.log("Sign Up pressed with:", { email, firstName, lastName, password, confirmPassword })
    if (!email || !firstName || !lastName || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match!")
      return
    }

    setIsLoading(true)
    
    try {
      const displayName = `${firstName} ${lastName}`
      const result = await registerUser(email, password, displayName)
      
      if (result.success) {
        Alert.alert("Success", "Account created successfully! You are now signed in.")
        // User will be automatically signed in after registration
      } else {
        setIsLoading(false)
        Alert.alert("Sign Up Failed", result.error || "Failed to create account. Please try again.")
      }
    } catch (error) {
      setIsLoading(false)
      console.error("Sign up error:", error)
      Alert.alert("Error", "An unexpected error occurred. Please try again.")
    }
  }, [email, firstName, lastName, password, confirmPassword, registerUser, navigation])

  return (
    <View style={styles.fullScreenBackground}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContentContainer}
          keyboardShouldPersistTaps="handled" // Allows taps on children without dismissing keyboard
          showsVerticalScrollIndicator={false} // Hide scroll indicator
        >
          {/* SIGN UP Text Image */}
          <View style={styles.textImageContainer}>
            <Image source={Text_SignUp} style={styles.signUpText} resizeMode="contain" />
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>
              Create a new account to get started. Fill in your details to join and access all features.
            </Text>
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email:</Text>
            <View style={[styles.inputContainer, isEmailFocused && styles.inputFocused]}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter Email"
                placeholderTextColor="#888"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
              />
            </View>
          </View>

          {/* First Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>First Name:</Text>
            <View style={[styles.inputContainer, isFirstNameFocused && styles.inputFocused]}>
              <MaterialCommunityIcons name="account-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter First Name"
                placeholderTextColor="#888"
                autoCapitalize="words"
                value={firstName}
                onChangeText={setFirstName}
                onFocus={() => setIsFirstNameFocused(true)}
                onBlur={() => setIsFirstNameFocused(false)}
              />
            </View>
          </View>

          {/* Last Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Last Name:</Text>
            <View style={[styles.inputContainer, isLastNameFocused && styles.inputFocused]}>
              <MaterialCommunityIcons name="account-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter Last Name"
                placeholderTextColor="#888"
                autoCapitalize="words"
                value={lastName}
                onChangeText={setLastName}
                onFocus={() => setIsLastNameFocused(true)}
                onBlur={() => setIsLastNameFocused(false)}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password:</Text>
            <View style={[styles.inputContainer, isPasswordFocused && styles.inputFocused]}>
              <MaterialCommunityIcons name="lock-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter Password"
                placeholderTextColor="#888"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.iconButton}
                activeOpacity={0.7}
              >
                <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#888" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Password:</Text>
            <View style={[styles.inputContainer, isConfirmPasswordFocused && styles.inputFocused]}>
              <MaterialCommunityIcons name="lock-check-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter Confirm Password"
                placeholderTextColor="#888"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setIsConfirmPasswordFocused(true)}
                onBlur={() => setIsConfirmPasswordFocused(false)}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.iconButton}
                activeOpacity={0.7}
              >
                <Feather name={showConfirmPassword ? "eye" : "eye-off"} size={20} color="#888" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Up Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.signUpButton, isLoading && styles.signUpButtonLoading]}
              onPress={handleSignUp}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <MaterialCommunityIcons name="loading" size={20} color="#fff" />
                  <Text style={styles.signUpButtonText}>Signing Up...</Text>
                </View>
              ) : (
                <>
                  <MaterialCommunityIcons name="account-plus-outline" size={18} color="#fff" />
                  <Text style={styles.signUpButtonText}>Sign Up</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("SignIn")} activeOpacity={0.7}>
              <Text style={styles.signInLink}>Sign In!</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  fullScreenBackground: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#FFFCF3", // Simple background color
    // Removed justifyContent and alignItems here, as ScrollView will handle centering
  },
  keyboardContainer: {
    flex: 1,
    width: "100%",
  },
  scrollContentContainer: {
    flexGrow: 1, // Allows content to grow and enable scrolling when needed
    justifyContent: "center", // Centers content vertically when there's enough space
    alignItems: "center", // Centers content horizontally
    paddingHorizontal: 20, // Add padding to ensure content isn't edge-to-edge
    paddingVertical: 30, // Add vertical padding for top/bottom spacing
  },
  textImageContainer: {
    marginBottom: 10,
  },
  signUpText: {
    width: width * 0.6,
    height: 60,
  },
  descriptionContainer: {
    marginBottom: 30,
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
  },
  signUpButton: {
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
  signUpButtonLoading: {
    backgroundColor: "#666",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingSpinner: {},
  signUpButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  signInContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  signInText: {
    fontSize: 14,
    color: "#4A4A4A",
  },
  signInLink: {
    fontSize: 14,
    color: "#2E6A2E",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
})
