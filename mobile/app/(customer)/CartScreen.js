import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import {
  clearCart,
  decrementQuantity,
  incrementQuantity,
  removeFromCart,
} from '../../store/slices/cartSlice';
import { Ionicons } from '@expo/vector-icons';

export default function CartScreen({ navigation }) {
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);

  const subtotal = cart.totalPrice;
  const deliveryFee = cart.items.length > 0 ? 2.5 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + deliveryFee + tax;
  const restaurant = {
    id: cart.restaurantId,
    name: cart.restaurantName || 'Restaurant',
    cuisineType: 'QuickBite partner',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#1E1E24" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <TouchableOpacity
          onPress={() => dispatch(clearCart())}
          disabled={cart.items.length === 0}
          style={[styles.iconBtn, cart.items.length === 0 && styles.disabledBtn]}
        >
          <Ionicons name="trash-outline" size={20} color="#D9383A" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {cart.items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="cart-outline" size={40} color="#8A8A8E" />
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyText}>Add meals from a restaurant and come back here to review everything.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CustomerHome')} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Browse Restaurants</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.restaurantCard}>
              <Text style={styles.sectionLabel}>Ordering from</Text>
              <Text style={styles.restaurantName}>{cart.restaurantName}</Text>
            </View>

            {cart.items.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemMain}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>${Number(item.price).toFixed(2)} each</Text>
                  <TouchableOpacity onPress={() => dispatch(removeFromCart(item.id))} style={styles.removeBtn}>
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.qtyControl}>
                  <TouchableOpacity onPress={() => dispatch(decrementQuantity(item.id))} style={styles.qtyBtn}>
                    <Ionicons name="remove" size={16} color="#FF5C00" />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => dispatch(incrementQuantity(item.id))} style={styles.qtyBtn}>
                    <Ionicons name="add" size={16} color="#FF5C00" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={styles.billCard}>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Subtotal</Text>
                <Text style={styles.billValue}>${subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Delivery</Text>
                <Text style={styles.billValue}>${deliveryFee.toFixed(2)}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Taxes & fees</Text>
                <Text style={styles.billValue}>${tax.toFixed(2)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.billRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {cart.items.length > 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Checkout', { restaurant })}
            style={styles.checkoutBtn}
            activeOpacity={0.9}
          >
            <Text style={styles.checkoutText}>Checkout</Text>
            <Text style={styles.checkoutTotal}>${total.toFixed(2)}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: {
    height: 62,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: { opacity: 0.4 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1E1E24' },
  scrollContent: { padding: 20, paddingBottom: 120, gap: 14 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyTitle: { color: '#1E1E24', fontSize: 18, fontWeight: '900', marginTop: 12 },
  emptyText: { color: '#6C757D', fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 6 },
  primaryBtn: { backgroundColor: '#FF5C00', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12, marginTop: 18 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  restaurantCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18 },
  sectionLabel: { color: '#FF5C00', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  restaurantName: { color: '#1E1E24', fontSize: 18, fontWeight: '900', marginTop: 5 },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  itemMain: { flex: 1 },
  itemName: { color: '#1E1E24', fontSize: 15, fontWeight: '900' },
  itemPrice: { color: '#6C757D', fontSize: 12, marginTop: 4 },
  removeBtn: { alignSelf: 'flex-start', marginTop: 9 },
  removeText: { color: '#D9383A', fontSize: 12, fontWeight: '800' },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF5C00',
    borderRadius: 12,
    height: 38,
  },
  qtyBtn: { width: 34, height: 36, alignItems: 'center', justifyContent: 'center' },
  qtyText: { minWidth: 28, textAlign: 'center', color: '#FF5C00', fontWeight: '900' },
  billCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, gap: 9 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between' },
  billLabel: { color: '#6C757D', fontSize: 13 },
  billValue: { color: '#1E1E24', fontSize: 13, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#F1F3F5', marginVertical: 6 },
  totalLabel: { color: '#1E1E24', fontSize: 16, fontWeight: '900' },
  totalValue: { color: '#FF5C00', fontSize: 17, fontWeight: '900' },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F3F5' },
  checkoutBtn: { minHeight: 56, borderRadius: 16, backgroundColor: '#FF5C00', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 },
  checkoutText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  checkoutTotal: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
});
