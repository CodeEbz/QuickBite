import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { pickImageFromLibrary } from '../../lib/imageUpload';
import { Ionicons } from '@expo/vector-icons';

const FOOD_HINTS = [
  { label: 'Burger', query: 'Burgers', icon: 'fast-food-outline' },
  { label: 'Pizza', query: 'Pizza', icon: 'pizza-outline' },
  { label: 'Sushi', query: 'Asian', icon: 'fish-outline' },
  { label: 'Rice/Noodles', query: 'Asian', icon: 'restaurant-outline' },
  { label: 'Dessert', query: 'Desserts', icon: 'ice-cream-outline' },
  { label: 'Drink', query: 'Drinks', icon: 'beer-outline' },
  { label: 'Grill', query: 'Grill', icon: 'flame-outline' },
];

export default function BarcodeScannerScreen({ navigation }) {
  const [photo, setPhoto] = useState(null);
  const [selectedHint, setSelectedHint] = useState(null);
  const [error, setError] = useState(null);

  const takePhoto = async () => {
    try {
      setError(null);
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError('Camera permission is required to snap a food photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.82,
      });
      if (!result.canceled && result.assets?.length) {
        setPhoto(result.assets[0]);
      }
    } catch (err) {
      setError(err.message || 'Unable to open camera.');
    }
  };

  const uploadPhoto = async () => {
    try {
      setError(null);
      const asset = await pickImageFromLibrary();
      if (asset) setPhoto(asset);
    } catch (err) {
      setError(err.message || 'Unable to choose image.');
    }
  };

  const searchSimilar = () => {
    const query = selectedHint?.query || ''; 
    navigation.navigate('CustomerHome', { scannedCode: query });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#1E1E24" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Food Photo Search</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.previewCard}>
          {photo ? (
            <Image source={{ uri: photo.uri }} style={styles.previewImage} />
          ) : (
            <View style={styles.previewEmpty}>
              <Ionicons name="camera-outline" size={48} color="#FF5C00" />
              <Text style={styles.previewTitle}>Snap or upload food</Text>
              <Text style={styles.previewText}>Use a food picture to find similar meals in QuickBite.</Text>
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity onPress={takePhoto} style={styles.primaryBtn}>
            <Ionicons name="camera" size={18} color="#FFFFFF" />
            <Text style={styles.primaryText}>Snap Food</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={uploadPhoto} style={styles.secondaryBtn}>
            <Ionicons name="image-outline" size={18} color="#FF5C00" />
            <Text style={styles.secondaryText}>Upload</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.hintsCard}>
          <Text style={styles.sectionTitle}>What does it look like?</Text>
          <Text style={styles.sectionText}>Pick the closest match for best results. If you skip this, we will show all restaurants instead of returning no matches.</Text>
          <View style={styles.hintGrid}>
            {FOOD_HINTS.map((hint) => {
              const active = selectedHint?.label === hint.label;
              return (
                <TouchableOpacity
                  key={hint.label}
                  onPress={() => setSelectedHint(hint)}
                  style={[styles.hintChip, active && styles.hintChipActive]}
                >
                  <Ionicons name={hint.icon} size={18} color={active ? '#FFFFFF' : '#FF5C00'} />
                  <Text style={[styles.hintText, active && styles.hintTextActive]}>{hint.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          onPress={searchSimilar}
          disabled={!photo}
          style={[styles.searchBtn, !photo && styles.searchBtnDisabled]}
        >
          <Text style={styles.searchText}>Find Similar Food</Text>
          <Ionicons name="search" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { height: 62, paddingHorizontal: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F3F5', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8F9FA', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#1E1E24', fontSize: 18, fontWeight: '900' },
  content: { padding: 20, gap: 16, paddingBottom: 36 },
  previewCard: { height: 260, borderRadius: 22, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  previewEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  previewTitle: { color: '#1E1E24', fontSize: 19, fontWeight: '900', marginTop: 12 },
  previewText: { color: '#6C757D', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 6 },
  actionRow: { flexDirection: 'row', gap: 10 },
  primaryBtn: { flex: 1, minHeight: 50, borderRadius: 15, backgroundColor: '#FF5C00', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  secondaryBtn: { flex: 1, minHeight: 50, borderRadius: 15, backgroundColor: '#FFF0E6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  secondaryText: { color: '#FF5C00', fontSize: 14, fontWeight: '900' },
  errorCard: { backgroundColor: '#FFF2F2', borderRadius: 14, padding: 12 },
  errorText: { color: '#D9383A', fontSize: 13, fontWeight: '700' },
  hintsCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16 },
  sectionTitle: { color: '#1E1E24', fontSize: 16, fontWeight: '900' },
  sectionText: { color: '#6C757D', fontSize: 12, lineHeight: 18, marginTop: 4 },
  hintGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 14 },
  hintChip: { flexDirection: 'row', alignItems: 'center', borderRadius: 13, backgroundColor: '#FFF0E6', paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  hintChipActive: { backgroundColor: '#FF5C00' },
  hintText: { color: '#FF5C00', fontSize: 12, fontWeight: '900' },
  hintTextActive: { color: '#FFFFFF' },
  searchBtn: { minHeight: 54, borderRadius: 16, backgroundColor: '#FF5C00', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  searchBtnDisabled: { backgroundColor: '#FFAB80' },
  searchText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});
