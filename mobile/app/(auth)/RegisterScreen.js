import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearErrors, resetRegisterStatus } from '../../store/slices/authSlice';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ROLES = [
  { id: 'CUSTOMER', label: 'Customer', desc: 'Order delicious food', icon: 'cart-outline' },
  { id: 'DRIVER', label: 'Driver', desc: 'Deliver & earn money', icon: 'bicycle-outline' },
  { id: 'RESTAURANT', label: 'Restaurant', desc: 'Manage food & orders', icon: 'storefront-outline' },
  { id: 'ADMIN', label: 'Admin', desc: 'Manage the platform', icon: 'shield-checkmark-outline' },
];

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('CUSTOMER');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null); // 'name' | 'email' | 'password'

  const dispatch = useDispatch();
  const { isLoading, error, registerStatus } = useSelector((state) => state.auth);
  const insets = useSafeAreaInsets();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Track animations for each role button
  const cardScaleCustomer = useRef(new Animated.Value(1)).current;
  const cardScaleDriver = useRef(new Animated.Value(1)).current;
  const cardScaleRest = useRef(new Animated.Value(1)).current;
  const cardScaleAdmin = useRef(new Animated.Value(1)).current;

  const getCardScale = (roleId) => {
    switch (roleId) {
      case 'CUSTOMER': return cardScaleCustomer;
      case 'DRIVER': return cardScaleDriver;
      case 'RESTAURANT': return cardScaleRest;
      case 'ADMIN': return cardScaleAdmin;
      default: return new Animated.Value(1);
    }
  };

  useEffect(() => {
    dispatch(clearErrors());
    dispatch(resetRegisterStatus());

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [dispatch]);

  // Watch for successful registration and route to OTP
  useEffect(() => {
    if (registerStatus === 'success') {
      navigation.navigate('VerifyOtp');
    }
  }, [registerStatus, navigation]);

  const handleRegister = () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      return;
    }
    dispatch(
      register({
        name: name.trim(),
        email: email.trim(),
        password,
        role: selectedRole,
      })
    );
  };

  const selectRole = (roleId) => {
    setSelectedRole(roleId);
    
    // Scale up-down animation on click
    const scaleRef = getCardScale(roleId);
    Animated.sequence([
      Animated.timing(scaleRef, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleRef, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingTop: Math.max(insets.top + 14, 28), paddingBottom: Math.max(insets.bottom + 24, 36) },
        ]}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <Animated.View
          style={[
            styles.innerContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E1E24" />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={styles.titleText}>Create Account</Text>
            <Text style={styles.subtitleText}>Join QuickBite and start exploring!</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={20} color="#D9383A" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Name Input */}
            <View
              style={[
                styles.inputWrapper,
                focusedInput === 'name' && styles.inputWrapperFocused,
              ]}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={focusedInput === 'name' ? '#FF5C00' : '#8A8A8E'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#8A8A8E"
                autoCapitalize="words"
                value={name}
                onChangeText={setName}
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            {/* Email Input */}
            <View
              style={[
                styles.inputWrapper,
                focusedInput === 'email' && styles.inputWrapperFocused,
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={focusedInput === 'email' ? '#FF5C00' : '#8A8A8E'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#8A8A8E"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            {/* Password Input */}
            <View
              style={[
                styles.inputWrapper,
                focusedInput === 'password' && styles.inputWrapperFocused,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={focusedInput === 'password' ? '#FF5C00' : '#8A8A8E'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#8A8A8E"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#8A8A8E"
                />
              </TouchableOpacity>
            </View>

            {/* Role Header */}
            <Text style={styles.sectionLabel}>Select Your Role</Text>

            {/* Role Grid */}
            <View style={styles.gridContainer}>
              {ROLES.map((r) => {
                const isSelected = selectedRole === r.id;
                const scaleValue = getCardScale(r.id);
                return (
                  <Animated.View
                    key={r.id}
                    style={[
                      styles.gridCardContainer,
                      { transform: [{ scale: scaleValue }] },
                    ]}
                  >
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => selectRole(r.id)}
                      style={[
                        styles.roleCard,
                        isSelected && styles.roleCardSelected,
                      ]}
                    >
                      {isSelected && (
                        <View style={styles.checkmarkBadge}>
                          <Ionicons name="checkmark-circle" size={18} color="#FF5C00" />
                        </View>
                      )}
                      <Ionicons
                        name={r.icon}
                        size={28}
                        color={isSelected ? '#FF5C00' : '#6C757D'}
                        style={styles.roleIcon}
                      />
                      <Text style={[styles.roleLabel, isSelected && styles.roleLabelSelected]}>
                        {r.label}
                      </Text>
                      <Text style={styles.roleDesc}>{r.desc}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleRegister}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={isLoading}
              activeOpacity={0.9}
              style={styles.submitBtnWrapper}
            >
              <Animated.View
                style={[
                  styles.submitBtn,
                  { transform: [{ scale: buttonScale }] },
                  isLoading && styles.submitBtnDisabled,
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Get Started</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={styles.btnArrow} />
                  </>
                )}
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Footer Navigation */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
  },
  innerContainer: {
    width: '100%',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#1E1E24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerContainer: {
    marginBottom: 24,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E1E24',
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 15,
    color: '#6C757D',
    marginTop: 6,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    shadowColor: '#1E1E24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF2F2',
    borderColor: '#FFE0E0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#D9383A',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 14,
    backgroundColor: '#F8F9FA',
  },
  inputWrapperFocused: {
    borderColor: '#FF5C00',
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#1E1E24',
    fontSize: 16,
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1E24',
    marginTop: 10,
    marginBottom: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gridCardContainer: {
    width: '48%',
    marginBottom: 12,
  },
  roleCard: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    height: 110,
    justifyContent: 'center',
    position: 'relative',
  },
  roleCardSelected: {
    borderColor: '#FF5C00',
    backgroundColor: '#FFF8F5',
  },
  checkmarkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  roleIcon: {
    marginBottom: 6,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#495057',
    marginBottom: 2,
  },
  roleLabelSelected: {
    color: '#FF5C00',
  },
  roleDesc: {
    fontSize: 10,
    color: '#8A8A8E',
    textAlign: 'center',
  },
  submitBtnWrapper: {
    marginTop: 10,
  },
  submitBtn: {
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
  submitBtnDisabled: {
    backgroundColor: '#FFAB80',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  btnArrow: {
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 20,
    width: '100%',
  },
  footerText: {
    color: '#6C757D',
    fontSize: 14,
  },
  footerLink: {
    color: '#FF5C00',
    fontSize: 14,
    fontWeight: '700',
  },
});
