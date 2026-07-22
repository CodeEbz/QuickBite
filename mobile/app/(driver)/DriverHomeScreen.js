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
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { Ionicons } from '@expo/vector-icons';

export default function DriverHomeScreen() {
  const [isOnline, setIsOnline] = useState(true);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Animations
  const mapPulseAnim = useRef(new Animated.Value(1)).current;

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

  const handleLogout = () => {
    dispatch(logout());
  };

  const MOCK_JOBS = [
    {
      id: 1,
      restaurant: 'Burger Palace',
      distance: '1.2 miles away',
      payout: '$8.50 + $3.00 tip',
      pickup: '123 Diner Row',
      dropoff: '542 Oak Avenue',
    },
    {
      id: 2,
      restaurant: 'Pizza Di Roma',
      distance: '2.5 miles away',
      payout: '$12.00',
      pickup: '88 Italian Plaza',
      dropoff: '109 Pine Lane',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.roleTag}>Driver Mode</Text>
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
              <Text style={styles.statValue}>$48.50</Text>
              <Text style={styles.statLabel}>Today's Pay</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>4</Text>
              <Text style={styles.statLabel}>Deliveries</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>100%</Text>
              <Text style={styles.statLabel}>Accept Rate</Text>
            </View>
          </View>
        </View>

        {/* Map Simulator */}
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
              <Text style={styles.radarText}>Searching for orders nearby...</Text>
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

        {/* Nearby Jobs */}
        {isOnline && (
          <View style={styles.jobsSection}>
            <Text style={styles.sectionTitle}>Active Offers Nearby</Text>
            
            {MOCK_JOBS.map((job) => (
              <View key={job.id} style={styles.jobCard}>
                <View style={styles.jobHeader}>
                  <View style={styles.restaurantBadge}>
                    <Ionicons name="restaurant" size={14} color="#FF5C00" />
                    <Text style={styles.jobResName}>{job.restaurant}</Text>
                  </View>
                  <Text style={styles.jobPayout}>{job.payout}</Text>
                </View>

                <Text style={styles.jobDistance}>{job.distance}</Text>

                <View style={styles.routeContainer}>
                  <View style={styles.routeDots}>
                    <View style={styles.dotGreen} />
                    <View style={styles.dotLine} />
                    <View style={styles.dotRed} />
                  </View>
                  <View style={styles.routeDetails}>
                    <Text style={styles.routeText} numberOfLines={1}>
                      <Text style={styles.routeLabel}>Pick:</Text> {job.pickup}
                    </Text>
                    <View style={{ height: 16 }} />
                    <Text style={styles.routeText} numberOfLines={1}>
                      <Text style={styles.routeLabel}>Drop:</Text> {job.dropoff}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.acceptBtn} activeOpacity={0.9}>
                  <Text style={styles.acceptBtnText}>Accept Offer</Text>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            ))}
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
  jobsSection: {},
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1E24',
    marginBottom: 16,
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
  jobDistance: {
    fontSize: 12,
    color: '#8A8A8E',
    marginTop: 8,
    marginBottom: 14,
  },
  routeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  routeDots: {
    width: 12,
    alignItems: 'center',
    marginRight: 10,
    paddingVertical: 4,
  },
  dotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2B8A3E',
  },
  dotLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#CED4DA',
    marginVertical: 4,
  },
  dotRed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D9383A',
  },
  routeDetails: {
    flex: 1,
  },
  routeText: {
    fontSize: 13,
    color: '#495057',
  },
  routeLabel: {
    fontWeight: '700',
    color: '#1E1E24',
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
});
