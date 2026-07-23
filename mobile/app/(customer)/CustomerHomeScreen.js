import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  { id: 6, name: 'Grill', icon: 'flame-outline' },
];

const CUSTOMER_TABS = [
  { id: 'home', label: 'Home', icon: 'home-outline' },
  { id: 'orders', label: 'Orders', icon: 'receipt-outline' },
  { id: 'profile', label: 'Profile', icon: 'person-outline' },
];

export default function CustomerHomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('home');
  const [orders, setOrders] = useState([]);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const fetchRestaurants = async () => {
    try {
      setError(null);
      const response = await api.get('/api/customer/restaurants');
      setRestaurants(response.data);
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Unable to load restaurants.';
      setError(message);
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/customer/orders');
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Unable to load customer orders:', err);
    }
  };

  useEffect(() => {
    fetchRestaurants();
    fetchOrders();

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

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const query = searchQuery.trim().toLowerCase();
    const cuisine = (restaurant.cuisineType || '').toLowerCase();
    const name = (restaurant.name || '').toLowerCase();
    const matchesSearch = !query || name.includes(query) || cuisine.includes(query);
    const matchesCategory =
      selectedCategory === 'All' ||
      cuisine.includes(selectedCategory.toLowerCase()) ||
      name.includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    Promise.all([fetchRestaurants(), fetchOrders()]).finally(() => setIsRefreshing(false));
  };

  const getOrderStatusText = (status) => {
    if (status === 'PENDING') return 'Waiting for restaurant';
    if (status === 'PREPARING') return 'Cooking now';
    if (status === 'READY') return 'Ready for pickup';
    if (status === 'DELIVERING') return 'Courier on the way';
    if (status === 'DELIVERED') return 'Delivered';
    if (status === 'CANCELLED') return 'Cancelled';
    return status;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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

      <View style={styles.tabBar}>
        {CUSTOMER_TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
            >
              <Ionicons name={tab.icon} size={18} color={active ? '#FFFFFF' : '#6C757D'} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#FF5C00" />
        }
      >
        {/* Welcome Section */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {activeTab === 'home' && (
            <>
          <View style={styles.welcomeBanner}>
            <View style={styles.bannerTextContainer}>
              <Text style={styles.welcomeText}>Hey {user?.name || 'Customer'},</Text>
              <Text style={styles.promoText}>Hungry? Get 50% off on your first order!</Text>
              <TouchableOpacity style={styles.promoBtn} onPress={() => setSelectedCategory('All')}>
                <Text style={styles.promoBtnText}>Order Now</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.bannerIconBg}>
              <Ionicons name="gift" size={54} color="#FFFFFF" />
            </View>
          </View>

          {/* Search */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#8A8A8E" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search restaurants or cuisines"
              placeholderTextColor="#8A8A8E"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                <Ionicons name="close-circle" size={18} color="#8A8A8E" />
              </TouchableOpacity>
            )}
          </View>

          {/* Categories */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            <TouchableOpacity
              style={[styles.categoryCard, selectedCategory === 'All' && styles.categoryCardActive]}
              onPress={() => setSelectedCategory('All')}
            >
              <View style={[styles.categoryIconBg, selectedCategory === 'All' && styles.categoryIconBgActive]}>
                <Ionicons name="grid-outline" size={24} color={selectedCategory === 'All' ? '#FFFFFF' : '#FF5C00'} />
              </View>
              <Text style={[styles.categoryName, selectedCategory === 'All' && styles.categoryNameActive]}>
                All
              </Text>
            </TouchableOpacity>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryCard, selectedCategory === cat.name && styles.categoryCardActive]}
                onPress={() => setSelectedCategory(cat.name)}
              >
                <View style={[styles.categoryIconBg, selectedCategory === cat.name && styles.categoryIconBgActive]}>
                  <Ionicons
                    name={cat.icon}
                    size={24}
                    color={selectedCategory === cat.name ? '#FFFFFF' : '#FF5C00'}
                  />
                </View>
                <Text style={[styles.categoryName, selectedCategory === cat.name && styles.categoryNameActive]}>
                  {cat.name}
                </Text>
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
            <View style={styles.stateCard}>
              <Ionicons name="warning-outline" size={28} color="#D9383A" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={fetchRestaurants} style={styles.retryBtn}>
                <Text style={styles.retryBtnText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : filteredRestaurants.length === 0 ? (
            <View style={styles.stateCard}>
              <Ionicons name="search-outline" size={28} color="#8A8A8E" />
              <Text style={styles.emptyText}>No restaurants match your search.</Text>
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                style={styles.retryBtn}
              >
                <Text style={styles.retryBtnText}>Clear Filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredRestaurants.map((res) => (
              <TouchableOpacity
                key={res.id}
                style={styles.restaurantCard}
                activeOpacity={0.95}
                onPress={() => navigation.navigate('RestaurantMenu', { restaurant: res })}
              >
                <Image source={{ uri: res.image }} style={styles.restaurantImage} />
                <View style={styles.restaurantInfo}>
                  <View style={styles.restaurantTitleRow}>
                    <Text style={styles.restaurantName} numberOfLines={1}>{res.name}</Text>
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
            </>
          )}

          {activeTab === 'orders' && (
            <View>
              <Text style={styles.sectionTitle}>Your Orders</Text>
              {orders.length === 0 ? (
                <View style={styles.stateCard}>
                  <Ionicons name="receipt-outline" size={30} color="#8A8A8E" />
                  <Text style={styles.emptyText}>No orders yet. Browse restaurants and place your first order.</Text>
                  <TouchableOpacity onPress={() => setActiveTab('home')} style={styles.retryBtn}>
                    <Text style={styles.retryBtnText}>Browse Food</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                orders.map((order) => (
                  <TouchableOpacity
                    key={order.id}
                    style={styles.orderCard}
                    onPress={() => navigation.navigate('OrderStatus', { order })}
                    activeOpacity={0.9}
                  >
                    <View style={styles.orderTopRow}>
                      <Text style={styles.orderId}>#QB-{order.id}</Text>
                      <Text style={[styles.orderStatus, styles[`orderStatus${order.status}`] || styles.orderStatusDefault]}>
                        {order.status}
                      </Text>
                    </View>
                    <Text style={styles.orderRestaurant}>{order.restaurant?.name || 'Restaurant'}</Text>
                    <Text style={styles.orderMeta} numberOfLines={1}>
                      {getOrderStatusText(order.status)}
                      {order.driverName ? ` · Driver: ${order.driverName}` : ''}
                    </Text>
                    <View style={styles.orderFooter}>
                      <Text style={styles.orderTotal}>${Number(order.totalPrice).toFixed(2)}</Text>
                      <View style={styles.trackBtn}>
                        <Text style={styles.trackBtnText}>Track</Text>
                        <Ionicons name="chevron-forward" size={15} color="#FF5C00" />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {activeTab === 'profile' && (
            <View>
              <View style={styles.profileCard}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileInitial}>{(user?.name || user?.email || 'C')[0].toUpperCase()}</Text>
                </View>
                <Text style={styles.profileName}>{user?.name || 'Customer'}</Text>
                <Text style={styles.profileEmail}>{user?.email || 'customer@quickbite.com'}</Text>
              </View>

              <View style={styles.profileActions}>
                <View style={styles.profileActionRow}>
                  <Ionicons name="location-outline" size={20} color="#FF5C00" />
                  <View style={styles.profileActionText}>
                    <Text style={styles.profileActionTitle}>Delivery address</Text>
                    <Text style={styles.profileActionMeta}>123 Main Street, Cityville</Text>
                  </View>
                </View>
                <View style={styles.profileActionRow}>
                  <Ionicons name="card-outline" size={20} color="#FF5C00" />
                  <View style={styles.profileActionText}>
                    <Text style={styles.profileActionTitle}>Payment</Text>
                    <Text style={styles.profileActionMeta}>Demo card enabled</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.logoutWideBtn} onPress={handleLogout}>
                  <Text style={styles.logoutWideText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </View>
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
    flexShrink: 1,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 6,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  tabBtnActive: {
    backgroundColor: '#FF5C00',
  },
  tabText: {
    color: '#6C757D',
    fontSize: 12,
    fontWeight: '800',
  },
  tabTextActive: {
    color: '#FFFFFF',
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
  searchInput: {
    flex: 1,
    color: '#1E1E24',
    fontSize: 15,
    height: '100%',
  },
  clearSearchBtn: {
    padding: 4,
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
    width: 76,
    paddingVertical: 2,
  },
  categoryCardActive: {
    transform: [{ translateY: -1 }],
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
  categoryIconBgActive: {
    backgroundColor: '#FF5C00',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
    textAlign: 'center',
  },
  categoryNameActive: {
    color: '#FF5C00',
    fontWeight: '800',
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
    flex: 1,
    marginRight: 10,
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
    marginTop: 10,
    lineHeight: 20,
  },
  emptyText: {
    color: '#8A8A8E',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  stateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 4,
  },
  retryBtn: {
    marginTop: 14,
    backgroundColor: '#FF5C00',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    color: '#6C757D',
    fontSize: 13,
    fontWeight: '800',
  },
  orderStatus: {
    overflow: 'hidden',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 10,
    fontWeight: '800',
  },
  orderStatusPENDING: {
    color: '#C94B00',
    backgroundColor: '#FFF7E6',
  },
  orderStatusPREPARING: {
    color: '#1A73E8',
    backgroundColor: '#E8F0FE',
  },
  orderStatusREADY: {
    color: '#2B8A3E',
    backgroundColor: '#EBFBEE',
  },
  orderStatusDELIVERING: {
    color: '#4D2A8A',
    backgroundColor: '#F3E8FD',
  },
  orderStatusDELIVERED: {
    color: '#2B8A3E',
    backgroundColor: '#EBFBEE',
  },
  orderStatusCANCELLED: {
    color: '#D9383A',
    backgroundColor: '#FFF2F2',
  },
  orderStatusDefault: {
    color: '#6C757D',
    backgroundColor: '#F1F3F5',
  },
  orderRestaurant: {
    color: '#1E1E24',
    fontSize: 16,
    fontWeight: '800',
  },
  orderMeta: {
    color: '#6C757D',
    fontSize: 13,
    marginTop: 5,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
  },
  orderTotal: {
    color: '#1E1E24',
    fontSize: 16,
    fontWeight: '800',
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackBtnText: {
    color: '#FF5C00',
    fontSize: 13,
    fontWeight: '800',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
  },
  profileAvatar: {
    width: 74,
    height: 74,
    borderRadius: 22,
    backgroundColor: '#FFF0E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  profileInitial: {
    color: '#FF5C00',
    fontSize: 30,
    fontWeight: '800',
  },
  profileName: {
    color: '#1E1E24',
    fontSize: 20,
    fontWeight: '800',
  },
  profileEmail: {
    color: '#6C757D',
    fontSize: 13,
    marginTop: 4,
  },
  profileActions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
    gap: 14,
  },
  profileActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileActionText: {
    marginLeft: 12,
    flex: 1,
  },
  profileActionTitle: {
    color: '#1E1E24',
    fontSize: 14,
    fontWeight: '800',
  },
  profileActionMeta: {
    color: '#6C757D',
    fontSize: 12,
    marginTop: 2,
  },
  logoutWideBtn: {
    backgroundColor: '#FFF2F2',
    borderRadius: 12,
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutWideText: {
    color: '#D9383A',
    fontSize: 14,
    fontWeight: '800',
  },
});
