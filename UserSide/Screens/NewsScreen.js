import React, { useState, useEffect } from "react"
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Modal,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Alert
} from "react-native"
import Feather from "react-native-vector-icons/Feather"
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase/firebase' // Adjust the path based on your project structure

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

export default function NewsScreen({ navigation }) {
  const [newsArticles, setNewsArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedImages, setSelectedImages] = useState([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageModalVisible, setImageModalVisible] = useState(false)
  const [expandedArticles, setExpandedArticles] = useState({})


  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      setLoading(true)
      const newsCollection = collection(db, "news")
      const q = query(newsCollection, orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)

      const fetchedNews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }))

      setNewsArticles(fetchedNews)
    } catch (error) {
      console.error("Error fetching news:", error)
      Alert.alert("Error", "Failed to load news articles")
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchNews()
    setRefreshing(false)
  }

  const formatDateTime = (date) => {
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60))
      return diffInMinutes < 1 ? "Just now" : `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  const openImageViewer = (article) => {
    const allImages = []
    
    // Add main image first
    if (article.mainImage) {
      allImages.push(article.mainImage)
    }
    
    // Add secondary images
    if (article.secondaryImages && article.secondaryImages.length > 0) {
      allImages.push(...article.secondaryImages)
    }

    if (allImages.length > 0) {
      setSelectedImages(allImages)
      setCurrentImageIndex(0)
      setImageModalVisible(true)
    }
  }

  const handleArticlePress = (article) => {
    // Navigate to article detail screen or open image viewer
    openImageViewer(article)
  }

  const toggleDescription = (id) => {
  setExpandedArticles(prev => ({
    ...prev,
    [id]: !prev[id]
  }))
}



  const renderImageViewer = () => (
    <Modal
      visible={imageModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setImageModalVisible(false)}
    >
      <View style={styles.imageModalContainer}>
        <View style={styles.imageModalHeader}>
          <Text style={styles.imageCounter}>
            {currentImageIndex + 1} of {selectedImages.length}
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setImageModalVisible(false)}
          >
            <Feather name="x" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={selectedImages}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth)
            setCurrentImageIndex(index)
          }}
          renderItem={({ item }) => (
            <View style={styles.imageSlideContainer}>
              <Image
                source={{ uri: item }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
        />

        {selectedImages.length > 1 && (
          <View style={styles.imageDots}>
            {selectedImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  currentImageIndex === index && styles.activeDot
                ]}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E6A2E" />
        <Text style={styles.loadingText}>Loading news...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>News & Updates</Text>
        <Text style={styles.headerSubtitle}>
          {newsArticles.length} articles • Stay informed with the latest updates
        </Text>
      </View>

      {/* News Articles */}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2E6A2E']}
            tintColor="#2E6A2E"
          />
        }
      >
        <View style={styles.articlesContainer}>
          {newsArticles.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="file-text" size={48} color="#CCC" />
              <Text style={styles.emptyStateText}>No news available</Text>
              <Text style={styles.emptyStateSubtext}>Pull down to refresh</Text>
            </View>
          ) : (
            newsArticles.map((article) => (
              <TouchableOpacity 
                key={article.id} 
                style={styles.articleCard}
                onPress={() => handleArticlePress(article)}
                activeOpacity={0.7}
              >
                {/* Article Image */}
                {article.mainImage && (
                  <View style={styles.imageContainer}>
                    <Image 
                      source={{ uri: article.mainImage }} 
                      style={styles.articleImage}
                      resizeMode="cover"
                    />
                    {article.secondaryImages && article.secondaryImages.length > 0 && (
                      <View style={styles.imageCountBadge}>
                        <Feather name="image" size={12} color="white" />
                        <Text style={styles.imageCountText}>
                          +{article.secondaryImages.length}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.articleContent}>
                  {/* Article Title */}
                  <Text style={styles.articleTitle} numberOfLines={2}>
                    {article.title}
                  </Text>

                  {/* Article Description */}
                  <Text
                    style={styles.articleDescription}
                    numberOfLines={expandedArticles[article.id] ? undefined : 3}
                  >
                    {article.description}
                  </Text>

                  {/* See More / See Less */}
                  {article.description && article.description.length > 100 && (
                    <TouchableOpacity onPress={() => toggleDescription(article.id)}>
                      <Text style={styles.seeMoreText}>
                        {expandedArticles[article.id] ? "See Less" : "See More..."}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Article Footer */}
                  <View style={styles.articleFooter}>
                    <View style={styles.timeContainer}>
                      <Feather name="clock" size={14} color="#888" />
                      <Text style={styles.timestamp}>
                        {formatDateTime(article.createdAt)}
                      </Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.readMoreButton}
                      onPress={() => openImageViewer(article)}
                    >
                      <Text style={styles.readMoreText}>View Images</Text>
                      <Feather name="arrow-right" size={14} color="#2E6A2E" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {renderImageViewer()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  header: {
    backgroundColor: "#2E6A2E",
    paddingTop: 30,
    paddingBottom: 24,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  articlesContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
  },
  articleCard: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
  },
  imageContainer: {
    position: 'relative',
  },
  articleImage: {
    width: "100%",
    height: 200,
  },
  imageCountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  articleContent: {
    padding: 20,
  },
  articleTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
    lineHeight: 26,
  },
  articleDescription: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
    marginBottom: 16,
  },
  articleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 16,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timestamp: {
    fontSize: 13,
    color: "#888",
    marginLeft: 6,
    fontWeight: '500',
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(46, 106, 46, 0.1)',
    borderRadius: 8,
  },
  readMoreText: {
    fontSize: 13,
    color: '#2E6A2E',
    fontWeight: '600',
    marginRight: 4,
  },
  bottomPadding: {
    height: 100,
  },
  // Image Modal Styles
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  imageModalHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  imageCounter: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  imageSlideContainer: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: screenWidth,
    height: screenHeight * 0.8,
  },
  imageDots: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: 'white',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  seeMoreText: {
  color: "#2E6A2E",
  fontWeight: "600",
  marginTop: 2,
  marginBottom: 8,
}
})

