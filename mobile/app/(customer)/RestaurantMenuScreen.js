import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, decrementQuantity, incrementQuantity } from '../../store/slices/cartSlice';
import api from '../../lib/api';
import { Ionicons } from '@expo/vector-icons';

export default function RestaurantMenuScreen({ route, navigation }) {
  const { restaurant } = route.params;
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);

  const fetchMenu = async () => {
    try {
      setError(null);
      const response = await api.get(`/api/customer/restaurants/${restaurant.id}/menu`);
      setMenuItems(response.data);
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Failed to load menu. Please try again.';
      setError(message);
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [restaurant.id]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchMenu();
  };

  const handleAddItem = (item) => {
    dispatch(
      addToCart({
        item: {
          id: item.id,
          name: item.name,
          price: item.price,
        },
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
      })
    );
  };

  const getCartQty = (itemId) => {
    if (cart.restaurantId !== restaurant.id) return 0;
    const item = cart.items.find((i) => i.id === itemId);
    return item ? item.quantity : 0;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header Image & Info */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#FF5C00" />
        }
      >
        <View style={styles.headerImageContainer}>
          <Image source={{ uri: restaurant.image }} style={styles.headerImage} />
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#1E1E24" />
          </TouchableOpacity>
        </View>

        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.restaurantCuisine}>{restaurant.cuisineType}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#FFD60A" />
              <Text style={styles.ratingText}>{restaurant.rating > 0 ? restaurant.rating.toFixed(1) : 'N/A'}</Text>
            </View>
            <Text style={styles.metaDivider}>•</Text>
            <Text style={styles.metaText}>Free Delivery</Text>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Full Menu</Text>

          {isLoading ? (
            <ActivityIndicator size="large" color="#FF5C00" style={{ marginTop: 40 }} />
          ) : error ? (
            <View style={styles.stateCard}>
              <Ionicons name="warning-outline" size={28} color="#D9383A" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={fetchMenu} style={styles.retryBtn}>
                <Text style={styles.retryBtnText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : menuItems.length === 0 ? (
            <View style={styles.stateCard}>
              <Ionicons name="restaurant-outline" size={28} color="#8A8A8E" />
              <Text style={styles.emptyText}>No menu items available for this restaurant yet.</Text>
            </View>
          ) : (
            menuItems.map((item) => {
              const qty = getCartQty(item.id);
              return (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemTextContainer}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                    <Text style={styles.itemPrice}>${Number(item.price).toFixed(2)}</Text>
                  </View>

                  <View style={styles.itemActionContainer}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <Image source={{ uri: item.image }} style={styles.itemImage} />
                    
                    {qty > 0 ? (
                      <View style={styles.qtyControl}>
                        <TouchableOpacity
                          onPress={() => dispatch(decrementQuantity(item.id))}
                          style={styles.qtyBtn}
                        >
                          <Ionicons name="remove" size={16} color="#FF5C00" />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{qty}</Text>
                        <TouchableOpacity
                          onPress={() => dispatch(incrementQuantity(item.id))}
                          style={styles.qtyBtn}
                        >
                          <Ionicons name="add" size={16} color="#FF5C00" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleAddItem(item)}
                        style={styles.addBtn}
                        activeOpacity={0.9}
                      >
                        <Text style={styles.addBtnText}>ADD</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Floating View Cart Banner */}
      {cart.items.length > 0 && cart.restaurantId === restaurant.id && (
        <View style={styles.floatingCartContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Checkout', { restaurant })}
            style={styles.floatingCartBtn}
            activeOpacity={0.9}
          >
            <View style={styles.cartCountBadge}>
              <Text style={styles.cartCountText}>
                {cart.items.reduce((sum, i) => sum + i.quantity, 0)}
              </Text>
            </View>
            <Text style={styles.viewCartText}>View Cart</Text>
            <Text style={styles.cartTotalText}>${cart.totalPrice.toFixed(2)}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerImageContainer: {
    position: 'relative',
    width: '100%',
    height: 220,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E1E24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  restaurantInfo: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#1E1E24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E1E24',
    lineHeight: 30,
  },
  restaurantCuisine: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#FF5C00',
    marginLeft: 4,
  },
  metaDivider: {
    fontSize: 14,
    color: '#CED4DA',
    marginHorizontal: 10,
  },
  metaText: {
    fontSize: 13,
    color: '#6C757D',
    fontWeight: '600',
  },
  menuContainer: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1E24',
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    shadowColor: '#1E1E24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  itemTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1E24',
    lineHeight: 21,
  },
  itemDesc: {
    fontSize: 12,
    color: '#8A8A8E',
    marginTop: 4,
    lineHeight: 18,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF5C00',
    marginTop: 8,
  },
  itemActionContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F1F3F5',
  },
  addBtn: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FF5C00',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    shadowColor: '#FF5C00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addBtnText: {
    color: '#FF5C00',
    fontSize: 12,
    fontWeight: '800',
  },
  qtyControl: {
    position: 'absolute',
    bottom: -10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FF5C00',
    borderRadius: 8,
    height: 32,
    shadowColor: '#1E1E24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  qtyBtn: {
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    color: '#FF5C00',
    fontWeight: '800',
    fontSize: 13,
    paddingHorizontal: 4,
  },
  floatingCartContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    shadowColor: '#FF5C00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  floatingCartBtn: {
    backgroundColor: '#FF5C00',
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  cartCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cartCountText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  viewCartText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  cartTotalText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
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
});
