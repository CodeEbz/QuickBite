import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../store/slices/cartSlice';
import { Ionicons } from '@expo/vector-icons';

export default function MenuItemDetailScreen({ route, navigation }) {
  const { item, restaurant } = route.params;
  const dispatch = useDispatch();

  const handleAdd = () => {
    dispatch(
      addToCart({
        item: {
          id: item.id,
          name: item.name,
          price: item.price,
        },
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
      })
    );
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: item.image }} style={styles.image} />
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#1E1E24" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.price}>${Number(item.price).toFixed(2)}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Ionicons name="restaurant-outline" size={15} color="#FF5C00" />
              <Text style={styles.metaText}>{item.category || 'Menu item'}</Text>
            </View>
            <View style={styles.metaPill}>
              <Ionicons name="time-outline" size={15} color="#FF5C00" />
              <Text style={styles.metaText}>15-25 min</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Details</Text>
          <Text style={styles.description}>
            {item.description || 'Freshly prepared by the restaurant and ready for quick delivery.'}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={handleAdd} style={styles.addBtn} activeOpacity={0.9}>
          <Text style={styles.addBtnText}>Add to Cart</Text>
          <Text style={styles.addPrice}>${Number(item.price).toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  imageWrap: {
    height: 290,
    backgroundColor: '#E9ECEF',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backBtn: {
    position: 'absolute',
    top: 18,
    left: 18,
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#FFFFFF',
    marginTop: -24,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 24,
  },
  restaurantName: {
    color: '#FF5C00',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  itemName: {
    color: '#1E1E24',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    marginTop: 8,
  },
  price: {
    color: '#2B8A3E',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 10,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  metaText: {
    color: '#C94B00',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
  },
  sectionTitle: {
    color: '#1E1E24',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 28,
  },
  description: {
    color: '#6C757D',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 10,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
    padding: 18,
  },
  addBtn: {
    backgroundColor: '#FF5C00',
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  addPrice: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
