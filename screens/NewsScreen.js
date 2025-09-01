import React, { useState, useCallback, useMemo, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from "react-native"
import Feather from "react-native-vector-icons/Feather"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { productService } from "../firebase/services"

export default function NewsScreen({ navigation }) {
  const [activeCategory, setActiveCategory] = useState("all")
  const [newsArticles, setNewsArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const newsCategories = [
    { id: "all", name: "All", icon: "globe" },
    { id: "auctions", name: "Auctions"},
    { id: "featured", name: "Featured", icon: "star" },
    { id: "trends", name: "Trends", icon: "trending-up" },
  ]

  // Fetch news articles from Firebase
  const fetchNewsArticles = async () => {
    try {
      setLoading(true)
      
      // For now, we'll generate news from product data
      // In a real app, you'd have a separate 'news' collection
      const products = await productService.getAllProducts()
      
      // Generate news articles from product data
      const generatedNews = products.slice(0, 10).map((product, index) => ({
        id: `news-${product.id}`,
        title: `${product.name} - New Arrival!`,
        summary: `Check out this amazing ${product.category} item: ${product.description}`,
        category: product.featured ? "featured" : "auctions",
        timestamp: product.createdAt ? new Date(product.createdAt.toDate()).toLocaleDateString() : "Recently",
        image: product.imageUrl || "https://via.placeholder.com/200x120/CCCCCC/FFFFFF?text=News+Image",
        readTime: `${Math.floor(Math.random() * 5) + 2} min read`,
        productId: product.id,
      }))

      // Add some trending news
      const trendingNews = [
        {
          id: "trending-1",
          title: "Record-Breaking Auction Results This Week",
          summary: "Several items exceeded their estimated values by over 200% in this week's featured auctions.",
          category: "auctions",
          timestamp: "2 hours ago",
          image: "https://via.placeholder.com/200x120/CCCCCC/FFFFFF?text=News+Image",
          readTime: "3 min read",
        },
        {
          id: "trending-2",
          title: "New Authentication Technology Introduced",
          summary: "Advanced AI-powered authentication system ensures all items are verified before listing.",
          category: "featured", 
          timestamp: "5 hours ago",
          image: "https://via.placeholder.com/200x120/CCCCCC/FFFFFF?text=News+Image",
          readTime: "5 min read",
        },
        {
          id: "trending-3",
          title: "Vintage Electronics Trending Higher",
          summary: "Classic gaming consoles and retro computers are seeing unprecedented demand from collectors.",
          category: "trends",
          timestamp: "1 day ago", 
          image: "https://via.placeholder.com/200x120/CCCCCC/FFFFFF?text=News+Image",
          readTime: "4 min read",
        },
      ]

      setNewsArticles([...trendingNews, ...generatedNews])
    } catch (error) {
      console.error("Error fetching news:", error)
      // Fallback to static data if Firebase fails
      setNewsArticles([
        {
          id: 1,
          title: "Record-Breaking Auction Results This Week",
          summary: "Several items exceeded their estimated values by over 200% in this week's featured auctions.",
          category: "auctions",
          timestamp: "2 hours ago",
          image: "https://via.placeholder.com/200x120/CCCCCC/FFFFFF?text=News+Image",
          readTime: "3 min read",
        },
        {
          id: 2,
          title: "New Authentication Technology Introduced",
          summary: "Advanced AI-powered authentication system ensures all items are verified before listing.",
          category: "featured", 
          timestamp: "5 hours ago",
          image: "https://via.placeholder.com/200x120/CCCCCC/FFFFFF?text=News+Image",
          readTime: "5 min read",
        },
        {
          id: 3,
          title: "Vintage Electronics Trending Higher",
          summary: "Classic gaming consoles and retro computers are seeing unprecedented demand from collectors.",
          category: "trends",
          timestamp: "1 day ago", 
          image: "https://via.placeholder.com/200x120/CCCCCC/FFFFFF?text=News+Image",
          readTime: "4 min read",
        },
        {
          id: 4,
          title: "Spring Auction Season Opens Strong",
          summary: "The spring auction season kicks off with high participation and exciting new collections.",
          category: "auctions",
          timestamp: "2 days ago",
          image: "https://via.placeholder.com/200x120/CCCCCC/FFFFFF?text=News+Image", 
          readTime: "6 min read",
        },
        {
          id: 5,
          title: "Sustainable Bidding Initiative Launched",
          summary: "New eco-friendly packaging and carbon-neutral shipping options now available for all winners.",
          category: "featured",
          timestamp: "3 days ago",
          image: "https://via.placeholder.com/200x120/CCCCCC/FFFFFF?text=News+Image",
          readTime: "4 min read",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  // Load news on component mount
  useEffect(() => {
    fetchNewsArticles()
  }, [])

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchNewsArticles().finally(() => setRefreshing(false))
  }, [])

  const filteredNews = activeCategory === "all" 
    ? newsArticles 
    : newsArticles.filter(article => article.category === activeCategory)

  const handleArticlePress = (article) => {
    console.log("Article pressed:", article.title)
    
    // If it's a product-related news, navigate to product detail
    if (article.productId) {
      navigation.navigate("ProductDetail", { productId: article.productId })
    } else {
      // Navigate to article detail screen (to be implemented)
      console.log("Navigate to article detail:", article.title)
    }
  }

  const renderIcon = (iconName, iconType, size, color) => {
    if (iconType === "material") {
      return <MaterialCommunityIcons name={iconName} size={size} color={color} />
    } else {
      return <Feather name={iconName} size={size} color={color} />
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#2E6A2E" />
        <Text style={styles.loadingText}>Loading news...</Text>
      </View>
    )
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>News & Updates</Text>
        <Text style={styles.headerSubtitle}>Stay informed about the latest auction news</Text>
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        <View style={styles.categoryContainer}>
          {newsCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                activeCategory === category.id && styles.activeCategoryButton,
              ]}
              onPress={() => setActiveCategory(category.id)}
            >
              {category.icon && renderIcon(category.icon, "feather", 16, activeCategory === category.id ? "#2E6A2E" : "#666")}
              <Text
                style={[
                  styles.categoryButtonText,
                  activeCategory === category.id && styles.activeCategoryButtonText,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* News Articles */}
      <View style={styles.newsContainer}>
        {filteredNews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="file-text" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No news articles found</Text>
            <Text style={styles.emptySubtext}>Check back later for updates</Text>
          </View>
        ) : (
          filteredNews.map((article) => (
            <TouchableOpacity
              key={article.id}
              style={styles.newsCard}
              onPress={() => handleArticlePress(article)}
            >
              <Image source={{ uri: article.image }} style={styles.newsImage} />
              <View style={styles.newsContent}>
                <View style={styles.newsHeader}>
                  <Text style={styles.newsTitle} numberOfLines={2}>
                    {article.title}
                  </Text>
                  <View style={styles.newsMeta}>
                    <Text style={styles.newsTimestamp}>{article.timestamp}</Text>
                    <Text style={styles.newsReadTime}>{article.readTime}</Text>
                  </View>
                </View>
                <Text style={styles.newsSummary} numberOfLines={3}>
                  {article.summary}
                </Text>
                <View style={styles.newsFooter}>
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{article.category}</Text>
                  </View>
                  <Feather name="arrow-right" size={16} color="#2E6A2E" />
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    backgroundColor: "#2E6A2E",
    paddingTop: 30,
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
  categoryScroll: {
    maxHeight: 60,
    marginVertical: 15,
  },
  categoryContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeCategoryButton: {
    backgroundColor: "#2E6A2E",
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginLeft: 6,
  },
  activeCategoryButtonText: {
    color: "white",
  },
  newsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  newsCard: {
    backgroundColor: "white",
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
  },
  newsImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 15,
  },
  newsContent: {
    flex: 1,
    paddingVertical: 10,
  },
  newsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  newsMeta: {
    flexDirection: "row",
    gap: 10,
  },
  newsTimestamp: {
    fontSize: 12,
    color: "#888",
  },
  newsReadTime: {
    fontSize: 12,
    color: "#888",
  },
  newsSummary: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 10,
  },
  newsFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryTag: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryTagText: {
    fontSize: 10,
    color: "#666",
    fontWeight: "500",
    textTransform: "uppercase",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: "#333",
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
})