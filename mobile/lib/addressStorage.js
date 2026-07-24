import AsyncStorage from '@react-native-async-storage/async-storage';

const ADDRESS_KEY = 'quickbite_default_address';
const FALLBACK_ADDRESS = '';

export const getDefaultAddress = async () => {
  const saved = await AsyncStorage.getItem(ADDRESS_KEY);
  return saved || '';
};

export const saveDefaultAddress = async (address) => {
  const value = address?.trim() || '';
  if (value) {
    await AsyncStorage.setItem(ADDRESS_KEY, value);
  } else {
    await AsyncStorage.removeItem(ADDRESS_KEY);
  }
  return value;
};

export const fallbackAddress = FALLBACK_ADDRESS;
