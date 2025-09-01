# Firebase Integration for USW_Project

## Overview
The USW_Project has been successfully connected to Firebase using the configuration from the admin-upcycled-streetwear folder. This integration provides authentication, database, and storage capabilities.

## Firebase Configuration
The Firebase configuration is located in `firebase/config.js` and uses the same project as the admin panel:
- **Project ID**: upcycled-streetwear
- **Authentication**: Email/Password
- **Database**: Firestore
- **Storage**: Firebase Storage

## Files Modified/Created

### 1. Firebase Configuration (`firebase/config.js`)
- Contains Firebase initialization
- Exports `auth`, `db`, and `storage` instances
- Uses the same config as admin-upcycled-streetwear

### 2. Authentication Context (`AuthContext.js`)
- Updated to use Firebase Authentication
- Replaced AsyncStorage-based auth with Firebase Auth
- Added user state management
- Provides `signIn`, `signOut`, `registerUser`, and `getUserData` functions

### 3. Sign In Screen (`screens/SignInScreen.js`)
- Updated to use Firebase authentication
- Removed local credential verification
- Added proper error handling for Firebase auth errors

### 4. Sign Up Screen (`screens/SignUpScreen.js`)
- Updated to use Firebase user registration
- Creates user profile in Firestore
- Automatically signs in user after successful registration

### 5. Firebase Services (`firebase/services.js`)
- Provides common Firebase operations
- User services for profile management
- Product services for CRUD operations
- Cart services for shopping cart functionality
- Storage services for image uploads

## Features Available

### Authentication
- Email/Password sign up and sign in
- Automatic user session management
- User profile creation in Firestore
- Secure authentication state persistence

### Database (Firestore)
- User profiles storage
- Product catalog management
- Shopping cart functionality
- Real-time data synchronization

### Storage
- Image upload capabilities
- Secure file storage
- URL generation for images

## Usage Examples

### Authentication
```javascript
import { useAuth } from '../AuthContext';

const { signIn, signOut, registerUser, user } = useAuth();

// Sign in
const result = await signIn(email, password);
if (result.success) {
  // User is signed in
}

// Sign up
const result = await registerUser(email, password, displayName);
if (result.success) {
  // User is registered and signed in
}

// Sign out
await signOut();
```

### Database Operations
```javascript
import { productService, cartService } from '../firebase/services';

// Get all products
const products = await productService.getAllProducts();

// Add to cart
await cartService.addToCart(userId, productId, quantity);

// Get user cart
const cartItems = await cartService.getUserCart(userId);
```

### Storage Operations
```javascript
import { storageService } from '../firebase/services';

// Upload image
const imageUrl = await storageService.uploadImage(file, 'products/image.jpg');
```

## Security Rules
Make sure your Firestore security rules are properly configured:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read products
    match /products/{productId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    // Allow authenticated users to manage their own cart
    match /cart/{cartItemId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

## Testing the Integration

1. **Start the app**: `npm start`
2. **Test registration**: Create a new account
3. **Test sign in**: Sign in with existing credentials
4. **Test persistence**: Close and reopen the app
5. **Check Firebase Console**: Verify user creation in Authentication and Firestore

## Troubleshooting

### Common Issues
1. **Authentication errors**: Check Firebase console for user creation
2. **Database permission errors**: Verify Firestore security rules
3. **Network errors**: Ensure internet connectivity
4. **Config errors**: Verify Firebase configuration is correct

### Debug Steps
1. Check browser console for error messages
2. Verify Firebase project settings
3. Check Firestore rules configuration
4. Ensure all Firebase services are enabled

## Next Steps
- Implement product catalog integration
- Add shopping cart functionality
- Set up image upload for products
- Implement user profile management
- Add admin role functionality
