import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { clearCart } from '../../store/slices/cartSlice';
import api from '../../lib/api';
import { Ionicons } from '@expo/vector-icons';

export default function CheckoutScreen({ route, navigation }) {
  const { restaurant } = route.params;
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);
  const [isLoading, setIsLoading] = useState(false);

  const subtotal = cart.totalPrice;
  const deliveryFee = 2.50;
  const tax = subtotal * 0.08;
  const total = subtotal + deliveryFee + tax;

  const handlePlaceOrder = async () => {
    setIsLoading(true);
    try {
      const orderPayload = {
        restaurantId: restaurant.id,
        items: cart.items.map((i) => ({
          itemName: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
        totalPrice: total,
      };

      const response = await api.post('/api/customer/orders', orderPayload);
      
      // Clear Redux Cart
      dispatch(clearCart());

      // Navigate to order status tracker
      navigation.navigate('OrderStatus', { order: response.data });
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Failed to place order. Please try again.';
      alert(message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E1E24" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Order</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Restaurant Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.restaurantLabel}>Ordering From</Text>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.restaurantCuisine}>{restaurant.cuisineType}</Text>
        </View>

        {/* Delivery Address */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Location</Text>
            <TouchableOpacity>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={20} color="#FF5C00" style={styles.addressIcon} />
            <Text style={styles.addressText}>123 Main Street, Cityville (Apt 4B)</Text>
          </View>
        </View>

        {/* Selected Items */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.itemsList}>
            {cart.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemQty}>{item.quantity}x</Text>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pricing Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Bill Details</Text>
          <View style={styles.billDetails}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Subtotal</Text>
              <Text style={styles.billValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Fee</Text>
              <Text style={styles.billValue}>${deliveryFee.toFixed(2)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Taxes & Fees</Text>
              <Text style={styles.billValue}>${tax.toFixed(2)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={[styles.billRow, { marginTop: 10 }]}>
              <Text style={styles.totalLabel}>Total Payout</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Pay & Place Order Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={isLoading || cart.items.length === 0}
          style={[styles.placeOrderBtn, isLoading && styles.placeOrderBtnDisabled]}
          activeOpacity={0.9}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>Confirm & Place Order</Text>
              <Ionicons name="card-outline" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </View>
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
    height: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1E24',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#1E1E24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  restaurantLabel: {
    fontSize: 11,
    color: '#FF5C00',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1E24',
    marginTop: 4,
  },
  restaurantCuisine: {
    fontSize: 13,
    color: '#6C757D',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1E24',
    marginBottom: 12,
  },
  editBtnText: {
    color: '#FF5C00',
    fontWeight: '700',
    fontSize: 13,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressIcon: {
    marginRight: 10,
  },
  addressText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
  itemsList: {},
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  itemQty: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF5C00',
    width: 32,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1E24',
  },
  billDetails: {},
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  billLabel: {
    fontSize: 13,
    color: '#6C757D',
  },
  billValue: {
    fontSize: 13,
    color: '#495057',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F3F5',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1E24',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FF5C00',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
  },
  placeOrderBtn: {
    backgroundColor: '#FF5C00',
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#FF5C00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  placeOrderBtnDisabled: {
    backgroundColor: '#FFAB80',
  },
  placeOrderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
