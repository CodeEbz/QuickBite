import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import api from '../../lib/api';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = [
  { id: 1, name: 'Burgers', icon: 'pizza' },
  { id: 2, name: 'Pizza', icon: 'pizza-outline' },
  { id: 3, name: 'Asian', icon: 'leaf-outline' },
  { id: 4, name: 'Desserts', icon: 'ice-cream-outline' },
  { id: 5, name: 'Drinks', icon: 'beer-outline' },
];

export default function CustomerHomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const fetchRestaurants = async () => {
    try {
      const response = await api.get('/api/customer/restaurants');
      setRestaurants(response.data);
    } catch (err) {
      setError('Unable to load restaurants.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Deliver to</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color="#FF5C00" />
            <Text style={styles.locationText}>123 Main Street, Cityville</Text>
            <Ionicons name="chevron-down" size={16} color="#1E1E24" />
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#D9383A" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.welcomeBanner}>
            <View style={styles.bannerTextContainer}>
              <Text style={styles.welcomeText}>Hey {user?.name || 'Customer'},</Text>
              <Text style={styles.promoText}>Hungry? Get 50% off on your first order!</Text>
              <TouchableOpacity style={styles.promoBtn}>
                <Text style={styles.promoBtnText}>Order Now</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.bannerIconBg}>
              <Ionicons name="gift" size={54} color="#FFFFFF" />
            </View>
          </View>

          {/* Search bar placeholder */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#8A8A8E" style={styles.searchIcon} />
            <Text style={styles.searchText}>Search restaurants, dishes...</Text>
          </View>

          {/* Categories */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat.id} style={styles.categoryCard}>
                <View style={styles.categoryIconBg}>
                  <Ionicons name={cat.icon} size={24} color="#FF5C00" />
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Restaurants */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>Popular Restaurants</Text>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color="#FF5C00" style={{ marginTop: 20 }} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : restaurants.length === 0 ? (
            <Text style={styles.emptyText}>No active restaurants available right now.</Text>
          ) : (
            restaurants.map((res) => (
              <TouchableOpacity
                key={res.id}
                style={styles.restaurantCard}
                activeOpacity={0.95}
                onPress={() => navigation.navigate('RestaurantMenu', { restaurant: res })}
              >
                <Image source={{ uri: res.image }} style={styles.restaurantImage} />
                <View style={styles.restaurantInfo}>
                  <View style={styles.restaurantTitleRow}>
                    <Text style={styles.restaurantName}>{res.name}</Text>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={14} color="#FFD60A" />
                      <Text style={styles.ratingText}>{res.rating > 0 ? res.rating.toFixed(1) : 'N/A'}</Text>
                    </View>
                  </View>
                  <Text style={styles.restaurantTags}>{res.cuisineType || 'General'}</Text>
                  <View style={styles.restaurantMetaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={14} color="#8A8A8E" />
                      <Text style={styles.metaText}>20-30 min</Text>
                    </View>
                    <Text style={styles.metaDivider}>•</Text>
                    <View style={styles.deliveryBadge}>
                      <Text style={styles.deliveryBadgeText}>Free Delivery</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  greeting: {
    fontSize: 12,
    color: '#8A8A8E',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1E24',
    marginHorizontal: 4,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  welcomeBanner: {
    backgroundColor: '#FF5C00',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    shadowColor: '#FF5C00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  bannerTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.9,
  },
  promoText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 24,
  },
  promoBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  promoBtnText: {
    color: '#FF5C00',
    fontSize: 13,
    fontWeight: '700',
  },
  bannerIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 24,
    shadowColor: '#1E1E24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchText: {
    color: '#8A8A8E',
    fontSize: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1E24',
  },
  categoriesScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 72,
  },
  categoryIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF0E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
  },
  restaurantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#1E1E24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  restaurantImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#E9ECEF',
  },
  restaurantInfo: {
    padding: 16,
  },
  restaurantTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1E24',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFEE0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF5C00',
    marginLeft: 4,
  },
  restaurantTags: {
    fontSize: 13,
    color: '#6C757D',
    marginBottom: 10,
  },
  restaurantMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#8A8A8E',
    marginLeft: 4,
  },
  metaDivider: {
    fontSize: 12,
    color: '#CED4DA',
    marginHorizontal: 8,
  },
  deliveryBadge: {
    backgroundColor: '#EBFBEE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  deliveryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2B8A3E',
  },
  errorText: {
    color: '#D9383A',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyText: {
    color: '#8A8A8E',
    textAlign: 'center',
    marginTop: 20,
  },
});
