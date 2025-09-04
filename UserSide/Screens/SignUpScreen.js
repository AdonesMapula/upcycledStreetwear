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
  ScrollView,
} from "react-native"
import Feather from "react-native-vector-icons/Feather"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { useAuth } from "../AuthContext"
import Text_SignUp from "../assets/images/SignUp/Text-SignUp.png"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "../firebase/firebase"

const { width } = Dimensions.get("window")

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // State for input focus
  const [isEmailFocused, setIsEmailFocused] = useState(false)
  const [isFirstNameFocused, setIsFirstNameFocused] = useState(false)
  const [isLastNameFocused, setIsLastNameFocused] = useState(false)
  const [isPhoneFocused, setIsPhoneFocused] = useState(false)
  const [isAddressFocused, setIsAddressFocused] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false)

  const { registerUser } = useAuth()

  // Helper function to capitalize first letter of each word
  const capitalizeWords = (text) => {
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  // Helper function to format Philippine phone number
  const formatPhoneNumber = (text) => {
    // Remove all non-numeric characters
    const numbers = text.replace(/\D/g, '')
    
    // Limit to 11 digits for Philippine numbers
    const limited = numbers.slice(0, 11)
    
    // Format as 09XX-XXX-XXXX for better readability
    if (limited.length <= 4) {
      return limited
    } else if (limited.length <= 7) {
      return `${limited.slice(0, 4)}-${limited.slice(4)}`
    } else {
      return `${limited.slice(0, 4)}-${limited.slice(4, 7)}-${limited.slice(7)}`
    }
  }

  // Validate Philippine phone number
  const isValidPhoneNumber = (phone) => {
    const numbers = phone.replace(/\D/g, '')
    // Philippine mobile numbers start with 09 and have 11 digits total
    return numbers.length === 11 && numbers.startsWith('09')
  }

  const handleFirstNameChange = (text) => {
    setFirstName(capitalizeWords(text))
  }

  const handleLastNameChange = (text) => {
    setLastName(capitalizeWords(text))
  }

  const handlePhoneChange = (text) => {
    const formatted = formatPhoneNumber(text)
    setPhone(formatted)
  }

  const handleSignUp = useCallback(async () => {
    console.log("Sign Up pressed with:", { email, firstName, lastName, phone, address, password, confirmPassword })

    if (!email || !firstName || !lastName || !phone || !address || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address")
      return
    }

    // Validate Philippine phone number
    if (!isValidPhoneNumber(phone)) {
      Alert.alert("Error", "Please enter a valid Philippine mobile number (11 digits starting with 09)")
      return
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long")
      return
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match!")
      return
    }

    setIsLoading(true)

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Save additional user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: `${firstName} ${lastName}`,
        email,
        firstName,
        lastName,
        phone: phone.replace(/\D/g, ''), // Store phone without formatting
        address,
        joinDate: new Date().toISOString().split("T")[0],
        status: "new",
        totalOrders: 0,
        totalSpent: 0,
        lastOrder: "Never",
        preferences: [],
      })

      Alert.alert("Success", "Account created successfully! Please sign in.")
      navigation.navigate("SignIn")
    } catch (error) {
      console.error("Error creating account:", error)
      let errorMessage = "Failed to create account. Please try again."
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered."
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email format."
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters."
      }
      Alert.alert("Sign Up Failed", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [email, firstName, lastName, phone, address, password, confirmPassword, navigation])

  return (
    <View style={styles.fullScreenBackground}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
                autoCorrect={false}
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
                autoCorrect={false}
                value={firstName}
                onChangeText={handleFirstNameChange}
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
                autoCorrect={false}
                value={lastName}
                onChangeText={handleLastNameChange}
                onFocus={() => setIsLastNameFocused(true)}
                onBlur={() => setIsLastNameFocused(false)}
              />
            </View>
          </View>

          {/* Phone Number Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Phone Number: 
              <Text style={styles.phoneHint}> (11 digits, starts with 09)</Text>
            </Text>
            <View style={[
              styles.inputContainer, 
              isPhoneFocused && styles.inputFocused,
              phone && !isValidPhoneNumber(phone) && styles.inputError
            ]}>
              <MaterialCommunityIcons name="phone-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="09XX-XXX-XXXX"
                placeholderTextColor="#888"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={handlePhoneChange}
                onFocus={() => setIsPhoneFocused(true)}
                onBlur={() => setIsPhoneFocused(false)}
                maxLength={13} // 11 digits + 2 dashes
              />
              {phone && isValidPhoneNumber(phone) && (
                <MaterialCommunityIcons name="check-circle" size={20} color="#2E6A2E" />
              )}
            </View>
            {phone && !isValidPhoneNumber(phone) && (
              <Text style={styles.errorText}>Please enter a valid Philippine mobile number</Text>
            )}
          </View>

          {/* Address Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address:</Text>
            <View style={[styles.inputContainer, isAddressFocused && styles.inputFocused]}>
              <MaterialCommunityIcons name="map-marker-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter Complete Address"
                placeholderTextColor="#888"
                autoCapitalize="words"
                value={address}
                onChangeText={setAddress}
                onFocus={() => setIsAddressFocused(true)}
                onBlur={() => setIsAddressFocused(false)}
                multiline={true}
                numberOfLines={2}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Password:
              <Text style={styles.passwordHint}> (minimum 6 characters)</Text>
            </Text>
            <View style={[
              styles.inputContainer, 
              isPasswordFocused && styles.inputFocused,
              password && password.length < 6 && styles.inputError
            ]}>
              <MaterialCommunityIcons name="lock-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter Password"
                placeholderTextColor="#888"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
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
            {password && password.length < 6 && (
              <Text style={styles.errorText}>Password must be at least 6 characters</Text>
            )}
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Password:</Text>
            <View style={[
              styles.inputContainer, 
              isConfirmPasswordFocused && styles.inputFocused,
              confirmPassword && password !== confirmPassword && styles.inputError
            ]}>
              <MaterialCommunityIcons name="lock-check-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Re-enter Password"
                placeholderTextColor="#888"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
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
              {confirmPassword && password === confirmPassword && (
                <MaterialCommunityIcons name="check-circle" size={20} color="#2E6A2E" />
              )}
            </View>
            {confirmPassword && password !== confirmPassword && (
              <Text style={styles.errorText}>Passwords do not match</Text>
            )}
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
                  <Text style={styles.signUpButtonText}>Creating Account...</Text>
                </View>
              ) : (
                <>
                  <MaterialCommunityIcons name="account-plus-outline" size={18} color="#fff" />
                  <Text style={styles.signUpButtonText}>Create Account</Text>
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
    backgroundColor: "#FFFCF3",
  },
  keyboardContainer: {
    flex: 1,
    width: "100%",
  },
  scrollContentContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
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
  phoneHint: {
    fontSize: 12,
    fontWeight: "normal",
    color: "#888",
    fontStyle: "italic",
  },
  passwordHint: {
    fontSize: 12,
    fontWeight: "normal",
    color: "#888",
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#B0B0B0",
    paddingHorizontal: 15,
    minHeight: 50,
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
  inputError: {
    borderColor: "#FF6B6B",
    borderWidth: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  iconButton: {
    paddingLeft: 10,
    paddingVertical: 5,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
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