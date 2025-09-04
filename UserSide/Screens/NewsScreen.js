import React, { useState, useCallback, useMemo } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native"
import Feather from "react-native-vector-icons/Feather"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"

export default function NewsScreen({ navigation }) {
  const [activeCategory, setActiveCategory] = useState("all")

  const newsCategories = [
    { id: "all", name: "All", icon: "globe" },
    { id: "auctions", name: "Auctions"},
    { id: "featured", name: "Featured", icon: "star" },
    { id: "trends", name: "Trends", icon: "trending-up" },
  ]

  const newsArticles = [
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
  ]

  const filteredNews = activeCategory === "all" 
    ? newsArticles 
    : newsArticles.filter(article => article.category === activeCategory)

  const handleArticlePress = (article) => {
    console.log("Article pressed:", article.title)
    // Navigate to article detail screen
  }

  const renderIcon = (iconName, iconType, size, color) => {
    if (iconType === "material") {
      return <MaterialCommunityIcons name={iconName} size={size} color={color} />
    } else {
      return <Feather name={iconName} size={size} color={color} />
    }
  }

  return (
    <View style={styles.container}>
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
              {renderIcon(category.icon, "feather", 16, 
                activeCategory === category.id ? "white" : "#666")}
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === category.id && styles.activeCategoryText,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
                    
      {/* News Articles */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {activeCategory === "all" ? "Latest News" : `${newsCategories.find(c => c.id === activeCategory)?.name} News`}
          </Text>
          
          {filteredNews.map((article) => (
            <TouchableOpacity 
              key={article.id} 
              style={styles.articleCard}
              onPress={() => handleArticlePress(article)}
            >
              <Image source={{ uri: article.image }} style={styles.articleImage} />
              <View style={styles.articleContent}>
                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.articleSummary}>{article.summary}</Text>
                
                <View style={styles.articleFooter}>
                  <View style={styles.articleMeta}>
                    <View style={styles.timeContainer}>
                      {renderIcon("clock", "feather", 12, "#888")}
                      <Text style={styles.timestamp}>{article.timestamp}</Text>
                    </View>
                    <View style={styles.readTimeContainer}>
                      {renderIcon("book-open", "feather", 12, "#888")}
                      <Text style={styles.readTime}>{article.readTime}</Text>
                    </View>
                  </View>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>
                      {newsCategories.find(c => c.id === article.category)?.name}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

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
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginLeft: 6,
  },
  activeCategoryText: {
    color: "white",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  articleCard: {
    backgroundColor: "white",
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  articleImage: {
    width: "100%",
    height: 180,
  },
  articleContent: {
    padding: 15,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    lineHeight: 24,
  },
  articleSummary: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  articleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  articleMeta: {
    flexDirection: "row",
    gap: 15,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timestamp: {
    fontSize: 12,
    color: "#888",
    marginLeft: 4,
  },
  readTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  readTime: {
    fontSize: 12,
    color: "#888",
    marginLeft: 4,
  },
  categoryBadge: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 10,
    color: "#666",
    fontWeight: "500",
    textTransform: "uppercase",
  },
  bottomPadding: {
    height: 100,
  },
})