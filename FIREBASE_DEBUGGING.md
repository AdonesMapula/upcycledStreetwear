# Firebase Debugging Guide

## Common Firebase Errors and Solutions

### 1. Firebase Initialization Errors

**Symptoms:**
- App crashes on startup
- "Firebase not initialized" errors
- Authentication fails

**Solutions:**
- Check that `firebase/config.js` is properly imported in `App.js`
- Verify Firebase configuration values are correct
- Ensure all Firebase dependencies are installed

### 2. Firestore Connection Errors

**Symptoms:**
- "Firestore not initialized" errors
- Products not loading
- Database operations failing

**Solutions:**
- Check internet connection
- Verify Firebase project is active
- Check Firestore rules allow read/write operations

### 3. Authentication Errors

**Symptoms:**
- Sign-in fails
- "Authentication service not available" errors
- User state not persisting

**Solutions:**
- Check Firebase Auth is enabled in Firebase Console
- Verify email/password authentication is enabled
- Check authentication rules

## Debugging Steps

### Step 1: Check Console Logs
Look for these messages in the console:
- ✅ "Firebase initialized successfully"
- ✅ "Firestore initialized successfully"
- ✅ "Firebase Auth initialized successfully"
- ✅ "Firebase Storage initialized successfully"

### Step 2: Test Firebase Connection
Add this to any screen to test connection:

```javascript
import { testFirebaseConnection } from '../firebase/config';

// In useEffect or button press
const testConnection = async () => {
  const isConnected = await testFirebaseConnection();
  console.log('Firebase connected:', isConnected);
};
```

### Step 3: Check Network Connectivity
Ensure your device/emulator has internet access.

### Step 4: Verify Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `upcycled-streetwear`
3. Check that all services are enabled:
   - Authentication
   - Firestore Database
   - Storage

## Error Handling Improvements Made

1. **Graceful Degradation**: Services now return empty arrays/null instead of crashing
2. **Initialization Checks**: All Firebase services check if they're initialized before use
3. **Error Boundaries**: App-wide error boundary catches unhandled errors
4. **Better Logging**: More detailed error messages for debugging

## Testing Firebase Services

### Test Product Service
```javascript
import { productService } from '../firebase/services';

// Test getting products
const testProducts = async () => {
  try {
    const products = await productService.getAllProducts();
    console.log('Products loaded:', products.length);
  } catch (error) {
    console.error('Error loading products:', error);
  }
};
```

### Test User Service
```javascript
import { userService } from '../firebase/services';

// Test getting user profile
const testUserProfile = async (uid) => {
  try {
    const profile = await userService.getUserProfile(uid);
    console.log('User profile:', profile);
  } catch (error) {
    console.error('Error loading user profile:', error);
  }
};
```

## Common Issues and Fixes

### Issue: "Firebase App named '[DEFAULT]' already exists"
**Fix:** This usually means Firebase is being initialized multiple times. The new config handles this.

### Issue: "Permission denied" errors
**Fix:** Check Firestore security rules in Firebase Console.

### Issue: "Network request failed"
**Fix:** Check internet connection and Firebase project status.

### Issue: "Invalid API key"
**Fix:** Verify the API key in `firebase/config.js` matches your Firebase project.

## Getting Help

If you're still experiencing issues:

1. Check the console for specific error messages
2. Verify your Firebase project settings
3. Test with a simple Firebase operation
4. Check that all dependencies are up to date

## Dependencies to Verify

Make sure these are in your `package.json`:
```json
{
  "firebase": "^12.1.0",
  "@react-native-async-storage/async-storage": "2.1.2"
}
```
