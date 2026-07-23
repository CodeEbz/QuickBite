import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { loadStoredAuth } from '../store/slices/authSlice';

// Import Screens
import LoginScreen from '../app/(auth)/LoginScreen';
import RegisterScreen from '../app/(auth)/RegisterScreen';
import VerifyOtpScreen from '../app/(auth)/VerifyOtpScreen';
import CustomerHomeScreen from '../app/(customer)/CustomerHomeScreen';
import RestaurantMenuScreen from '../app/(customer)/RestaurantMenuScreen';
import MenuItemDetailScreen from '../app/(customer)/MenuItemDetailScreen';
import CheckoutScreen from '../app/(customer)/CheckoutScreen';
import OrderStatusScreen from '../app/(customer)/OrderStatusScreen';
import DriverHomeScreen from '../app/(driver)/DriverHomeScreen';
import RestaurantHomeScreen from '../app/(restaurant)/RestaurantHomeScreen';
import AdminHomeScreen from '../app/(admin)/AdminHomeScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const dispatch = useDispatch();
  const { isAuthenticated, role, isLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(loadStoredAuth());
  }, [dispatch]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7A30" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // Authentication Stack
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
        </>
      ) : (
        // Authenticated Role-Based Stack
        <>
          {role === 'CUSTOMER' && (
            <>
              <Stack.Screen name="CustomerHome" component={CustomerHomeScreen} />
              <Stack.Screen name="RestaurantMenu" component={RestaurantMenuScreen} />
              <Stack.Screen name="MenuItemDetail" component={MenuItemDetailScreen} />
              <Stack.Screen name="Checkout" component={CheckoutScreen} />
              <Stack.Screen name="OrderStatus" component={OrderStatusScreen} />
            </>
          )}
          {role === 'DRIVER' && (
            <Stack.Screen name="DriverHome" component={DriverHomeScreen} />
          )}
          {role === 'RESTAURANT' && (
            <Stack.Screen name="RestaurantHome" component={RestaurantHomeScreen} />
          )}
          {role === 'ADMIN' && (
            <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
          )}
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
});
