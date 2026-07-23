import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../lib/api';

// Initial state
const initialState = {
  user: null, // { name, email }
  token: null,
  role: null, // 'CUSTOMER' | 'DRIVER' | 'RESTAURANT' | 'ADMIN'
  isAuthenticated: false,
  isLoading: false,
  error: null,
  registerStatus: 'idle', // 'idle' | 'loading' | 'success' | 'failed'
  otpStatus: 'idle', // 'idle' | 'loading' | 'success' | 'failed'
  otpEmail: null, // Stores email for verification step
};

const getApiErrorMessage = (error, fallback) => {
  const data = error.response?.data;

  if (typeof data === 'string') {
    return data;
  }

  if (data?.error) {
    return data.error;
  }

  if (data?.message) {
    return data.message;
  }

  return error.message || fallback;
};

// Async Thunks
export const register = createAsyncThunk(
  'auth/register',
  async ({ name, email, password, role }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/auth/register', {
        name,
        email,
        password,
        role,
      });
      // Backend returns string message: "Registration successful. Check your email for OTP."
      return { message: response.data, email };
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Registration failed'));
    }
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/auth/verify-otp', {
        email,
        otp,
      });
      // Backend returns string: "Email verified successfully"
      return response.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'OTP verification failed'));
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/auth/login', {
        email,
        password,
      });
      // Backend returns AuthResponse: { token, role, name }
      const { token, role, name, profileImage } = response.data;
      
      // Save credentials to AsyncStorage
      await AsyncStorage.multiSet([
        ['token', token],
        ['role', role],
        ['userName', name],
        ['userEmail', email],
        ['profileImage', profileImage || '']
      ]);

      return { token, role, name, email, profileImage };
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, 'Login failed'));
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await AsyncStorage.multiRemove(['token', 'role', 'userName', 'userEmail', 'profileImage']);
      return null;
    } catch (error) {
      return rejectWithValue('Logout failed');
    }
  }
);

export const loadStoredAuth = createAsyncThunk(
  'auth/loadStoredAuth',
  async (_, { rejectWithValue }) => {
    try {
      const keys = ['token', 'role', 'userName', 'userEmail', 'profileImage'];
      const stores = await AsyncStorage.multiGet(keys);
      const authData = {};
      
      stores.forEach(([key, value]) => {
        authData[key] = value;
      });

      if (authData.token && authData.role) {
        return {
          token: authData.token,
          role: authData.role,
          name: authData.userName || '',
          email: authData.userEmail || '',
          profileImage: authData.profileImage || '',
        };
      }
      return null;
    } catch (error) {
      return rejectWithValue('Failed to load auth data');
    }
  }
);

// Auth Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = null;
    },
    resetRegisterStatus: (state) => {
      state.registerStatus = 'idle';
      state.otpStatus = 'idle';
      state.otpEmail = null;
    },
    setOtpEmail: (state, action) => {
      state.otpEmail = action.payload;
    },
    updateUserProfile: (state, action) => {
      state.user = {
        ...(state.user || {}),
        ...action.payload,
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.registerStatus = 'loading';
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.registerStatus = 'success';
        state.otpEmail = action.payload.email;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.registerStatus = 'failed';
        state.error = action.payload;
      })
      
      // Verify OTP
      .addCase(verifyOtp.pending, (state) => {
        state.isLoading = true;
        state.otpStatus = 'loading';
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state) => {
        state.isLoading = false;
        state.otpStatus = 'success';
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.otpStatus = 'failed';
        state.error = action.payload;
      })
      
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.user = {
          name: action.payload.name,
          email: action.payload.email,
          profileImage: action.payload.profileImage,
        };
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.role = null;
        state.isAuthenticated = false;
        state.registerStatus = 'idle';
        state.otpStatus = 'idle';
        state.otpEmail = null;
      })
      
      // Load Stored Auth
      .addCase(loadStoredAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.isAuthenticated = true;
          state.token = action.payload.token;
          state.role = action.payload.role;
          state.user = {
            name: action.payload.name,
            email: action.payload.email,
            profileImage: action.payload.profileImage,
          };
        }
      })
      .addCase(loadStoredAuth.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const { clearErrors, resetRegisterStatus, setOtpEmail, updateUserProfile } = authSlice.actions;
export default authSlice.reducer;
