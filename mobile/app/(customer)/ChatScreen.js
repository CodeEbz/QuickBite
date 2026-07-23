import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../lib/api';
import { pickImageFromLibrary } from '../../lib/imageUpload';
import { Ionicons } from '@expo/vector-icons';

export default function ChatScreen({ navigation, route }) {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(route.params?.restaurant || null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const restaurantId = selectedRestaurant?.id;

  const groupedRestaurants = useMemo(() => restaurants.slice(0, 12), [restaurants]);

  const fetchRestaurants = async () => {
    try {
      const response = await api.get('/api/customer/restaurants');
      const list = Array.isArray(response.data) ? response.data : [];
      setRestaurants(list);
      if (!selectedRestaurant && list.length > 0) {
        setSelectedRestaurant(list[0]);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Unable to load restaurants.');
    }
  };

  const fetchMessages = async () => {
    if (!restaurantId) return;
    try {
      setError(null);
      const response = await api.get(`/api/chat/customer/restaurants/${restaurantId}`);
      setMessages(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Unable to load chat.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [restaurantId]);

  const attachImage = async () => {
    try {
      const asset = await pickImageFromLibrary();
      if (asset) setAttachment(asset);
    } catch (err) {
      alert(err.message || 'Unable to choose image.');
    }
  };

  const getFilename = (asset) => asset.fileName || asset.uri?.split('/').pop() || `chat-${Date.now()}.jpg`;
  const getMimeType = (asset) => asset.mimeType || (getFilename(asset).toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');

  const sendMessage = async () => {
    if (!restaurantId) return;
    if (!message.trim() && !attachment) {
      alert('Type a message or attach an image.');
      return;
    }

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('message', message.trim());
      if (attachment) {
        formData.append('file', {
          uri: attachment.uri,
          name: getFilename(attachment),
          type: getMimeType(attachment),
        });
      }
      const response = await api.post(`/api/chat/customer/restaurants/${restaurantId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessages((prev) => [...prev, response.data]);
      setMessage('');
      setAttachment(null);
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Unable to send message.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#1E1E24" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Merchant Chat</Text>
        <TouchableOpacity onPress={fetchMessages} style={styles.iconBtn}>
          <Ionicons name="reload" size={19} color="#FF5C00" />
        </TouchableOpacity>
      </View>

      <View style={styles.restaurantStrip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.restaurantList}>
          {groupedRestaurants.map((restaurant) => {
            const active = restaurant.id === restaurantId;
            return (
              <TouchableOpacity
                key={restaurant.id}
                onPress={() => setSelectedRestaurant(restaurant)}
                style={[styles.restaurantPill, active && styles.restaurantPillActive]}
              >
                <Text style={[styles.restaurantPillText, active && styles.restaurantPillTextActive]} numberOfLines={1}>
                  {restaurant.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.messages} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator color="#FF5C00" style={{ marginTop: 30 }} />
        ) : messages.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="chatbubbles-outline" size={34} color="#8A8A8E" />
            <Text style={styles.emptyTitle}>Ask the merchant</Text>
            <Text style={styles.emptyText}>Request a special meal, ask about ingredients, or send a reference image.</Text>
          </View>
        ) : (
          messages.map((chat) => {
            const mine = chat.senderRole === 'CUSTOMER';
            return (
              <View key={chat.id} style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                <Text style={[styles.sender, mine ? styles.senderMine : styles.senderOther]}>
                  {mine ? 'You' : chat.restaurant?.name || 'Merchant'}
                </Text>
                {chat.message ? <Text style={[styles.messageText, mine && styles.messageMine]}>{chat.message}</Text> : null}
                {chat.imageUrl ? <Image source={{ uri: chat.imageUrl }} style={styles.chatImage} /> : null}
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={styles.composer}>
        {attachment ? (
          <View style={styles.attachmentPreview}>
            <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
            <TouchableOpacity onPress={() => setAttachment(null)} style={styles.removeAttachment}>
              <Ionicons name="close" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : null}
        <View style={styles.composerRow}>
          <TouchableOpacity onPress={attachImage} style={styles.attachBtn}>
            <Ionicons name="image-outline" size={22} color="#FF5C00" />
          </TouchableOpacity>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Suggest something or ask for a food..."
            placeholderTextColor="#8A8A8E"
            style={styles.input}
            multiline
          />
          <TouchableOpacity onPress={sendMessage} disabled={isSending} style={styles.sendBtn}>
            {isSending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="send" size={18} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { height: 62, paddingHorizontal: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F3F5', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8F9FA', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#1E1E24', fontSize: 18, fontWeight: '900' },
  restaurantStrip: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F3F5' },
  restaurantList: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  restaurantPill: { maxWidth: 150, borderRadius: 14, backgroundColor: '#F8F9FA', paddingHorizontal: 13, paddingVertical: 9 },
  restaurantPillActive: { backgroundColor: '#FF5C00' },
  restaurantPillText: { color: '#6C757D', fontSize: 12, fontWeight: '900' },
  restaurantPillTextActive: { color: '#FFFFFF' },
  errorCard: { margin: 14, backgroundColor: '#FFF2F2', borderRadius: 14, padding: 12 },
  errorText: { color: '#D9383A', fontSize: 12, fontWeight: '700' },
  messages: { padding: 16, paddingBottom: 130, gap: 12 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 24, alignItems: 'center', marginTop: 40 },
  emptyTitle: { color: '#1E1E24', fontSize: 17, fontWeight: '900', marginTop: 12 },
  emptyText: { color: '#6C757D', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 6 },
  bubble: { maxWidth: '86%', borderRadius: 18, padding: 12 },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: '#FF5C00' },
  bubbleOther: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF' },
  sender: { fontSize: 11, fontWeight: '900', marginBottom: 5 },
  senderMine: { color: '#FFE5D6' },
  senderOther: { color: '#FF5C00' },
  messageText: { color: '#1E1E24', fontSize: 14, lineHeight: 20 },
  messageMine: { color: '#FFFFFF' },
  chatImage: { width: 190, height: 130, borderRadius: 12, marginTop: 8, backgroundColor: '#E9ECEF' },
  composer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF', padding: 14, borderTopWidth: 1, borderTopColor: '#F1F3F5' },
  attachmentPreview: { width: 78, height: 58, marginBottom: 10 },
  attachmentImage: { width: 78, height: 58, borderRadius: 12 },
  removeAttachment: { position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: 12, backgroundColor: '#D9383A', alignItems: 'center', justifyContent: 'center' },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  attachBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF0E6', alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, maxHeight: 96, minHeight: 44, borderRadius: 14, backgroundColor: '#F8F9FA', paddingHorizontal: 14, paddingVertical: 11, color: '#1E1E24', fontSize: 14 },
  sendBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FF5C00', alignItems: 'center', justifyContent: 'center' },
});
