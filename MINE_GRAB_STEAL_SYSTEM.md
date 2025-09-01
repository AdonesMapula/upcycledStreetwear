# Mine, Grab, and Steal Bidding System

## Overview
This document outlines the implementation of the unique "Mine, Grab, and Steal" bidding system for the Upcycled Streetwear mobile application, as specified in the project requirements.

## System Concept

### The Three Action Types

1. **MINE** - The bid starter
   - First person to claim "Mine" starts the bidding process
   - Sets the initial bid at the product's listed price
   - Opens the item for other users to "Steal"

2. **GRAB** - Accept the set price
   - User agrees to pay the exact listed price
   - Item becomes theirs unless someone "Steals" it
   - Can be stolen by higher bids before the 24-hour period ends

3. **STEAL** - Place a higher bid
   - Other users can "steal" the item with a higher bid
   - Must be higher than the current bid
   - Continues until the 24-hour period expires

## Database Schema

### Products Collection
```javascript
{
  id: "product_id",
  name: "Product Name",
  description: "Product description",
  price: 1000, // Set price by owner
  category: "Fashion",
  imageUrl: "image_url",
  size: "M",
  condition: "Good",
  status: "available", // available, mine, grab, sold
  currentBid: 0, // Current highest bid
  currentBidder: null, // User ID of current highest bidder
  mineClaimedBy: null, // User ID who claimed "Mine"
  mineClaimedBy: null, // User name who claimed "Mine"
  grabClaimedBy: null, // User ID who claimed "Grab"
  grabClaimedBy: null, // User name who claimed "Grab"
  bidHistory: [
    {
      userId: "user_id",
      userName: "User Name",
      bidAmount: 1000,
      bidType: "mine", // mine, grab, steal
      timestamp: serverTimestamp()
    }
  ],
  mineClaimedAt: null, // Timestamp when "Mine" was claimed
  grabClaimedAt: null, // Timestamp when "Grab" was claimed
  soldAt: null, // Timestamp when item was sold
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}
```

### Users Collection
```javascript
{
  uid: "user_id",
  displayName: "User Name",
  email: "user@example.com",
  photoURL: "profile_image_url",
  createdAt: serverTimestamp(),
  totalBids: 0,
  wonAuctions: 0,
  successRate: "0%"
}
```

## Firebase Services Implementation

### Bidding Service (`biddingService`)

#### 1. Claim Mine
```javascript
async claimMine(productId, userId, userName)
```
- Validates product is available
- Sets status to "mine"
- Records the initial bid at product price
- Creates bid history entry

#### 2. Claim Grab
```javascript
async claimGrab(productId, userId, userName)
```
- Validates product is not sold
- Sets status to "grab"
- Records bid at product price
- Adds to bid history

#### 3. Place Steal Bid
```javascript
async placeStealBid(productId, userId, userName, bidAmount)
```
- Validates bid amount is higher than current
- Updates current bid and bidder
- Adds steal bid to history

#### 4. Get User Bids
```javascript
async getUserBids(userId)
```
- Retrieves all products where user has bid
- Returns products with user's bid history

#### 5. Get User Claims
```javascript
async getUserClaims(userId)
```
- Retrieves products currently claimed by user
- Shows active bids and status

#### 6. Finalize Sale
```javascript
async finalizeSale(productId)
```
- Checks if 24 hours have passed since first claim
- Automatically marks item as sold
- Removes from available listings

## Screen Updates

### HomeScreen
- **Available Products**: Shows all products available for bidding
- **Mine Button**: Allows users to start bidding
- **Grab Button**: Allows users to accept set price
- **Steal Button**: Appears when item has been claimed (mine/grab)
- **Status Badges**: Shows current status (Available, Mine Claimed, Grab Claimed, Sold)
- **Current Bid Display**: Shows current highest bid when applicable

### BiddingScreen
- **Available Tab**: Shows products available for initial claims
- **My Claims Tab**: Shows user's active bids and claims
- **Time Remaining**: Shows countdown for 24-hour period
- **Bid History**: Tracks all bids on claimed items

### ProductDetailScreen
- **Enhanced Action Buttons**: Mine, Grab, Steal based on status
- **Bid History**: Shows all bids on the item
- **Time Remaining**: Countdown timer for 24-hour period
- **Current Status**: Clear indication of item status

## User Flow

### 1. Product Listing
1. Admin adds product with set price
2. Product appears as "Available"
3. Users can see Mine and Grab buttons

### 2. Mine Claim
1. User clicks "MINE" button
2. System validates user authentication
3. Product status changes to "Mine Claimed"
4. Initial bid set at product price
5. Steal button appears for other users
6. 24-hour timer starts

### 3. Grab Claim
1. User clicks "GRAB" button
2. System confirms user wants to pay set price
3. Product status changes to "Grab Claimed"
4. Bid recorded at product price
5. Steal button appears for other users
6. 24-hour timer starts

### 4. Steal Bid
1. User clicks "STEAL" button
2. Modal opens for bid amount input
3. System validates bid is higher than current
4. Current bid and bidder updated
5. Bid history updated
6. Previous bidder can steal back

### 5. Sale Finalization
1. 24 hours after first claim
2. System automatically finalizes sale
3. Product status changes to "Sold"
4. Item removed from available listings
5. Winner notified

## Key Features

### Real-time Updates
- Firebase Firestore provides real-time data synchronization
- Users see immediate updates when bids are placed
- Status changes reflect instantly across all users

### 24-Hour Timer
- Automatic sale finalization after 24 hours
- Countdown display for active bids
- Prevents indefinite bidding

### Bid Validation
- Ensures bid amounts are higher than current
- Prevents duplicate claims on same item
- Validates user authentication

### User Experience
- Clear visual indicators for item status
- Intuitive button placement
- Confirmation dialogs for important actions
- Error handling with user-friendly messages

## Security Considerations

### Authentication Required
- All bidding actions require user authentication
- User-specific data access controls
- Prevents anonymous bidding

### Data Validation
- Server-side validation of bid amounts
- Prevents invalid bid submissions
- Ensures data integrity

### Rate Limiting
- Prevents spam bidding
- Ensures fair competition
- Protects system performance

## Admin Panel Integration

### Product Management
- Add products with set prices
- Monitor bid activity
- View sales statistics
- Manage inventory

### User Management
- View user profiles
- Track user activity
- Monitor bidding patterns
- Customer support tools

### Sales Analytics
- Track successful sales
- Monitor bidding trends
- Generate reports
- Performance metrics

## Testing Scenarios

### 1. Mine Claim Flow
- Test mine claim on available product
- Verify status change and bid recording
- Confirm steal button appears

### 2. Grab Claim Flow
- Test grab claim on available product
- Verify confirmation dialog
- Confirm status change and bid recording

### 3. Steal Bid Flow
- Test steal bid on claimed product
- Verify bid amount validation
- Confirm bid history update

### 4. Time Expiration
- Test 24-hour timer functionality
- Verify automatic sale finalization
- Confirm item removal from listings

### 5. Error Handling
- Test invalid bid amounts
- Test unauthenticated access
- Test network failures

## Future Enhancements

### 1. Push Notifications
- Bid notifications for outbid users
- Sale finalization alerts
- New product notifications

### 2. Advanced Features
- Auto-bidding functionality
- Bid increments configuration
- Reserve price settings

### 3. Social Features
- User following system
- Activity feeds
- Social sharing

### 4. Payment Integration
- Secure payment processing
- Multiple payment methods
- Transaction history

## Conclusion

The Mine, Grab, and Steal bidding system provides a unique and engaging shopping experience that aligns with the Upcycled Streetwear brand's innovative approach. The system encourages user interaction while maintaining fairness and transparency in the bidding process.

The implementation leverages Firebase's real-time capabilities to ensure smooth user experience and reliable data management. The 24-hour timer adds urgency and excitement to the bidding process, while the automatic finalization ensures efficient inventory management.

This system successfully bridges the gap between traditional e-commerce and social media selling, providing the client with a professional platform that maintains the fun and interactive nature of their current business model.
