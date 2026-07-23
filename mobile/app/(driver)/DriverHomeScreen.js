import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import api from '../../lib/api';
import { Ionicons } from '@expo/vector-icons';

export default function DriverHomeScreen() {
  const [isOnline, setIsOnline] = useState(true);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Animations
  const mapPulseAnim = useRef(new Animated.Value(1)).current;

  // Radar Pulsing Animation
  useEffect(() => {
    if (isOnline) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(mapPulseAnim, {
            toValue: 1.08,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(mapPulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      mapPulseAnim.setValue(1);
    }
  }, [isOnline]);

  // Fetch Available & Active Orders
  const fetchDriverData = async () => {
    if (!isOnline) return;
    try {
      // 1. Fetch current active order
      const activeRes = await api.get('/api/driver/orders/my-active');
      setActiveOrder(activeRes.data);

      // 2. Fetch available orders nearby if not currently carrying an order
      if (!activeRes.data) {
        const availRes = await api.get('/api/driver/orders/available');
        setAvailableOrders(availRes.data);
      } else {
        setAvailableOrders([]);
      }
    } catch (err) {
      console.error('Error loading driver data:', err);
    }
  };

  useEffect(() => {
    fetchDriverData();
    const interval = setInterval(fetchDriverData, 5000);
    return () => clearInterval(interval);
  }, [isOnline]);

  const handleAcceptOrder = async (id) => {
    setIsLoading(true);
    try {
      const response = await api.put(`/api/driver/orders/${id}/accept`);
      setActiveOrder(response.data);
      setAvailableOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      alert('Failed to accept order. It may have been taken by another driver.');
      fetchDriverData();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteOrder = async (id) => {
    setIsLoading(true);
    try {
      await api.put(`/api/driver/orders/${id}/complete`);
      setActiveOrder(null);
      setCompletedCount((prev) => prev + 1);
      alert('Delivery Completed! Earnings updated.');
      fetchDriverData();
    } catch (err) {
      alert('Failed to complete delivery.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.roleTag}>Driver Courier</Text>
          <Text style={styles.userName}>{user?.name || 'Driver Partner'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#D9383A" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Dashboard */}
        <View style={styles.dashboardCard}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.statusLabel}>Availability Status</Text>
              <Text style={[styles.statusText, isOnline ? styles.textOnline : styles.textOffline]}>
                {isOnline ? 'Online - Receiving Jobs' : 'Offline'}
              </Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={setIsOnline}
              trackColor={{ false: '#767577', true: '#FFAB80' }}
              thumbColor={isOnline ? '#FF5C00' : '#f4f3f4'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>${(completedCount * 12.50).toFixed(2)}</Text>
              <Text style={styles.statLabel}>Today's Pay</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{completedCount}</Text>
              <Text style={styles.statLabel}>Deliveries</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>100%</Text>
              <Text style={styles.statLabel}>Accept Rate</Text>
            </View>
          </View>
        </View>

        {/* ACTIVE DELIVERY HUD */}
        {activeOrder ? (
          <View style={styles.activeHudCard}>
            <View style={styles.activeHudHeader}>
              <View style={styles.hudBadge}>
                <Ionicons name="navigate-circle" size={18} color="#FFFFFF" />
                <Text style={styles.hudBadgeText}>DELIVERY IN TRANSIT</Text>
              </View>
              <Text style={styles.activeOrderId}>#QB-{activeOrder.id}</Text>
            </View>

            <View style={styles.hudDetails}>
              <Text style={styles.hudResName}>{activeOrder.restaurant?.name || 'Restaurant'}</Text>
              <Text style={styles.hudCustomer}>Customer: <Text style={{ fontWeight: '800', color: '#1E1E24' }}>{activeOrder.customerName}</Text></Text>
              
              <View style={styles.itemsSummary}>
                <Text style={styles.itemsSummaryText}>
                  {activeOrder.items?.map((i) => `${i.quantity}x ${i.itemName}`).join(', ')}
                </Text>
              </View>

              <View style={styles.payoutRow}>
                <Text style={styles.payoutLabel}>Total Delivery Payout</Text>
                <Text style={styles.payoutValue}>${activeOrder.totalPrice.toFixed(2)}</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => handleCompleteOrder(activeOrder.id)}
              disabled={isLoading}
              style={styles.completeBtn}
              activeOpacity={0.9}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.completeBtnText}>Confirm Handed to Customer</Text>
                  <Ionicons name="checkmark-done-circle" size={22} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* MAP RADAR SIMULATOR */
          <View style={styles.mapSimulator}>
            {isOnline ? (
              <View style={styles.mapPulseContainer}>
                <Animated.View
                  style={[
                    styles.mapPulseRing,
                    { transform: [{ scale: mapPulseAnim }] },
                  ]}
                />
                <View style={styles.mapPulseDot}>
                  <Ionicons name="bicycle" size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.radarText}>Searching for customer orders nearby...</Text>
              </View>
            ) : (
              <View style={styles.mapPulseContainer}>
                <View style={[styles.mapPulseDot, { backgroundColor: '#8A8A8E' }]}>
                  <Ionicons name="moon" size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.radarText}>Go online to start earning</Text>
              </View>
            )}
          </View>
        )}

        {/* NEARBY AVAILABLE OFFERS */}
        {isOnline && !activeOrder && (
          <View style={styles.jobsSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Available Orders Nearby ({availableOrders.length})</Text>
              <TouchableOpacity onPress={fetchDriverData}>
                <Ionicons name="reload" size={18} color="#FF5C00" />
              </TouchableOpacity>
            </View>
            
            {availableOrders.length === 0 ? (
              <Text style={styles.emptyText}>No available orders right now. Orders placed by customers will appear here live!</Text>
            ) : (
              availableOrders.map((job) => (
                <View key={job.id} style={styles.jobCard}>
                  <View style={styles.jobHeader}>
                    <View style={styles.restaurantBadge}>
                      <Ionicons name="restaurant" size={14} color="#FF5C00" />
                      <Text style={styles.jobResName}>{job.restaurant?.name || 'Partner Restaurant'}</Text>
                    </View>
                    <Text style={styles.jobPayout}>${job.totalPrice.toFixed(2)}</Text>
                  </View>

                  <Text style={styles.jobCustomer}>Customer: {job.customerName}</Text>
                  <Text style={styles.jobItems} numberOfLines={2}>
                    {job.items?.map((i) => `${i.quantity}x ${i.itemName}`).join(', ')}
                  </Text>

                  <TouchableOpacity
                    onPress={() => handleAcceptOrder(job.id)}
                    disabled={isLoading}
                    style={styles.acceptBtn}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.acceptBtnText}>Accept Offer</Text>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
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
  roleTag: {
    fontSize: 11,
    color: '#FF5C00',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E1E24',
    marginTop: 2,
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
  dashboardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#1E1E24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 13,
    color: '#8A8A8E',
    fontWeight: '600',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  textOnline: {
    color: '#2B8A3E',
  },
  textOffline: {
    color: '#6C757D',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F3F5',
    marginVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1E24',
  },
  statLabel: {
    fontSize: 11,
    color: '#8A8A8E',
    fontWeight: '600',
    marginTop: 4,
  },
  mapSimulator: {
    backgroundColor: '#E9ECEF',
    borderRadius: 20,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#E2E5E9',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  mapPulseContainer: {
    alignItems: 'center',
  },
  mapPulseRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 92, 0, 0.15)',
  },
  mapPulseDot: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF5C00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF5C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 2,
  },
  radarText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6C757D',
    marginTop: 16,
  },
  activeHudCard: {
    backgroundColor: '#1E1E24',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#1E1E24',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  activeHudHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  hudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2B8A3E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  hudBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 6,
  },
  activeOrderId: {
    color: '#FF5C00',
    fontWeight: '800',
    fontSize: 14,
  },
  hudDetails: {
    backgroundColor: '#2A2A32',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  hudResName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  hudCustomer: {
    color: '#A0A0AB',
    fontSize: 13,
    marginTop: 4,
  },
  itemsSummary: {
    backgroundColor: '#1E1E24',
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
  },
  itemsSummaryText: {
    color: '#D4D4D8',
    fontSize: 12,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  payoutLabel: {
    color: '#A0A0AB',
    fontSize: 12,
  },
  payoutValue: {
    color: '#2B8A3E',
    fontSize: 18,
    fontWeight: '850',
  },
  completeBtn: {
    backgroundColor: '#2B8A3E',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  jobsSection: {},
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1E24',
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#1E1E24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#FF5C00',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restaurantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  jobResName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF5C00',
    marginLeft: 6,
  },
  jobPayout: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2B8A3E',
  },
  jobCustomer: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E1E24',
    marginTop: 8,
  },
  jobItems: {
    fontSize: 12,
    color: '#8A8A8E',
    marginTop: 4,
    marginBottom: 14,
  },
  acceptBtn: {
    backgroundColor: '#FF5C00',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyText: {
    color: '#8A8A8E',
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 13,
  },
});
