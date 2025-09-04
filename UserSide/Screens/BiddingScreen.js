import React, { useState, useCallback, useMemo } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native"

export default function BiddingScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState("live")
  const [bidAmount, setBidAmount] = useState("")

  const liveAuctions = [
    {
      id: 1,
      title: "Vintage Rolex Watch",
      currentBid: 2500,
      nextBid: 2600,
      timeLeft: "2h 15m",
      bidders: 12,
      image: "https://via.placeholder.com/120x120/CCCCCC/FFFFFF?text=Auction+Item",
      category: "Watches",
    },
    {
      id: 2,
      title: "Designer Handbag",
      currentBid: 850,
      nextBid: 900,
      timeLeft: "45m",
      bidders: 8,
      image: "https://via.placeholder.com/120x120/CCCCCC/FFFFFF?text=Auction+Item",
      category: "Fashion",
    },
    {
      id: 3,
      title: "Rare Art Piece",
      currentBid: 1200,
      nextBid: 1300,
      timeLeft: "1h 30m",
      bidders: 15,
      image: "https://via.placeholder.com/120x120/CCCCCC/FFFFFF?text=Auction+Item",
      category: "Art",
    },
  ]

  const myBids = [
    {
      id: 1,
      title: "Vintage Camera",
      myBid: 450,
      currentBid: 520,
      status: "outbid",
      timeLeft: "3h 20m",
      image: "https://via.placeholder.com/80x80/CCCCCC/FFFFFF?text=Bid+Item",
    },
    {
      id: 2,
      title: "Antique Vase",
      myBid: 280,
      currentBid: 280,
      status: "winning",
      timeLeft: "1h 45m",
      image: "https://via.placeholder.com/80x80/CCCCCC/FFFFFF?text=Bid+Item",
    },
    {
      id: 3,
      title: "Sports Memorabilia",
      myBid: 150,
      currentBid: 180,
      status: "outbid",
      timeLeft: "5h 10m",
      image: "https://via.placeholder.com/80x80/CCCCCC/FFFFFF?text=Bid+Item",
    },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case "winning":
        return "#7ED321"
      case "outbid":
        return "#D0021B"
      default:
        return "#888"
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "winning":
        return "WINNING"
      case "outbid":
        return "OUTBID"
      default:
        return "ACTIVE"
    }
  }

  const handlePlaceBid = (item) => {
    // Handle bid placement logic here
    console.log(`Placing bid of $${bidAmount} on ${item.title}`)
    setBidAmount("")
  }



  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bidding Center</Text>
        <Text style={styles.headerSubtitle}>Place bids and track your auctions</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "live" && styles.activeTab]}
          onPress={() => setActiveTab("live")}
        >
          <Text style={[styles.tabText, activeTab === "live" && styles.activeTabText]}>Live Auctions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "mybids" && styles.activeTab]}
          onPress={() => setActiveTab("mybids")}
        >
          <Text style={[styles.tabText, activeTab === "mybids" && styles.activeTabText]}>My Bids</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === "live" ? (
          <View style={styles.section}>
            {/* Quick Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>24</Text>
                <Text style={styles.statLabel}>Live Auctions</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>8</Text>
                <Text style={styles.statLabel}>Ending Soon</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>156</Text>
                <Text style={styles.statLabel}>Active Bidders</Text>
              </View>
            </View>

            {/* Live Auctions */}
            <Text style={styles.sectionTitle}>Live Auctions</Text>
            {liveAuctions.map((item) => (
              <View key={item.id} style={styles.auctionCard}>
                <Image source={{ uri: item.image }} style={styles.auctionImage} />
                <View style={styles.auctionContent}>
                  <View style={styles.auctionHeader}>
                    <Text style={styles.auctionTitle}>{item.title}</Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                  </View>

                  <View style={styles.bidInfo}>
                    <View style={styles.bidRow}>
                      <Text style={styles.bidLabel}>Current Bid:</Text>
                      <Text style={styles.currentBidAmount}>${item.currentBid.toLocaleString()}</Text>
                    </View>
                    <View style={styles.bidRow}>
                      <Text style={styles.bidLabel}>Next Bid:</Text>
                      <Text style={styles.nextBidAmount}>${item.nextBid.toLocaleString()}</Text>
                    </View>
                  </View>

                  <View style={styles.auctionFooter}>
                    <View style={styles.timeContainer}>
                      <Text style={styles.timeLeft}>{item.timeLeft} left</Text>
                    </View>
                    <View style={styles.biddersContainer}>
                      <Text style={styles.biddersCount}>{item.bidders} bidders</Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.bidButton} onPress={() => handlePlaceBid(item)}>
                    <Text style={styles.bidButtonText}>Place Bid - ${item.nextBid.toLocaleString()}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.section}>
            {/* My Bids Stats */}
            <View style={styles.myBidsStats}>
              <View style={styles.myBidsStatCard}>
                <Text style={styles.myBidsStatNumber}>3</Text>
                <Text style={styles.myBidsStatLabel}>Active Bids</Text>
              </View>
              <View style={styles.myBidsStatCard}>
                <Text style={styles.myBidsStatNumber}>1</Text>
                <Text style={styles.myBidsStatLabel}>Winning</Text>
              </View>
              <View style={styles.myBidsStatCard}>
                <Text style={styles.myBidsStatNumber}>2</Text>
                <Text style={styles.myBidsStatLabel}>Outbid</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>My Active Bids</Text>
            {myBids.map((item) => (
              <View key={item.id} style={styles.myBidCard}>
                <Image source={{ uri: item.image }} style={styles.myBidImage} />
                <View style={styles.myBidContent}>
                  <View style={styles.myBidHeader}>
                    <Text style={styles.myBidTitle}>{item.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                    </View>
                  </View>

                  <View style={styles.myBidInfo}>
                    <Text style={styles.myBidLabel}>
                      My Bid: <Text style={styles.myBidAmount}>${item.myBid}</Text>
                    </Text>
                    <Text style={styles.myBidLabel}>
                      Current: <Text style={styles.currentBidAmount}>${item.currentBid}</Text>
                    </Text>
                  </View>

                  <View style={styles.myBidFooter}>
                    <View style={styles.timeContainer}>
                      <Text style={styles.timeLeftSmall}>{item.timeLeft} left</Text>
                    </View>
                    {item.status === "outbid" && (
                      <TouchableOpacity style={styles.rebidButton}>
                        <Text style={styles.rebidButtonText}>Increase Bid</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: "#2E6A2E",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: -10,
    borderRadius: 25,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: "#2E6A2E",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
  },
  activeTabText: {
    color: "white",
  },
  scrollView: {
    flex: 1,
    marginTop: 20,
  },
  section: {
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  auctionCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  auctionImage: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    marginBottom: 15,
  },
  auctionContent: {
    flex: 1,
  },
  auctionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  auctionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  bidInfo: {
    marginBottom: 15,
  },
  bidRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  bidLabel: {
    fontSize: 14,
    color: "#666",
  },
  currentBidAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E6A2E",
  },
  nextBidAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  auctionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeLeft: {
    fontSize: 12,
    color: "#F5A623",
    marginLeft: 5,
    fontWeight: "500",
  },
  biddersContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  biddersCount: {
    fontSize: 12,
    color: "#4A90E2",
    marginLeft: 5,
    fontWeight: "500",
  },
  bidButton: {
    backgroundColor: "#2E6A2E",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  bidButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  myBidsStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  myBidsStatCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  myBidsStatNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E6A2E",
  },
  myBidsStatLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
  myBidCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  myBidImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 15,
  },
  myBidContent: {
    flex: 1,
  },
  myBidHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  myBidTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: "white",
    fontWeight: "bold",
  },
  myBidInfo: {
    marginBottom: 8,
  },
  myBidLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  myBidAmount: {
    fontWeight: "600",
    color: "#333",
  },
  myBidFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeLeftSmall: {
    fontSize: 11,
    color: "#F5A623",
    marginLeft: 4,
  },
  rebidButton: {
    backgroundColor: "#D0021B",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  rebidButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  bottomPadding: {
    height: 100,
  },
})
