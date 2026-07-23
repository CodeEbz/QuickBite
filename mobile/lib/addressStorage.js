import AsyncStorage from '@react-native-async-storage/async-storage';

const ADDRESS_KEY = 'quickbite_default_address';
const FALLBACK_ADDRESS = '123 Main Street, Cityville (Apt 4B)';

export const getDefaultAddress = async () => {
  const saved = await AsyncStorage.getItem(ADDRESS_KEY);
  return saved || FALLBACK_ADDRESS;
};

export const saveDefaultAddress = async (address) => {
  const value = address?.trim() || FALLBACK_ADDRESS;
  await AsyncStorage.setItem(ADDRESS_KEY, value);
  return value;
};

export const fallbackAddress = FALLBACK_ADDRESS;
