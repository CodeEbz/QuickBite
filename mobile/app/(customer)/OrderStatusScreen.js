import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../lib/api';
import { Ionicons } from '@expo/vector-icons';

export default function OrderStatusScreen({ route, navigation }) {
  const { order: initialOrder } = route.params;
  const [order, setOrder] = useState(initialOrder);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const fetchOrderStatus = async () => {
    try {
      const response = await api.get(`/api/customer/orders/${initialOrder.id}`);
      setOrder(response.data);
    } catch (err) {
      console.error('Error fetching order status:', err);
    }
  };

  useEffect(() => {
    fetchOrderStatus();
    // Start polling status
    const interval = setInterval(fetchOrderStatus, 5000);

    // Radar pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => clearInterval(interval);
  }, []);

  const getStepStatus = (step) => {
    // Steps: 1 (PLACED), 2 (PREPARING), 3 (DELIVERING), 4 (DELIVERED)
    const status = order.status;

    if (status === 'CANCELLED') return 'CANCELLED';

    if (step === 1) return 'COMPLETED'; // Always completed if order exists

    if (step === 2) {
      if (status === 'PENDING') return 'ACTIVE';
      if (status === 'PREPARING') return 'ACTIVE';
      return 'COMPLETED'; // Status is DELIVERING or DELIVERED
    }

    if (step === 3) {
      if (status === 'PENDING' || status === 'PREPARING' || status === 'READY') return status === 'READY' ? 'ACTIVE' : 'INACTIVE';
      if (status === 'DELIVERING') return 'ACTIVE';
      return 'COMPLETED'; // Status is DELIVERED
    }

    if (step === 4) {
      if (status === 'DELIVERED') return 'COMPLETED';
      return 'INACTIVE';
    }

    return 'INACTIVE';
  };

  const getStepStyles = (step) => {
    const state = getStepStatus(step);
    if (state === 'COMPLETED') {
      return {
        badgeBg: styles.badgeSuccess,
        badgeText: <Ionicons name="checkmark" size={16} color="#FFFFFF" />,
        textTitle: styles.titleActive,
      };
    }
    if (state === 'ACTIVE') {
      return {
        badgeBg: styles.badgeActive,
        badgeText: <Animated.View style={[styles.activeDot, { transform: [{ scale: pulseAnim }] }]} />,
        textTitle: styles.titleActive,
      };
    }
    if (state === 'CANCELLED') {
      return {
        badgeBg: styles.badgeCancelled,
        badgeText: <Ionicons name="close" size={16} color="#FFFFFF" />,
        textTitle: styles.titleCancelled,
      };
    }
    return {
      badgeBg: styles.badgeInactive,
      badgeText: null,
      textTitle: styles.titleInactive,
    };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Track Order</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Status Radar Card */}
        <View style={styles.radarCard}>
          <Text style={styles.radarLabel}>Order Status</Text>
          <Text style={styles.radarStatus}>
            {order.status === 'PENDING' && 'Waiting for Restaurant...'}
            {order.status === 'PREPARING' && 'Chef is Preparing Your Food!'}
            {order.status === 'READY' && 'Ready for Courier Pickup!'}
            {order.status === 'DELIVERING' && 'Courier is on the Way!'}
            {order.status === 'DELIVERED' && 'Order Delivered. Enjoy!'}
            {order.status === 'CANCELLED' && 'Order Cancelled.'}
          </Text>
          <Text style={styles.radarSub}>Estimated delivery time: 20-30 mins</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Order</Text>
            <Text style={styles.summaryValue}>#QB-{order.id}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Restaurant</Text>
            <Text style={styles.summaryValue}>{order.restaurant?.name || 'Restaurant'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Driver</Text>
            <Text style={styles.summaryValue}>{order.driverName || 'Not assigned yet'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Courier GPS</Text>
            <Text style={styles.summaryValue}>
              {order.driverLatitude && order.driverLongitude
                ? `${Number(order.driverLatitude).toFixed(4)}, ${Number(order.driverLongitude).toFixed(4)}`
                : 'Waiting for live location'}
            </Text>
          </View>
          {order.driverLocationUpdatedAt ? (
            <Text style={styles.liveTrackingText}>
              Live tracking updated {new Date(order.driverLocationUpdatedAt).toLocaleTimeString()}
            </Text>
          ) : null}
          <Text style={styles.itemsText} numberOfLines={3}>
            {order.items?.map((item) => `${item.quantity}x ${item.itemName}`).join(', ') || 'Items loading...'}
          </Text>
        </View>

        {/* Timeline */}
        <View style={styles.timelineCard}>
          {order.status === 'CANCELLED' ? (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineBadge, styles.badgeCancelled]}>
                <Ionicons name="close" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.timelineDetails}>
                <Text style={styles.titleCancelled}>Order Cancelled</Text>
                <Text style={styles.descActive}>The order was cancelled by the platform or restaurant.</Text>
              </View>
            </View>
          ) : (
            <>
              {/* Step 1: Placed */}
              <View style={styles.timelineItem}>
                <View style={[styles.timelineBadge, getStepStyles(1).badgeBg]}>
                  {getStepStyles(1).badgeText}
                </View>
                <View style={styles.timelineDetails}>
                  <Text style={getStepStyles(1).textTitle}>Order Placed</Text>
                  <Text style={styles.descActive}>We have received your order request.</Text>
                </View>
                <View style={[styles.timelineLine, getStepStatus(2) === 'INACTIVE' ? styles.lineInactive : styles.lineActive]} />
              </View>

              {/* Step 2: Preparing */}
              <View style={styles.timelineItem}>
                <View style={[styles.timelineBadge, getStepStyles(2).badgeBg]}>
                  {getStepStyles(2).badgeText}
                </View>
                <View style={styles.timelineDetails}>
                  <Text style={getStepStyles(2).textTitle}>Preparing Food</Text>
                  <Text style={styles.descActive}>Chef is baking, wrapping, and prepping your meal.</Text>
                </View>
                <View style={[styles.timelineLine, getStepStatus(3) === 'INACTIVE' ? styles.lineInactive : styles.lineActive]} />
              </View>

              {/* Step 3: Delivering */}
              <View style={styles.timelineItem}>
                <View style={[styles.timelineBadge, getStepStyles(3).badgeBg]}>
                  {getStepStyles(3).badgeText}
                </View>
                <View style={styles.timelineDetails}>
                  <Text style={getStepStyles(3).textTitle}>{order.status === 'READY' ? 'Ready for Pickup' : 'Out for Delivery'}</Text>
                  <Text style={styles.descActive}>Courier assignment and pickup status update here live.</Text>
                </View>
                <View style={[styles.timelineLine, getStepStatus(4) === 'INACTIVE' ? styles.lineInactive : styles.lineActive]} />
              </View>

              {/* Step 4: Delivered */}
              <View style={styles.timelineItem}>
                <View style={[styles.timelineBadge, getStepStyles(4).badgeBg]}>
                  {getStepStyles(4).badgeText}
                </View>
                <View style={styles.timelineDetails}>
                  <Text style={getStepStyles(4).textTitle}>Delivered</Text>
                  <Text style={styles.descActive}>Order arrived safely at your doorstep!</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Back Button */}
        <TouchableOpacity
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'CustomerHome' }] })}
          style={styles.homeBtn}
          activeOpacity={0.9}
        >
          <Text style={styles.homeBtnText}>Back to Home</Text>
          <Ionicons name="home-outline" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1E24',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  radarCard: {
    backgroundColor: '#FF5C00',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#FF5C00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 24,
  },
  radarLabel: {
    color: '#FFFFFF',
    opacity: 0.8,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  radarStatus: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6,
  },
  radarSub: {
    color: '#FFFFFF',
    opacity: 0.9,
    fontSize: 13,
    marginTop: 12,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
  },
  summaryLabel: {
    color: '#6C757D',
    fontSize: 13,
    fontWeight: '700',
  },
  summaryValue: {
    color: '#1E1E24',
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
    textAlign: 'right',
  },
  itemsText: {
    color: '#495057',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
  },
  liveTrackingText: {
    color: '#2B8A3E',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#1E1E24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 1,
    marginBottom: 32,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 36,
    position: 'relative',
  },
  timelineBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  badgeInactive: {
    backgroundColor: '#F1F3F5',
    borderWidth: 2,
    borderColor: '#CED4DA',
  },
  badgeActive: {
    backgroundColor: '#FFF0E6',
    borderWidth: 2,
    borderColor: '#FF5C00',
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF5C00',
  },
  badgeSuccess: {
    backgroundColor: '#2B8A3E',
  },
  badgeCancelled: {
    backgroundColor: '#D9383A',
  },
  timelineDetails: {
    marginLeft: 16,
    flex: 1,
  },
  titleInactive: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8A8A8E',
  },
  titleActive: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1E24',
  },
  titleCancelled: {
    fontSize: 15,
    fontWeight: '800',
    color: '#D9383A',
  },
  descActive: {
    fontSize: 12,
    color: '#8A8A8E',
    marginTop: 4,
    lineHeight: 18,
  },
  timelineLine: {
    position: 'absolute',
    left: 13,
    top: 28,
    width: 2,
    height: '100%',
    zIndex: 1,
  },
  lineInactive: {
    backgroundColor: '#CED4DA',
  },
  lineActive: {
    backgroundColor: '#2B8A3E',
  },
  homeBtn: {
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
  homeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
