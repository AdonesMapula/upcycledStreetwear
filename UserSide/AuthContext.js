"use client"

import { createContext, useState, useEffect, useContext, useMemo, useCallback } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "./firebase/firebase"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null) // Store complete user data
  const [userData, setUserData] = useState(null) // Store Firestore user data

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true)

      if (user) {
        try {
          const userDocRef = doc(db, "customers", user.uid)
          const userDocSnap = await getDoc(userDocRef)

          if (userDocSnap.exists()) {
            const firestoreData = userDocSnap.data()
            setUserData(firestoreData)
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              ...firestoreData,
            })
          } else {
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              name: user.email.split("@")[0], // Use email prefix as fallback name
            })
          }
          setIsLoggedIn(true)
        } catch (error) {
          console.error("Error fetching user data:", error)
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            name: user.email.split("@")[0],
          })
          setIsLoggedIn(true)
        }
      } else {
        setCurrentUser(null)
        setUserData(null)
        setIsLoggedIn(false)
      }

      setIsLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = useCallback(async () => {
    // This will be handled by onAuthStateChanged
    // No need to manually set state here
  }, [])

  const signOut = useCallback(async () => {
    try {
      await auth.signOut()
      // onAuthStateChanged will handle state updates
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }, [])

  const updateUserData = useCallback((newData) => {
    setUserData((prev) => ({ ...prev, ...newData }))
    setCurrentUser((prev) => ({ ...prev, ...newData }))
  }, [])

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      isLoggedIn,
      isLoading,
      currentUser, // Provide complete user data
      userData, // Provide Firestore user data
      signIn,
      signOut,
      updateUserData, // Method to update user data
    }),
    [isLoggedIn, isLoading, currentUser, userData, signIn, signOut, updateUserData],
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
