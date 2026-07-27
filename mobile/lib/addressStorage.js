import AsyncStorage from '@react-native-async-storage/async-storage';

const ADDRESS_KEY = 'quickbite_default_address';
const FALLBACK_ADDRESS = '';

const getAddressKey = (ownerKey) => {
  const normalized = String(ownerKey || '').trim().toLowerCase();
  return normalized ? `${ADDRESS_KEY}_${normalized}` : ADDRESS_KEY;
};

export const getDefaultAddress = async (ownerKey) => {
  const userAddress = await AsyncStorage.getItem(getAddressKey(ownerKey));
  if (userAddress) return userAddress;
  const legacyAddress = await AsyncStorage.getItem(ADDRESS_KEY);
  return legacyAddress || '';
};

export const saveDefaultAddress = async (address, ownerKey) => {
  const value = address?.trim() || '';
  const key = getAddressKey(ownerKey);
  if (value) {
    await AsyncStorage.multiSet([[key, value], [ADDRESS_KEY, value]]);
  } else {
    await AsyncStorage.multiRemove([key, ADDRESS_KEY]);
  }
  return value;
};

export const fallbackAddress = FALLBACK_ADDRESS;
