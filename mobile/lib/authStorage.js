import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'quickbite_token';

export const saveAuthToken = async (token) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await AsyncStorage.removeItem('token');
};

export const getAuthToken = async () => {
  const secureToken = await SecureStore.getItemAsync(TOKEN_KEY);
  if (secureToken) return secureToken;

  const legacyToken = await AsyncStorage.getItem('token');
  if (legacyToken) {
    await saveAuthToken(legacyToken);
  }
  return legacyToken;
};

export const removeAuthToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await AsyncStorage.removeItem('token');
};
