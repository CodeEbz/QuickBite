import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import api from '../../lib/api';
import { Ionicons } from '@expo/vector-icons';

const TABS = [
  { id: 'orders', label: 'Orders', icon: 'receipt-outline' },
  { id: 'menu', label: 'Menu', icon: 'fast-food-outline' },
  { id: 'profile', label: 'Profile', icon: 'storefront-outline' },
];

const getApiErrorMessage = (error, fallback) =>
  error.response?.data?.error || error.response?.data?.message || error.message || fallback;

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

const orderItemsText = (items) => {
  if (!items || items.length === 0) return 'No items listed';
  return items.map((item) => `${item.quantity}x ${item.itemName}`).join(', ');
};

export default function RestaurantHomeScreen() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [error, setError] = useState(null);

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const fetchMerchantData = async () => {
    try {
      setError(null);
      const [profileRes, ordersRes, menuRes] = await Promise.all([
        api.get('/api/merchant/profile'),
        api.get('/api/merchant/orders'),
        api.get('/api/merchant/menu'),
      ]);

      setProfile(profileRes.data);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setMenuItems(Array.isArray(menuRes.data) ? menuRes.data : []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load restaurant dashboard.'));
      console.error('Restaurant dashboard load failed:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMerchantData();
    const interval = setInterval(fetchMerchantData, 8000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const pending = orders.filter((order) => order.status === 'PENDING').length;
    const preparing = orders.filter((order) => order.status === 'PREPARING').length;
    const ready = orders.filter((order) => order.status === 'READY').length;
    const revenue = orders
      .filter((order) => order.status !== 'CANCELLED')
      .reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);

    return { pending, preparing, ready, revenue };
  }, [orders]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchMerchantData();
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const updateOrderStatus = async (id, newStatus) => {
    setUpdatingOrderId(id);
    try {
      setError(null);
      const response = await api.put(`/api/merchant/orders/${id}/status?status=${newStatus}`);
      setOrders((prev) => prev.map((order) => (order.id === id ? response.data : order)));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to update order status.'));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const renderOrderAction = (order) => {
    if (order.status === 'PENDING') {
      return (
        <TouchableOpacity
          onPress={() => updateOrderStatus(order.id, 'PREPARING')}
          disabled={updatingOrderId === order.id}
          style={[styles.orderActionBtn, styles.actionSoft]}
        >
          <Text style={styles.actionSoftText}>Accept & Prepare</Text>
        </TouchableOpacity>
      );
    }

    if (order.status === 'PREPARING') {
      return (
        <TouchableOpacity
          onPress={() => updateOrderStatus(order.id, 'READY')}
          disabled={updatingOrderId === order.id}
          style={[styles.orderActionBtn, styles.actionPrimary]}
        >
          <Text style={styles.actionPrimaryText}>Mark Ready</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.readyBadge}>
        <Ionicons name="checkmark-circle" size={16} color="#2B8A3E" />
        <Text style={styles.readyBadgeText}>
          {order.status === 'READY' ? 'Ready for pickup' : order.status}
        </Text>
      </View>
    );
  };

  const renderOrders = () => (
    <View style={styles.panel}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Kitchen Queue</Text>
        <TouchableOpacity onPress={fetchMerchantData} style={styles.iconBtn}>
          <Ionicons name="reload" size={18} color="#FF5C00" />
        </TouchableOpacity>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={34} color="#8A8A8E" />
          <Text style={styles.emptyTitle}>No active orders</Text>
          <Text style={styles.emptyText}>Customer orders will appear here automatically.</Text>
        </View>
      ) : (
        orders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderTopRow}>
              <Text style={styles.orderId}>#QB-{order.id}</Text>
              <Text style={[styles.statusPill, styles[`status${order.status}`] || styles.statusDefault]}>
                {order.status}
              </Text>
            </View>
            <Text style={styles.customerName}>{order.customerName}</Text>
            <Text style={styles.orderItems} numberOfLines={3}>
              {orderItemsText(order.items)}
            </Text>
            <View style={styles.orderFooter}>
              <Text style={styles.orderTotal}>{formatMoney(order.totalPrice)}</Text>
              {updatingOrderId === order.id ? (
                <ActivityIndicator color="#FF5C00" />
              ) : (
                renderOrderAction(order)
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderMenu = () => (
    <View style={styles.panel}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Menu Preview</Text>
        <Text style={styles.itemCount}>{menuItems.length} items</Text>
      </View>

      {menuItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="fast-food-outline" size={34} color="#8A8A8E" />
          <Text style={styles.emptyTitle}>No menu items yet</Text>
          <Text style={styles.emptyText}>Use the web portal to add full menu details.</Text>
        </View>
      ) : (
        menuItems.map((item) => (
          <View key={item.id} style={styles.menuCard}>
            <Image source={{ uri: item.image }} style={styles.menuImage} />
            <View style={styles.menuBody}>
              <Text style={styles.menuName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.menuDesc} numberOfLines={2}>{item.description || item.category || 'Menu item'}</Text>
              <Text style={styles.menuPrice}>{formatMoney(item.price)}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderProfile = () => (
    <View style={styles.panel}>
      <Text style={styles.sectionTitle}>Restaurant Profile</Text>
      <View style={styles.profileCard}>
        {profile?.image ? <Image source={{ uri: profile.image }} style={styles.profileImage} /> : null}
        <Text style={styles.profileName}>{profile?.name || 'Restaurant'}</Text>
        <Text style={styles.profileMeta}>{profile?.cuisineType || 'General cuisine'}</Text>
        <View style={styles.profileGrid}>
          <View style={styles.profileMetric}>
            <Text style={styles.profileMetricValue}>{profile?.rating > 0 ? profile.rating.toFixed(1) : 'N/A'}</Text>
            <Text style={styles.profileMetricLabel}>Rating</Text>
          </View>
          <View style={styles.profileMetric}>
            <Text style={styles.profileMetricValue}>{profile?.status || 'PENDING'}</Text>
            <Text style={styles.profileMetricLabel}>Status</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.roleTag}>Merchant Mobile</Text>
          <Text style={styles.userName} numberOfLines={1}>
            {profile?.name || user?.name || 'Restaurant Owner'}
          </Text>
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
        <View style={styles.heroCard}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.statusLabel}>Store Status</Text>
              <Text style={[styles.statusText, isOpen ? styles.textOpen : styles.textClosed]}>
                {isOpen ? 'Open & Accepting Orders' : 'Closed'}
              </Text>
            </View>
            <Switch
              value={isOpen}
              onValueChange={setIsOpen}
              trackColor={{ false: '#767577', true: '#FFAB80' }}
              thumbColor={isOpen ? '#FF5C00' : '#f4f3f4'}
            />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{stats.pending}</Text>
              <Text style={styles.statLabel}>New</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{stats.preparing}</Text>
              <Text style={styles.statLabel}>Cooking</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{stats.ready}</Text>
              <Text style={styles.statLabel}>Ready</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statValueSmall}>{formatMoney(stats.revenue)}</Text>
              <Text style={styles.statLabel}>Sales</Text>
            </View>
          </View>
        </View>

        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="warning-outline" size={20} color="#D9383A" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchMerchantData} style={styles.retryBtn}>
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
            {activeTab === 'orders' && renderOrders()}
            {activeTab === 'menu' && renderMenu()}
            {activeTab === 'profile' && renderProfile()}
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
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  statusLabel: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '700',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  textOpen: {
    color: '#2B8A3E',
  },
  textClosed: {
    color: '#D9383A',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 16,
  },
  statCol: {
    flex: 1,
    minHeight: 62,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#171A1F',
  },
  statValueSmall: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171A1F',
  },
  statLabel: {
    fontSize: 11,
    color: '#6C757D',
    fontWeight: '700',
    marginTop: 3,
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    minHeight: 42,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  tabActive: {
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
  loading: {
    marginTop: 40,
  },
  panel: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#171A1F',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF0E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemCount: {
    color: '#6C757D',
    fontSize: 12,
    fontWeight: '700',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  orderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  orderId: {
    color: '#6C757D',
    fontSize: 13,
    fontWeight: '800',
  },
  statusPill: {
    overflow: 'hidden',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 10,
    fontWeight: '800',
  },
  statusPENDING: {
    color: '#C94B00',
    backgroundColor: '#FFF0E6',
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
  statusDefault: {
    color: '#6C757D',
    backgroundColor: '#F1F3F5',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171A1F',
  },
  orderItems: {
    marginTop: 5,
    color: '#495057',
    fontSize: 13,
    lineHeight: 19,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
    marginTop: 14,
    paddingTop: 12,
    gap: 12,
  },
  orderTotal: {
    color: '#171A1F',
    fontSize: 16,
    fontWeight: '800',
  },
  orderActionBtn: {
    minHeight: 40,
    borderRadius: 11,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionSoft: {
    backgroundColor: '#FFF0E6',
  },
  actionSoftText: {
    color: '#FF5C00',
    fontSize: 12,
    fontWeight: '800',
  },
  actionPrimary: {
    backgroundColor: '#FF5C00',
  },
  actionPrimaryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    borderRadius: 11,
    paddingHorizontal: 12,
    backgroundColor: '#EBFBEE',
  },
  readyBadgeText: {
    color: '#2B8A3E',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
  },
  menuCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  menuImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#ECEFF3',
  },
  menuBody: {
    flex: 1,
    marginLeft: 12,
  },
  menuName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171A1F',
  },
  menuDesc: {
    color: '#6C757D',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  menuPrice: {
    color: '#FF5C00',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 5,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: 140,
    borderRadius: 14,
    backgroundColor: '#ECEFF3',
    marginBottom: 14,
  },
  profileName: {
    color: '#171A1F',
    fontSize: 20,
    fontWeight: '800',
  },
  profileMeta: {
    color: '#6C757D',
    fontSize: 13,
    marginTop: 4,
  },
  profileGrid: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 16,
  },
  profileMetric: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  profileMetricValue: {
    color: '#171A1F',
    fontSize: 15,
    fontWeight: '800',
  },
  profileMetricLabel: {
    color: '#6C757D',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 10,
    color: '#171A1F',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    color: '#6C757D',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 5,
  },
});
