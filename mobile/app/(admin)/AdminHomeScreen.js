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
import { logout } from '../../store/slices/authSlice';
import { Ionicons } from '@expo/vector-icons';

export default function AdminHomeScreen() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  const METRICS = [
    { label: 'Total Sales', value: '$12,450', icon: 'cash-outline', color: '#2B8A3E', bg: '#EBFBEE' },
    { label: 'Active Orders', value: '42', icon: 'cart-outline', color: '#FF5C00', bg: '#FFF0E6' },
    { label: 'Active Drivers', value: '18', icon: 'bicycle-outline', color: '#1A73E8', bg: '#E8F0FE' },
    { label: 'Restaurants', value: '31', icon: 'storefront-outline', color: '#681DA8', bg: '#F3E8FD' },
  ];

  const RECENT_LOGS = [
    { id: 1, type: 'ALERT', text: 'New restaurant registration request: "Gourmet Grill"', time: '2m ago' },
    { id: 2, type: 'INFO', text: 'Driver John Doe marked order #9201 as DELIVERED', time: '5m ago' },
    { id: 3, type: 'WARN', text: 'Database load spiked above 85% temporarily', time: '14m ago' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.roleTag}>Super Admin Mode</Text>
          <Text style={styles.userName}>{user?.name || 'Administrator'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#D9383A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Metric Grid */}
        <Text style={styles.sectionTitle}>System Analytics Overview</Text>
        <View style={styles.metricsGrid}>
          {METRICS.map((m, idx) => (
            <View key={idx} style={styles.metricCard}>
              <View style={[styles.iconContainer, { backgroundColor: m.bg }]}>
                <Ionicons name={m.icon} size={20} color={m.color} />
              </View>
              <Text style={styles.metricValue}>{m.value}</Text>
              <Text style={styles.metricLabel}>{m.label}</Text>
            </View>
          ))}
        </View>

        {/* Health status visual block */}
        <View style={styles.healthCard}>
          <View style={styles.healthHeader}>
            <Text style={styles.healthTitle}>Platform Server Health</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusBadgeText}>Optimal</Text>
            </View>
          </View>
          <Text style={styles.healthText}>
            Render service `quickbite-backend` responding at 99.8% SLA. Database replica synchronized.
          </Text>
        </View>

        {/* System Activity */}
        <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>
          Recent Activity Logs
        </Text>
        <View style={styles.logsCard}>
          {RECENT_LOGS.map((log) => (
            <View key={log.id} style={styles.logItem}>
              <View
                style={[
                  styles.logIndicator,
                  log.type === 'ALERT' && { backgroundColor: '#D9383A' },
                  log.type === 'WARN' && { backgroundColor: '#F0A30A' },
                  log.type === 'INFO' && { backgroundColor: '#1A73E8' },
                ]}
              />
              <View style={styles.logBody}>
                <Text style={styles.logText} numberOfLines={2}>
                  {log.text}
                </Text>
                <Text style={styles.logTime}>{log.time}</Text>
              </View>
            </View>
          ))}
        </View>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1E24',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '48%',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#1E1E24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E1E24',
  },
  metricLabel: {
    fontSize: 12,
    color: '#8A8A8E',
    fontWeight: '600',
    marginTop: 2,
  },
  healthCard: {
    backgroundColor: '#1E1E24',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#1E1E24',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  healthTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(43, 138, 62, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2B8A3E',
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    color: '#2B8A3E',
    fontWeight: '700',
  },
  healthText: {
    fontSize: 13,
    color: '#CED4DA',
    lineHeight: 18,
  },
  logsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#1E1E24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  logItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  logIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 12,
  },
  logBody: {
    flex: 1,
  },
  logText: {
    fontSize: 13,
    color: '#495057',
    lineHeight: 18,
  },
  logTime: {
    fontSize: 11,
    color: '#8A8A8E',
    marginTop: 4,
  },
});
