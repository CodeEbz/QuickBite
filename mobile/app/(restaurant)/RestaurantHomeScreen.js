import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { Ionicons } from '@expo/vector-icons';

export default function RestaurantHomeScreen() {
  const [isOpen, setIsOpen] = useState(true);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [orders, setOrders] = useState([
    {
      id: '#QB-9204',
      customer: 'Sarah Jenkins',
      items: '2x Cheese Burger, 1x Large Fries',
      status: 'PENDING',
      time: '5 min ago',
    },
    {
      id: '#QB-9201',
      customer: 'Michael Chang',
      items: '1x Spicy Pepperoni Pizza, 2x Soda Cane',
      status: 'PREPARING',
      time: '12 min ago',
    },
  ]);

  const handleLogout = () => {
    dispatch(logout());
  };

  const updateOrderStatus = (id, newStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id ? { ...order, status: newStatus } : order
      )
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.roleTag}>Restaurant Panel</Text>
          <Text style={styles.userName}>{user?.name || 'Restaurant Owner'}</Text>
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

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>
                {orders.filter((o) => o.status === 'PENDING').length}
              </Text>
              <Text style={styles.statLabel}>New</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>
                {orders.filter((o) => o.status === 'PREPARING').length}
              </Text>
              <Text style={styles.statLabel}>Preparing</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>
                {orders.filter((o) => o.status === 'READY').length}
              </Text>
              <Text style={styles.statLabel}>Ready</Text>
            </View>
          </View>
        </View>

        {/* Order queue */}
        <View style={styles.queueHeader}>
          <Text style={styles.sectionTitle}>Active Orders Queue</Text>
          <Ionicons name="funnel-outline" size={18} color="#6C757D" />
        </View>

        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={48} color="#CED4DA" />
            <Text style={styles.emptyStateText}>No active orders right now.</Text>
          </View>
        ) : (
          orders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>{order.id}</Text>
                <Text style={styles.orderTime}>{order.time}</Text>
              </View>

              <Text style={styles.customerName}>{order.customer}</Text>
              <Text style={styles.orderItems}>{order.items}</Text>

              <View style={styles.actionsRow}>
                {order.status === 'PENDING' && (
                  <TouchableOpacity
                    onPress={() => updateOrderStatus(order.id, 'PREPARING')}
                    style={[styles.actionBtn, styles.btnPrep]}
                  >
                    <Text style={styles.btnTextPrep}>Start Preparing</Text>
                  </TouchableOpacity>
                )}

                {order.status === 'PREPARING' && (
                  <TouchableOpacity
                    onPress={() => updateOrderStatus(order.id, 'READY')}
                    style={[styles.actionBtn, styles.btnReady]}
                  >
                    <Text style={styles.btnTextReady}>Mark as Ready</Text>
                  </TouchableOpacity>
                )}

                {order.status === 'READY' && (
                  <View style={styles.readyBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#2B8A3E" />
                    <Text style={styles.readyBadgeText}>Ready for pickup</Text>
                  </View>
                )}
              </View>
            </View>
          ))
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
    marginBottom: 24,
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
  textOpen: {
    color: '#2B8A3E',
  },
  textClosed: {
    color: '#D9383A',
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
    fontSize: 20,
    fontWeight: '800',
    color: '#1E1E24',
  },
  statLabel: {
    fontSize: 12,
    color: '#8A8A8E',
    fontWeight: '600',
    marginTop: 4,
  },
  queueHeader: {
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#8A8A8E',
    marginTop: 12,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#1E1E24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A8A8E',
  },
  orderTime: {
    fontSize: 12,
    color: '#6C757D',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1E24',
    marginBottom: 4,
  },
  orderItems: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionsRow: {
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
    paddingTop: 12,
  },
  actionBtn: {
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrep: {
    backgroundColor: '#FFF0E6',
  },
  btnTextPrep: {
    color: '#FF5C00',
    fontWeight: '700',
    fontSize: 13,
  },
  btnReady: {
    backgroundColor: '#FF5C00',
  },
  btnTextReady: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBFBEE',
    height: 38,
    borderRadius: 10,
  },
  readyBadgeText: {
    color: '#2B8A3E',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
  },
});
