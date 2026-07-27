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
import { login, clearErrors } from '../../store/slices/authSlice';
import api from '../../lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null); // 'email' | 'password' | null
  const [validationError, setValidationError] = useState(null);
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetNotice, setResetNotice] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);
  const insets = useSafeAreaInsets();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  useEffect(() => {
    // Clear previous errors when mounting
    dispatch(clearErrors());

    // Run animations in parallel
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [dispatch]);

  const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value.trim());

  const submitLogin = (loginEmail, loginPassword) => {
    const trimmedEmail = loginEmail.trim();
    if (!trimmedEmail || !loginPassword.trim()) {
      setValidationError('Enter your email and password to continue.');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setValidationError('Enter a valid email address.');
      return;
    }
    setValidationError(null);
    dispatch(login({ email: trimmedEmail, password: loginPassword }));
  };

  const handleLogin = () => {
    submitLogin(email, password);
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = resetEmail.trim() || email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setValidationError('Enter the email address for your account.');
      return;
    }

    setIsResetting(true);
    setValidationError(null);
    setResetNotice(null);
    try {
      const endpoint = resetOtp.trim() || resetPassword.trim() ? '/api/auth/reset-password' : '/api/auth/forgot-password';
      const payload = endpoint.endsWith('reset-password')
        ? { email: trimmedEmail, otp: resetOtp.trim(), password: resetPassword }
        : { email: trimmedEmail };
      if (endpoint.endsWith('reset-password') && (!resetOtp.trim() || resetPassword.length < 6)) {
        setValidationError('Enter the reset code and a new password with at least 6 characters.');
        return;
      }
      const response = await api.post(endpoint, payload);
      setResetNotice(typeof response.data === 'string' ? response.data : 'Password reset step completed.');
      if (endpoint.endsWith('reset-password')) {
        setResetMode(false);
        setPassword('');
        setResetOtp('');
        setResetPassword('');
      } else {
        setResetEmail(trimmedEmail);
      }
    } catch (err) {
      setValidationError(err.response?.data?.error || err.message || 'Unable to reset password.');
    } finally {
      setIsResetting(false);
    }
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
          { paddingTop: Math.max(insets.top + 16, 28), paddingBottom: Math.max(insets.bottom + 24, 32) },
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
          {/* Logo & Header */}
          <View style={styles.headerContainer}>
            <Animated.View style={[styles.logoBadge, { transform: [{ scale: logoScale }] }]}>
              <Ionicons name="fast-food" size={40} color="#FFFFFF" />
            </Animated.View>
            <Text style={styles.appName}>QuickBite</Text>
            <Text style={styles.subtitle}>Satisfy your cravings, instantly.</Text>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            
            {(error || validationError) && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={20} color="#D9383A" />
                <Text style={styles.errorText}>{validationError || error}</Text>
              </View>
            )}

            {/* Email Input */}
            <TouchableOpacity
              style={[
                styles.inputWrapper,
                focusedInput === 'email' && styles.inputWrapperFocused,
              ]}
              activeOpacity={1}
              onPress={() => emailInputRef.current?.focus()}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={focusedInput === 'email' ? '#FF5C00' : '#8A8A8E'}
                style={styles.inputIcon}
              />
              <TextInput
                ref={emailInputRef}
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#8A8A8E"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                editable={!isLoading}
              />
            </TouchableOpacity>

            {/* Password Input */}
            <TouchableOpacity
              style={[
                styles.inputWrapper,
                focusedInput === 'password' && styles.inputWrapperFocused,
              ]}
              activeOpacity={1}
              onPress={() => passwordInputRef.current?.focus()}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={focusedInput === 'password' ? '#FF5C00' : '#8A8A8E'}
                style={styles.inputIcon}
              />
              <TextInput
                ref={passwordInputRef}
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#8A8A8E"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                returnKeyType="done"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                onSubmitEditing={handleLogin}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                disabled={isLoading}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#8A8A8E"
                />
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotBtn} onPress={() => { setResetMode(!resetMode); setResetEmail(email); setValidationError(null); setResetNotice(null); }}>
              <Text style={styles.forgotText}>{resetMode ? 'Back to Sign In' : 'Forgot Password?'}</Text>
            </TouchableOpacity>


            {resetNotice && (
              <View style={styles.noticeBox}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#0E7C66" />
                <Text style={styles.noticeText}>{resetNotice}</Text>
              </View>
            )}

            {resetMode && (
              <View style={styles.resetCard}>
                <TextInput
                  style={styles.resetInput}
                  placeholder="Account email"
                  placeholderTextColor="#8A8A8E"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  editable={!isResetting}
                />
                <TextInput
                  style={styles.resetInput}
                  placeholder="Reset code"
                  placeholderTextColor="#8A8A8E"
                  keyboardType="number-pad"
                  value={resetOtp}
                  onChangeText={setResetOtp}
                  editable={!isResetting}
                />
                <TextInput
                  style={styles.resetInput}
                  placeholder="New password"
                  placeholderTextColor="#8A8A8E"
                  secureTextEntry
                  value={resetPassword}
                  onChangeText={setResetPassword}
                  editable={!isResetting}
                />
                <TouchableOpacity onPress={handleForgotPassword} disabled={isResetting} style={styles.resetBtn}>
                  {isResetting ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.resetBtnText}>{resetOtp || resetPassword ? 'Reset Password' : 'Send Reset Code'}</Text>}
                </TouchableOpacity>
              </View>
            )}
            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleLogin}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={isLoading}
              activeOpacity={0.9}
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
                    <Text style={styles.submitBtnText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={styles.btnArrow} />
                  </>
                )}
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Footer Navigation */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Sign Up</Text>
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
    justifyContent: 'center',
    padding: 24,
  },
  innerContainer: {
    alignItems: 'center',
    width: '100%',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#FF5C00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF5C00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E1E24',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6C757D',
    marginTop: 6,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    shadowColor: '#1E1E24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E1E24',
    marginBottom: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF2F2',
    borderColor: '#FFE0E0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
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
    height: 56,
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
  },
  inputWrapperFocused: {
    borderColor: '#FF5C00',
    backgroundColor: '#FFFFFF',
    shadowColor: '#FF5C00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: '#FF5C00',
    fontSize: 14,
    fontWeight: '600',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFFFF9',
    borderColor: '#C6F3E7',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: {
    color: '#0E7C66',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  resetCard: {
    gap: 10,
    marginBottom: 18,
  },
  resetInput: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#F8F9FA',
    color: '#1E1E24',
    paddingHorizontal: 14,
    fontSize: 14,
  },
  resetBtn: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#0E7C66',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  submitBtn: {
    backgroundColor: '#FF5C00',
    borderRadius: 16,
    height: 56,
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



