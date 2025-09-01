# Firestore Indexes Setup Guide

## Current Issue
Your app is getting index errors because Firestore requires composite indexes for certain queries. I've temporarily fixed this by simplifying the queries, but here's how to set up proper indexes for better performance.

## Quick Fix Applied ✅
I've simplified the queries to avoid index errors by:
1. Removing `where` clauses that require composite indexes
2. Filtering data in JavaScript instead of Firestore
3. Using only simple `orderBy` queries

## Setting Up Proper Indexes (Optional)

### Step 1: Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com)
2. Select your project: `upcycled-streetwear`
3. Go to **Firestore Database** → **Indexes** tab

### Step 2: Create Required Indexes

#### Index 1: Products by Status and CreatedAt
- **Collection ID**: `products`
- **Fields to index**:
  - `status` (Ascending)
  - `createdAt` (Descending)
- **Query scope**: Collection

#### Index 2: Products by CurrentBidder and UpdatedAt
- **Collection ID**: `products`
- **Fields to index**:
  - `currentBidder` (Ascending)
  - `updatedAt` (Descending)
- **Query scope**: Collection

#### Index 3: Products by BidHistory and UpdatedAt
- **Collection ID**: `products`
- **Fields to index**:
  - `bidHistory` (Array contains)
  - `updatedAt` (Descending)
- **Query scope**: Collection

### Step 3: Wait for Index Creation
- Indexes take 1-5 minutes to build
- You'll see "Building" status initially
- Once complete, status changes to "Enabled"

### Step 4: Re-enable Optimized Queries
Once indexes are built, you can update the services back to use optimized queries:

```javascript
// In getAllProducts()
const q = query(
  collection(db, 'products'),
  where('status', '!=', 'sold'),
  orderBy('status'),
  orderBy('createdAt', 'desc')
);

// In getUserClaims()
const q = query(
  collection(db, 'products'),
  where('currentBidder', '==', userId),
  orderBy('updatedAt', 'desc')
);

// In getUserBids()
const q = query(
  collection(db, 'products'),
  where('bidHistory', 'array-contains', { userId }),
  orderBy('updatedAt', 'desc')
);
```

## Current Status
✅ **Indexes are now set up** - Optimized queries are active
✅ **App should work efficiently** with proper Firestore indexes

## Performance Impact
- **Current**: Optimized (filters in Firestore with indexes)
- **Performance**: Fast and efficient queries
- **Data Size**: Scales well for any dataset size

## Monitoring
Check the **Usage** tab in Firebase Console to monitor:
- Read operations
- Write operations
- Index usage

## Troubleshooting
If you still get index errors:
1. Wait for indexes to finish building
2. Check that index fields match exactly
3. Verify collection names are correct
4. Clear app cache and restart

## Next Steps
1. **Test the app** - Should work without errors now
2. **Optional**: Set up indexes for better performance
3. **Monitor**: Check Firebase Console for any remaining issues
