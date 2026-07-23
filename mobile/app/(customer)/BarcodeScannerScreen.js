import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

export default function BarcodeScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [lastCode, setLastCode] = useState('');

  if (!permission) {
    return <SafeAreaView style={styles.center}><Text style={styles.muted}>Loading camera permission...</Text></SafeAreaView>;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="barcode-outline" size={44} color="#FF5C00" />
        <Text style={styles.title}>Scan Food Codes</Text>
        <Text style={styles.muted}>Allow camera access to scan food barcodes or QR codes.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.primaryBtn}>
          <Text style={styles.primaryText}>Allow Camera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleScanned = ({ data }) => {
    if (scanned) return;
    setScanned(true);
    setLastCode(data);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Food Scanner</Text>
        <View style={styles.iconBtn} />
      </View>

      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'ean8', 'upc_a', 'upc_e', 'code128'] }}
        onBarcodeScanned={scanned ? undefined : handleScanned}
      >
        <View style={styles.scanBox}>
          <View style={styles.corner} />
        </View>
      </CameraView>

      <View style={styles.bottomPanel}>
        <Text style={styles.panelTitle}>{lastCode ? 'Code scanned' : 'Point camera at a code'}</Text>
        <Text style={styles.panelText}>
          {lastCode || 'Scan a food QR/barcode. QuickBite will use the result as a search term for now.'}
        </Text>
        {lastCode ? (
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => { setScanned(false); setLastCode(''); }} style={styles.secondaryBtn}>
              <Text style={styles.secondaryText}>Scan Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('CustomerHome', { scannedCode: lastCode })}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryText}>Search Code</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111318' },
  center: { flex: 1, backgroundColor: '#FAF9F6', alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: { height: 62, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  iconBtn: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  camera: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanBox: { width: 250, height: 250, borderRadius: 24, borderWidth: 2, borderColor: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.04)' },
  corner: { width: 60, height: 60, borderTopWidth: 5, borderLeftWidth: 5, borderColor: '#FF5C00', borderTopLeftRadius: 20, margin: -2 },
  bottomPanel: { backgroundColor: '#FFFFFF', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 10 },
  title: { color: '#1E1E24', fontSize: 22, fontWeight: '900', marginTop: 12 },
  muted: { color: '#6C757D', fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  panelTitle: { color: '#1E1E24', fontSize: 17, fontWeight: '900' },
  panelText: { color: '#6C757D', fontSize: 13, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  primaryBtn: { flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: '#FF5C00', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  secondaryBtn: { flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: '#FFF0E6', alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: '#FF5C00', fontSize: 14, fontWeight: '900' },
});
