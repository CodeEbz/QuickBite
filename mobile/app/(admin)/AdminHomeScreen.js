import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import api from '../../lib/api';
import { Ionicons } from '@expo/vector-icons';

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'grid-outline' },
  { id: 'restaurants', label: 'Partners', icon: 'storefront-outline' },
  { id: 'orders', label: 'Orders', icon: 'receipt-outline' },
  { id: 'users', label: 'Users', icon: 'people-outline' },
];

const getApiErrorMessage = (error, fallback) =>
  error.response?.data?.error || error.response?.data?.message || error.message || fallback;

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

const orderItemsText = (items) => {
  if (!items || items.length === 0) return 'No items listed';
  return items.map((item) => `${item.quantity}x ${item.itemName}`).join(', ');
};

const statusStyleName = (status) => `status${status}`;

export default function AdminHomeScreen() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingKey, setUpdatingKey] = useState(null);
  const [error, setError] = useState(null);

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const fetchAdminData = async () => {
    try {
      setError(null);
      const [statsRes, restaurantsRes, ordersRes, usersRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/restaurants'),
        api.get('/api/admin/orders'),
        api.get('/api/admin/users'),
      ]);

      setStats(statsRes.data);
      setRestaurants(Array.isArray(restaurantsRes.data) ? restaurantsRes.data : []);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load admin dashboard.'));
      console.error('Admin dashboard load failed:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const derivedStats = useMemo(() => {
    const totalRevenue = stats?.totalRevenue ?? orders
      .filter((order) => order.status === 'DELIVERED')
      .reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);

    return [
      {
        label: 'Revenue',
        value: formatMoney(totalRevenue),
        icon: 'cash-outline',
        color: '#2B8A3E',
        bg: '#EBFBEE',
      },
      {
        label: 'Orders',
        value: String(stats?.totalOrders ?? orders.length),
        icon: 'cart-outline',
        color: '#FF5C00',
        bg: '#FFF0E6',
      },
      {
        label: 'Drivers',
        value: String(stats?.activeDrivers ?? users.filter((u) => u.role === 'DRIVER').length),
        icon: 'bicycle-outline',
        color: '#1A73E8',
        bg: '#E8F0FE',
      },
      {
        label: 'Pending',
        value: String(stats?.pendingApprovals ?? restaurants.filter((r) => r.status === 'PENDING_APPROVAL').length),
        icon: 'alert-circle-outline',
        color: '#C94B00',
        bg: '#FFF7E6',
      },
    ];
  }, [orders, restaurants, stats, users]);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAdminData();
  };

  const updateRestaurantStatus = async (restaurantId, status) => {
    const key = `restaurant-${restaurantId}`;
    setUpdatingKey(key);
    try {
      setError(null);
      const response = await api.put(`/api/admin/restaurants/${restaurantId}/status?status=${status}`);
      setRestaurants((prev) => prev.map((restaurant) => (
        restaurant.id === restaurantId ? response.data : restaurant
      )));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to update restaurant status.'));
    } finally {
      setUpdatingKey(null);
    }
  };

  const cancelOrder = async (orderId) => {
    const key = `order-${orderId}`;
    setUpdatingKey(key);
    try {
      setError(null);
      const response = await api.put(`/api/admin/orders/${orderId}/cancel`);
      setOrders((prev) => prev.map((order) => (order.id === orderId ? response.data : order)));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to cancel order.'));
    } finally {
      setUpdatingKey(null);
    }
  };

  const toggleUserVerification = async (userId) => {
    const key = `user-${userId}`;
    setUpdatingKey(key);
    try {
      setError(null);
      const response = await api.put(`/api/admin/users/${userId}/verify`);
      setUsers((prev) => prev.map((account) => (account.id === userId ? response.data : account)));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to update user verification.'));
    } finally {
      setUpdatingKey(null);
    }
  };

  const renderOverview = () => (
    <View style={styles.panel}>
      <View style={styles.metricsGrid}>
        {derivedStats.map((metric) => (
          <View key={metric.label} style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: metric.bg }]}>
              <Ionicons name={metric.icon} size={20} color={metric.color} />
            </View>
            <Text style={styles.metricValue} numberOfLines={1}>{metric.value}</Text>
            <Text style={styles.metricLabel}>{metric.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.healthCard}>
        <View style={styles.healthHeader}>
          <Text style={styles.healthTitle}>Platform Pulse</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>
        <Text style={styles.healthText}>
          {restaurants.length} restaurants, {users.length} users, and {orders.length} orders are visible to this mobile admin console.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Recent Orders</Text>
      {orders.slice(0, 4).map((order) => (
        <View key={order.id} style={styles.compactRow}>
          <View style={styles.compactIcon}>
            <Ionicons name="receipt-outline" size={18} color="#FF5C00" />
          </View>
          <View style={styles.compactBody}>
            <Text style={styles.compactTitle}>#QB-{order.id} • {order.customerName}</Text>
            <Text style={styles.compactMeta} numberOfLines={1}>{order.restaurant?.name || 'Restaurant'} · {order.status}</Text>
          </View>
          <Text style={styles.compactValue}>{formatMoney(order.totalPrice)}</Text>
        </View>
      ))}
    </View>
  );

  const renderRestaurants = () => (
    <View style={styles.panel}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Partner Restaurants</Text>
        <Text style={styles.countText}>{restaurants.length}</Text>
      </View>
      {restaurants.map((restaurant) => {
        const key = `restaurant-${restaurant.id}`;
        const isActive = restaurant.status === 'ACTIVE';
        return (
          <View key={restaurant.id} style={styles.restaurantCard}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardTitleBlock}>
                <Text style={styles.cardTitle} numberOfLines={1}>{restaurant.name}</Text>
                <Text style={styles.cardMeta} numberOfLines={1}>{restaurant.cuisineType || 'General'} · {restaurant.email}</Text>
              </View>
              <Text style={[styles.statusPill, styles[statusStyleName(restaurant.status)] || styles.statusDefault]}>
                {restaurant.status}
              </Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={() => updateRestaurantStatus(restaurant.id, isActive ? 'SUSPENDED' : 'ACTIVE')}
                disabled={updatingKey === key}
                style={[styles.actionBtn, isActive ? styles.dangerBtn : styles.primaryBtn]}
              >
                {updatingKey === key ? (
                  <ActivityIndicator color={isActive ? '#D9383A' : '#FFFFFF'} />
                ) : (
                  <Text style={isActive ? styles.dangerBtnText : styles.primaryBtnText}>
                    {isActive ? 'Suspend' : 'Activate'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderOrders = () => (
    <View style={styles.panel}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Live Orders</Text>
        <Text style={styles.countText}>{orders.length}</Text>
      </View>
      {orders.map((order) => {
        const key = `order-${order.id}`;
        const canCancel = !['DELIVERED', 'CANCELLED'].includes(order.status);
        return (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardTitleBlock}>
                <Text style={styles.cardTitle}>#QB-{order.id} • {formatMoney(order.totalPrice)}</Text>
                <Text style={styles.cardMeta} numberOfLines={1}>{order.restaurant?.name || 'Restaurant'} · {order.customerName}</Text>
              </View>
              <Text style={[styles.statusPill, styles[statusStyleName(order.status)] || styles.statusDefault]}>
                {order.status}
              </Text>
            </View>
            <Text style={styles.orderItems} numberOfLines={2}>{orderItemsText(order.items)}</Text>
            {canCancel && (
              <TouchableOpacity
                onPress={() => cancelOrder(order.id)}
                disabled={updatingKey === key}
                style={[styles.actionBtn, styles.dangerBtn, styles.fullAction]}
              >
                {updatingKey === key ? (
                  <ActivityIndicator color="#D9383A" />
                ) : (
                  <Text style={styles.dangerBtnText}>Cancel Order</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );

  const renderUsers = () => (
    <View style={styles.panel}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>User Directory</Text>
        <Text style={styles.countText}>{users.length}</Text>
      </View>
      {users.map((account) => {
        const key = `user-${account.id}`;
        return (
          <View key={account.id} style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Text style={styles.userInitial}>{(account.name || account.email || '?')[0].toUpperCase()}</Text>
            </View>
            <View style={styles.userBody}>
              <Text style={styles.cardTitle} numberOfLines={1}>{account.name || account.email}</Text>
              <Text style={styles.cardMeta} numberOfLines={1}>{account.email}</Text>
              <View style={styles.userMetaRow}>
                <Text style={styles.roleBadge}>{account.role}</Text>
                <Text style={[styles.verifyBadge, account.verified ? styles.verified : styles.unverified]}>
                  {account.verified ? 'Verified' : 'Unverified'}
                </Text>
              </View>
            </View>
            {account.role !== 'ADMIN' && (
              <TouchableOpacity
                onPress={() => toggleUserVerification(account.id)}
                disabled={updatingKey === key}
                style={styles.verifyBtn}
              >
                {updatingKey === key ? (
                  <ActivityIndicator color="#FF5C00" />
                ) : (
                  <Ionicons name="swap-horizontal" size={18} color="#FF5C00" />
                )}
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.roleTag}>Super Admin Mobile</Text>
          <Text style={styles.userName} numberOfLines={1}>{user?.name || 'Administrator'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#D9383A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#FF5C00" />
        }
      >
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="warning-outline" size={20} color="#D9383A" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchAdminData} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.tabs}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Ionicons name={tab.icon} size={17} color={active ? '#FFFFFF' : '#6C757D'} />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#FF5C00" style={styles.loading} />
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'restaurants' && renderRestaurants()}
            {activeTab === 'orders' && renderOrders()}
            {activeTab === 'users' && renderUsers()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEFF3',
  },
  headerText: {
    flex: 1,
    marginRight: 12,
  },
  roleTag: {
    fontSize: 11,
    color: '#FF5C00',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  userName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#171A1F',
    marginTop: 3,
  },
  logoutBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 42,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
  },
  tabActive: {
    backgroundColor: '#FF5C00',
  },
  tabText: {
    color: '#6C757D',
    fontSize: 10,
    fontWeight: '800',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  loading: {
    marginTop: 44,
  },
  panel: {
    gap: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '48%',
    padding: 14,
    marginBottom: 12,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 19,
    fontWeight: '800',
    color: '#171A1F',
  },
  metricLabel: {
    color: '#6C757D',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  healthCard: {
    backgroundColor: '#171A1F',
    borderRadius: 18,
    padding: 18,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  healthTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(43, 138, 62, 0.2)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#2B8A3E',
    marginRight: 6,
  },
  liveText: {
    color: '#55C46F',
    fontSize: 11,
    fontWeight: '800',
  },
  healthText: {
    color: '#CED4DA',
    fontSize: 13,
    lineHeight: 19,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#171A1F',
    fontSize: 17,
    fontWeight: '800',
  },
  countText: {
    color: '#6C757D',
    fontSize: 12,
    fontWeight: '800',
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
  },
  compactIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#FFF0E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  compactBody: {
    flex: 1,
  },
  compactTitle: {
    color: '#171A1F',
    fontSize: 13,
    fontWeight: '800',
  },
  compactMeta: {
    color: '#6C757D',
    fontSize: 12,
    marginTop: 3,
  },
  compactValue: {
    color: '#2B8A3E',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 10,
  },
  restaurantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitleBlock: {
    flex: 1,
  },
  cardTitle: {
    color: '#171A1F',
    fontSize: 15,
    fontWeight: '800',
  },
  cardMeta: {
    color: '#6C757D',
    fontSize: 12,
    marginTop: 4,
  },
  statusPill: {
    overflow: 'hidden',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 10,
    fontWeight: '800',
  },
  statusACTIVE: {
    color: '#2B8A3E',
    backgroundColor: '#EBFBEE',
  },
  statusPENDING_APPROVAL: {
    color: '#C94B00',
    backgroundColor: '#FFF7E6',
  },
  statusSUSPENDED: {
    color: '#D9383A',
    backgroundColor: '#FFF2F2',
  },
  statusPENDING: {
    color: '#C94B00',
    backgroundColor: '#FFF7E6',
  },
  statusPREPARING: {
    color: '#1A73E8',
    backgroundColor: '#E8F0FE',
  },
  statusREADY: {
    color: '#2B8A3E',
    backgroundColor: '#EBFBEE',
  },
  statusDELIVERING: {
    color: '#4D2A8A',
    backgroundColor: '#F3E8FD',
  },
  statusDELIVERED: {
    color: '#2B8A3E',
    backgroundColor: '#EBFBEE',
  },
  statusCANCELLED: {
    color: '#D9383A',
    backgroundColor: '#FFF2F2',
  },
  statusDefault: {
    color: '#6C757D',
    backgroundColor: '#F1F3F5',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
  actionBtn: {
    minHeight: 40,
    borderRadius: 11,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullAction: {
    marginTop: 14,
  },
  primaryBtn: {
    backgroundColor: '#FF5C00',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  dangerBtn: {
    backgroundColor: '#FFF2F2',
  },
  dangerBtnText: {
    color: '#D9383A',
    fontSize: 12,
    fontWeight: '800',
  },
  orderItems: {
    color: '#495057',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#FFF0E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },
  userInitial: {
    color: '#FF5C00',
    fontSize: 17,
    fontWeight: '800',
  },
  userBody: {
    flex: 1,
  },
  userMetaRow: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 7,
  },
  roleBadge: {
    overflow: 'hidden',
    borderRadius: 7,
    backgroundColor: '#F1F3F5',
    color: '#495057',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  verifyBadge: {
    overflow: 'hidden',
    borderRadius: 7,
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  verified: {
    color: '#2B8A3E',
    backgroundColor: '#EBFBEE',
  },
  unverified: {
    color: '#C94B00',
    backgroundColor: '#FFF7E6',
  },
  verifyBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#FFF0E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF2F2',
    borderWidth: 1,
    borderColor: '#FFE0E0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    color: '#D9383A',
    fontSize: 12,
    lineHeight: 17,
    marginHorizontal: 8,
  },
  retryBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  retryText: {
    color: '#D9383A',
    fontSize: 12,
    fontWeight: '800',
  },
});
