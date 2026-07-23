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
import { verifyOtp, clearErrors, resetRegisterStatus } from '../../store/slices/authSlice';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function VerifyOtpScreen({ navigation }) {
  const [otpCode, setOtpCode] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const inputRef = useRef(null);

  const dispatch = useDispatch();
  const { isLoading, error, otpStatus, otpEmail } = useSelector((state) => state.auth);
  const insets = useSafeAreaInsets();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    dispatch(clearErrors());
    if (otpEmail) {
      setEmailInput(otpEmail);
    }

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
  }, [dispatch, otpEmail]);

  // Handle successful OTP verification
  useEffect(() => {
    if (otpStatus === 'success') {
      const timer = setTimeout(() => {
        dispatch(resetRegisterStatus());
        navigation.navigate('Login');
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [otpStatus, navigation, dispatch]);

  const handleVerify = () => {
    if (!emailInput.trim() || otpCode.length !== 6) {
      return;
    }
    dispatch(verifyOtp({ email: emailInput.trim(), otp: otpCode }));
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

  const focusInput = () => {
    inputRef.current?.focus();
  };

  // Render the 6 styled OTP character boxes
  const renderCodeBoxes = () => {
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      const char = otpCode[i] || '';
      const isFocused = otpCode.length === i;
      boxes.push(
        <View
          key={i}
          style={[
            styles.codeBox,
            char !== '' && styles.codeBoxFilled,
            isFocused && styles.codeBoxFocused,
          ]}
        >
          <Text style={styles.codeText}>{char}</Text>
        </View>
      );
    }
    return boxes;
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
          {/* Back button */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E1E24" />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={styles.titleText}>Verify Email</Text>
            <Text style={styles.subtitleText}>
              We sent a 6-digit verification code to your email. Enter it below to activate your account.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={20} color="#D9383A" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {otpStatus === 'success' && (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle-outline" size={22} color="#2B8A3E" />
                <Text style={styles.successText}>Email verified! Redirecting to login...</Text>
              </View>
            )}

            {/* Email field (if otpEmail is not set, allow editing) */}
            {!otpEmail && (
              <View style={styles.emailInputWrapper}>
                <Text style={styles.emailLabel}>Verify email address:</Text>
                <TextInput
                  style={styles.emailInput}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={emailInput}
                  onChangeText={setEmailInput}
                />
              </View>
            )}

            {otpEmail && (
              <View style={styles.emailDisplayBox}>
                <Text style={styles.emailDisplayText}>{emailInput}</Text>
              </View>
            )}

            {/* Hidden Input field to handle typing */}
            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              keyboardType="number-pad"
              maxLength={6}
              value={otpCode}
              onChangeText={setOtpCode}
              autoFocus
            />

            {/* Visual Code Boxes */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={focusInput}
              style={styles.codeContainer}
            >
              {renderCodeBoxes()}
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleVerify}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={isLoading || otpStatus === 'success' || otpCode.length !== 6}
              activeOpacity={0.9}
              style={styles.submitBtnWrapper}
            >
              <Animated.View
                style={[
                  styles.submitBtn,
                  { transform: [{ scale: buttonScale }] },
                  (isLoading || otpCode.length !== 6) && styles.submitBtnDisabled,
                  otpStatus === 'success' && styles.submitBtnSuccess,
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : otpStatus === 'success' ? (
                  <Ionicons name="checkmark" size={24} color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Verify Code</Text>
                    <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" style={styles.btnIcon} />
                  </>
                )}
              </Animated.View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resendBtn}>
              <Text style={styles.resendBtnText}>Resend Code</Text>
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
    marginBottom: 24,
    shadowColor: '#1E1E24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerContainer: {
    marginBottom: 32,
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
    marginTop: 8,
    lineHeight: 22,
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
    alignItems: 'center',
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
    width: '100%',
  },
  errorText: {
    color: '#D9383A',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBFBEE',
    borderColor: '#D3F9D8',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    width: '100%',
  },
  successText: {
    color: '#2B8A3E',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    fontWeight: '600',
  },
  emailInputWrapper: {
    width: '100%',
    marginBottom: 24,
  },
  emailLabel: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
    fontWeight: '600',
  },
  emailInput: {
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 16,
    color: '#1E1E24',
    backgroundColor: '#F8F9FA',
  },
  emailDisplayBox: {
    backgroundColor: '#F1F3F5',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  emailDisplayText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#495057',
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
  },
  codeBox: {
    width: 44,
    height: 56,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  codeBoxFilled: {
    borderColor: '#DDE2E5',
    backgroundColor: '#FFFFFF',
  },
  codeBoxFocused: {
    borderColor: '#FF5C00',
    backgroundColor: '#FFFFFF',
    shadowColor: '#FF5C00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  codeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E1E24',
  },
  submitBtnWrapper: {
    width: '100%',
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
    backgroundColor: '#E9ECEF',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnSuccess: {
    backgroundColor: '#2B8A3E',
    shadowColor: '#2B8A3E',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  btnIcon: {
    marginLeft: 8,
  },
  resendBtn: {
    marginTop: 20,
    padding: 8,
  },
  resendBtnText: {
    color: '#8A8A8E',
    fontSize: 14,
    fontWeight: '600',
  },
});
