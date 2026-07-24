import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { clearCart } from '../../store/slices/cartSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../lib/api';
import * as ExpoLinking from 'expo-linking';
import { getDefaultAddress } from '../../lib/addressStorage';
import { Ionicons } from '@expo/vector-icons';

export default function CheckoutScreen({ route, navigation }) {
  const { restaurant } = route.params;
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [payment, setPayment] = useState(null);
  const [paymentBrowserOpened, setPaymentBrowserOpened] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [promoCode, setPromoCode] = useState(null);
  const [isFirstOrder, setIsFirstOrder] = useState(false);

  const subtotal = cart.totalPrice;
  const deliveryFee = 2.50;
  const discount = promoCode === 'FIRST50' && isFirstOrder ? subtotal * 0.5 : 0;
  const discountedSubtotal = subtotal - discount;
  const tax = discountedSubtotal * 0.08;
  const total = discountedSubtotal + deliveryFee + tax;

  useEffect(() => {
    getDefaultAddress().then(setDeliveryAddress).catch(() => {});
    AsyncStorage.getItem('quickbite_promo_code').then(setPromoCode).catch(() => {});
    api.get('/api/customer/orders')
      .then((response) => setIsFirstOrder(Array.isArray(response.data) && response.data.length === 0))
      .catch(() => setIsFirstOrder(false));
  }, []);

  const buildOrderPayload = () => ({
    restaurantId: restaurant.id,
    items: cart.items.map((i) => ({
      menuItemId: i.id,
      itemName: i.name,
      quantity: i.quantity,
      price: i.price,
    })),
    totalPrice: total,
    promoCode: discount > 0 ? promoCode : null,
    callbackUrl: ExpoLinking.createURL('payment'),
  });

  const verifyPayment = async (silent = false) => {
    if (!payment?.reference || isVerifying) {
      if (!silent) alert('Start Paystack checkout before verifying payment.');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await api.post('/api/customer/payments/verify', {
        reference: payment.reference,
        order: buildOrderPayload(),
      });

      dispatch(clearCart());
      setPayment(null);
      setPaymentBrowserOpened(false);
      await AsyncStorage.removeItem('quickbite_promo_code');
      navigation.navigate('OrderStatus', { order: response.data });
    } catch (err) {
      if (!silent) {
        const message = err.response?.data?.error || err.message || 'Payment is not verified yet. Please complete checkout and try again.';
        alert(message);
      }
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    const linkSubscription = Linking.addEventListener('url', ({ url }) => {
      if (url?.includes('payment')) {
        verifyPayment(true);
      }
    });

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && paymentBrowserOpened && payment?.reference) {
        verifyPayment(true);
      }
    });

    return () => {
      linkSubscription.remove();
      appStateSubscription.remove();
    };
  }, [payment?.reference, paymentBrowserOpened, isVerifying]);

  const handleStartPayment = async () => {
    if (!deliveryAddress?.trim()) {
      alert('Please add your delivery address before checkout.');
      navigation.navigate('CustomerHome', { openProfile: true });
      return;
    }

    if (payment?.authorizationUrl) {
      setPaymentBrowserOpened(true);
      await Linking.openURL(payment.authorizationUrl);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/api/customer/payments/initialize', buildOrderPayload());
      setPayment(response.data);
      setPaymentBrowserOpened(true);
      await Linking.openURL(response.data.authorizationUrl);
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Failed to start payment. Please try again.';
      alert(message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPayment = async () => verifyPayment(false);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
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
            <TouchableOpacity onPress={() => navigation.navigate('CustomerHome', { openProfile: true })}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={20} color="#FF5C00" style={styles.addressIcon} />
            <Text style={styles.addressText}>{deliveryAddress || 'No address saved yet. Tap Edit to add one.'}</Text>
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
            {discount > 0 ? (
              <View style={styles.billRow}>
                <Text style={styles.discountLabel}>FIRST50 Discount</Text>
                <Text style={styles.discountValue}>-${discount.toFixed(2)}</Text>
              </View>
            ) : null}
            {promoCode === 'FIRST50' && !isFirstOrder ? (
              <Text style={styles.promoNote}>FIRST50 is only valid on your first order.</Text>
            ) : null}
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

        <View style={styles.paymentCard}>
          <View style={styles.paymentIconWrap}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#0E7C66" />
          </View>
          <View style={styles.paymentCopy}>
            <Text style={styles.paymentTitle}>Secure Paystack checkout</Text>
            <Text style={styles.paymentText}>
              Pay in Paystack. QuickBite will verify automatically when you return.
            </Text>
            {payment?.reference ? (
              <Text style={styles.referenceText}>Reference: {payment.reference}</Text>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {/* Pay & Place Order Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={handleStartPayment}
          disabled={isLoading || isVerifying || cart.items.length === 0}
          style={[styles.placeOrderBtn, isLoading && styles.placeOrderBtnDisabled]}
          activeOpacity={0.9}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>{payment ? 'Reopen Paystack' : 'Pay with Paystack'}</Text>
              <Ionicons name="card-outline" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
        {payment?.reference ? (
          <TouchableOpacity
            onPress={handleVerifyPayment}
            disabled={isVerifying || isLoading}
            style={[styles.verifyBtn, isVerifying && styles.verifyBtnDisabled]}
            activeOpacity={0.9}
          >
            {isVerifying ? (
              <ActivityIndicator size="small" color="#0E7C66" />
            ) : (
              <>
                <Text style={styles.verifyBtnText}>Verify Payment & Place Order</Text>
                <Ionicons name="checkmark-circle-outline" size={20} color="#0E7C66" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        ) : null}
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
    paddingBottom: 160,
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
  discountLabel: {
    fontSize: 13,
    color: '#2B8A3E',
    fontWeight: '800',
  },
  discountValue: {
    fontSize: 13,
    color: '#2B8A3E',
    fontWeight: '900',
  },
  promoNote: {
    color: '#8A8A8E',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
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
  paymentCard: {
    backgroundColor: '#EFFFF9',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C6F3E7',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  paymentIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentCopy: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0A4F42',
  },
  paymentText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#32695D',
    marginTop: 4,
  },
  referenceText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0E7C66',
    marginTop: 10,
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
  verifyBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#0E7C66',
    marginTop: 12,
  },
  verifyBtnDisabled: {
    opacity: 0.7,
  },
  verifyBtnText: {
    color: '#0E7C66',
    fontSize: 15,
    fontWeight: '800',
  },
});
