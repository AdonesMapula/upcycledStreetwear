import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Animated,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { useAuth } from '../AuthContext';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// Onboarding data for your Upcycled app
const onboardingData = [
  {
    id: 1,
    title: 'Welcome to Upcycled!',
    description: 'Transform waste into wonderful creations and join our sustainable community where every item gets a second life.',
    backgroundColor: '#E8F5E8',
    icon: '🌱',
    features: ['♻️ Eco-friendly marketplace', '🌍 Global sustainability community', '💚 Make a positive impact']
  },
  {
    id: 2,
    title: 'Discover Amazing Products',
    description: 'Browse through our marketplace of unique upcycled items created by passionate makers around the world.',
    backgroundColor: '#E3F2FD',
    icon: '🔍',
    features: ['🛍️ Unique handcrafted items', '🏪 Support local creators', '⭐ Quality guaranteed products']
  },
  {
    id: 3,
    title: 'Join Exciting Auctions',
    description: 'Participate in live bidding sessions and win exclusive upcycled treasures at amazing prices.',
    backgroundColor: '#FFF3E0',
    icon: '🏆',
    features: ['⏰ Live bidding experience', '💎 Exclusive rare finds', '🎯 Win amazing deals']
  },
  {
    id: 4,
    title: 'Stay Connected',
    description: 'Get the latest sustainability news, upcycling tips, and updates from our eco-conscious community.',
    backgroundColor: '#F3E5F5',
    icon: '📰',
    features: ['📱 Latest eco news', '💡 DIY upcycling tips', '🤝 Community stories']
  },
  {
    id: 5,
    title: 'Your AI Shopping Assistant',
    description: 'Meet your personal AI helper! Get recommendations, ask questions, and discover products tailored just for you.',
    backgroundColor: '#E8F5E8',
    icon: '🤖',
    features: ['🎯 Personalized recommendations', '❓ 24/7 help & support', '🔮 Smart shopping insights']
  },
];

const OnboardingScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { setHasSeenOnboarding } = useAuth();
  const navigation = useNavigation();
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (currentIndex < onboardingData.length - 1) {
      slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      // Complete onboarding and navigate to sign in
      completeOnboarding();
    }
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      // Mark that user has seen onboarding
      await setHasSeenOnboarding(true);
      // Navigate to sign in screen
      navigation.navigate('SignIn');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Fallback navigation
      navigation.navigate('SignIn');
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      slidesRef.current.scrollToIndex({ index: currentIndex - 1 });
    }
  };

  const OnboardingItem = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.container, { backgroundColor: item.backgroundColor }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            {/* Header with Skip Button */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.skipButton} 
                onPress={skipOnboarding}
              >
                <Text style={styles.skipText}>Skip Tutorial</Text>
              </TouchableOpacity>
            </View>

            {/* Icon and Main Content */}
            <View style={styles.mainContent}>
              <Text style={styles.iconText}>{item.icon}</Text>
              
              <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
                
                {/* Features List */}
                <View style={styles.featuresContainer}>
                  {item.features.map((feature, index) => (
                    <Text key={index} style={styles.featureText}>
                      {feature}
                    </Text>
                  ))}
                </View>
              </View>
            </View>

            {/* Navigation Controls */}
            <View style={styles.navigationContainer}>
              {/* Pagination Dots */}
              <View style={styles.pagination}>
                {onboardingData.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      index === currentIndex ? styles.activeDot : styles.inactiveDot
                    ]}
                  />
                ))}
              </View>

              {/* Navigation Buttons */}
              <View style={styles.buttonsContainer}>
                {currentIndex > 0 && (
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={goToPrevious}
                  >
                    <Text style={styles.backButtonText}>← Back</Text>
                  </TouchableOpacity>
                )}
                
                <View style={styles.spacer} />
                
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={scrollTo}
                >
                  <Text style={styles.nextButtonText}>
                    {currentIndex === onboardingData.length - 1 ? '🚀 Continue to Sign In' : 'Next →'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <Animated.FlatList
        ref={slidesRef}
        data={onboardingData}
        renderItem={({ item }) => <OnboardingItem item={item} />}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id.toString()}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        scrollEventThrottle={32}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  slide: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 10,
    paddingBottom: 20,
  },
  skipButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
  },
  skipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconText: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: 30,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E6A2E',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 34,
  },
  description: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  featuresContainer: {
    alignItems: 'flex-start',
  },
  featureText: {
    fontSize: 16,
    color: '#2E6A2E',
    marginBottom: 8,
    fontWeight: '500',
  },
  navigationContainer: {
    paddingBottom: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 8,
  },
  activeDot: {
    width: 30,
    backgroundColor: '#2E6A2E',
  },
  inactiveDot: {
    width: 10,
    backgroundColor: '#C4C4C4',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  backButtonText: {
    color: '#2E6A2E',
    fontSize: 16,
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
  },
  nextButton: {
    backgroundColor: '#2E6A2E',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default OnboardingScreen;