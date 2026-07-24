import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  RefreshControl,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import api from '../../lib/api';
import { pickImageFromLibrary, uploadImage } from '../../lib/imageUpload';
import { Ionicons } from '@expo/vector-icons';

const TABS = [
  { id: 'orders', label: 'Orders', icon: 'receipt-outline' },
  { id: 'menu', label: 'Menu', icon: 'fast-food-outline' },
  { id: 'chat', label: 'Chat', icon: 'chatbubbles-outline' },
  { id: 'profile', label: 'Profile', icon: 'storefront-outline' },
];

const getApiErrorMessage = (error, fallback) =>
  error.response?.data?.error || error.response?.data?.message || error.message || fallback;

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

const orderItemsText = (items) => {
  if (!items || items.length === 0) return 'No items listed';
  return items.map((item) => `${item.quantity}x ${item.itemName}`).join(', ');
};

export default function RestaurantHomeScreen() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [uploadingMenuItemId, setUploadingMenuItemId] = useState(null);
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Burgers',
    image: '',
  });
  const [isSavingMenuItem, setIsSavingMenuItem] = useState(false);
  const [isUploadingMenuFormImage, setIsUploadingMenuFormImage] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedCustomerEmail, setSelectedCustomerEmail] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyImage, setReplyImage] = useState(null);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [error, setError] = useState(null);

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const fetchMerchantData = async () => {
    try {
      setError(null);
      const [profileRes, ordersRes, menuRes] = await Promise.all([
        api.get('/api/merchant/profile'),
        api.get('/api/merchant/orders'),
        api.get('/api/merchant/menu'),
      ]);

      setProfile(profileRes.data);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setMenuItems(Array.isArray(menuRes.data) ? menuRes.data : []);
      fetchMerchantChats();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load restaurant dashboard.'));
      console.error('Restaurant dashboard load failed:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMerchantData();
    const interval = setInterval(fetchMerchantData, 8000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const pending = orders.filter((order) => order.status === 'PENDING').length;
    const preparing = orders.filter((order) => order.status === 'PREPARING').length;
    const ready = orders.filter((order) => order.status === 'READY').length;
    const revenue = orders
      .filter((order) => order.status !== 'CANCELLED')
      .reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);

    return { pending, preparing, ready, revenue };
  }, [orders]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchMerchantData();
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleRestaurantImageUpload = async () => {
    setIsUploadingProfileImage(true);
    try {
      setError(null);
      const asset = await pickImageFromLibrary();
      if (!asset) return;

      const response = await uploadImage('/api/merchant/profile/image', asset);
      setProfile(response.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to upload restaurant photo.'));
    } finally {
      setIsUploadingProfileImage(false);
    }
  };

  const handleMenuImageUpload = async (itemId) => {
    setUploadingMenuItemId(itemId);
    try {
      setError(null);
      const asset = await pickImageFromLibrary();
      if (!asset) return;

      const response = await uploadImage(`/api/merchant/menu/${itemId}/image`, asset);
      setMenuItems((prev) => prev.map((item) => (item.id === itemId ? response.data : item)));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to upload menu item photo.'));
    } finally {
      setUploadingMenuItemId(null);
    }
  };

  const resetMenuForm = () => {
    setEditingMenuItem(null);
    setMenuForm({
      name: '',
      description: '',
      price: '',
      category: 'Burgers',
      image: '',
    });
  };

  const startEditMenuItem = (item) => {
    setEditingMenuItem(item);
    setMenuForm({
      name: item.name || '',
      description: item.description || '',
      price: String(item.price || ''),
      category: item.category || 'Burgers',
      image: item.image || '',
    });
  };

  const handleMenuFormImageUpload = async () => {
    setIsUploadingMenuFormImage(true);
    try {
      setError(null);
      const asset = await pickImageFromLibrary();
      if (!asset) return;

      const response = await uploadImage('/api/merchant/menu/images', asset);
      setMenuForm((current) => ({ ...current, image: response.data.imageUrl }));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to upload food photo.'));
    } finally {
      setIsUploadingMenuFormImage(false);
    }
  };

  const saveMenuItem = async () => {
    if (!menuForm.name.trim() || !menuForm.price.trim()) {
      setError('Menu item name and price are required.');
      return;
    }

    setIsSavingMenuItem(true);
    try {
      setError(null);
      const payload = {
        name: menuForm.name.trim(),
        description: menuForm.description.trim(),
        price: Number(menuForm.price),
        category: menuForm.category,
        image: menuForm.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
      };

      if (editingMenuItem?.id) {
        const response = await api.put(`/api/merchant/menu/${editingMenuItem.id}`, payload);
        setMenuItems((prev) => prev.map((item) => (item.id === editingMenuItem.id ? response.data : item)));
      } else {
        const response = await api.post('/api/merchant/menu', payload);
        setMenuItems((prev) => [response.data, ...prev]);
      }
      resetMenuForm();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to save menu item.'));
    } finally {
      setIsSavingMenuItem(false);
    }
  };

  const deleteMenuItem = async (itemId) => {
    setIsSavingMenuItem(true);
    try {
      setError(null);
      await api.delete(`/api/merchant/menu/${itemId}`);
      setMenuItems((prev) => prev.filter((item) => item.id !== itemId));
      if (editingMenuItem?.id === itemId) resetMenuForm();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to delete menu item.'));
    } finally {
      setIsSavingMenuItem(false);
    }
  };

  const fetchMerchantChats = async () => {
    try {
      const response = await api.get('/api/chat/merchant');
      const list = Array.isArray(response.data) ? response.data : [];
      setChatMessages(list);
      if (!selectedCustomerEmail && list.length > 0) {
        setSelectedCustomerEmail(list[list.length - 1].customerEmail);
      }
    } catch (err) {
      console.error('Unable to load merchant chats:', err);
    }
  };

  const attachReplyImage = async () => {
    try {
      const asset = await pickImageFromLibrary();
      if (asset) setReplyImage(asset);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to choose image.'));
    }
  };

  const getFilename = (asset) => asset.fileName || asset.uri?.split('/').pop() || `reply-${Date.now()}.jpg`;
  const getMimeType = (asset) => asset.mimeType || (getFilename(asset).toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');

  const sendMerchantReply = async () => {
    if (!selectedCustomerEmail) return;
    if (!replyText.trim() && !replyImage) {
      setError('Type a reply or attach an image.');
      return;
    }

    setIsSendingReply(true);
    try {
      setError(null);
      const formData = new FormData();
      formData.append('message', replyText.trim());
      if (replyImage) {
        formData.append('file', {
          uri: replyImage.uri,
          name: getFilename(replyImage),
          type: getMimeType(replyImage),
        });
      }
      const response = await api.post(`/api/chat/merchant/customers/${encodeURIComponent(selectedCustomerEmail)}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setChatMessages((prev) => [...prev, response.data]);
      setReplyText('');
      setReplyImage(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to send reply.'));
    } finally {
      setIsSendingReply(false);
    }
  };

  const updateOrderStatus = async (id, newStatus) => {
    setUpdatingOrderId(id);
    try {
      setError(null);
      const response = await api.put(`/api/merchant/orders/${id}/status?status=${newStatus}`);
      setOrders((prev) => prev.map((order) => (order.id === id ? response.data : order)));
      setSelectedOrder((current) => (current?.id === id ? response.data : current));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to update order status.'));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const renderOrderAction = (order) => {
    if (order.status === 'PENDING') {
      return (
        <TouchableOpacity
          onPress={() => updateOrderStatus(order.id, 'PREPARING')}
          disabled={updatingOrderId === order.id}
          style={[styles.orderActionBtn, styles.actionSoft]}
        >
          <Text style={styles.actionSoftText}>Accept & Prepare</Text>
        </TouchableOpacity>
      );
    }

    if (order.status === 'PREPARING') {
      return (
        <TouchableOpacity
          onPress={() => updateOrderStatus(order.id, 'READY')}
          disabled={updatingOrderId === order.id}
          style={[styles.orderActionBtn, styles.actionPrimary]}
        >
          <Text style={styles.actionPrimaryText}>Mark Ready</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.readyBadge}>
        <Ionicons name="checkmark-circle" size={16} color="#2B8A3E" />
        <Text style={styles.readyBadgeText}>
          {order.status === 'READY' ? 'Ready for pickup' : order.status}
        </Text>
      </View>
    );
  };

  const renderOrders = () => (
    <View style={styles.panel}>
      {selectedOrder && (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View>
              <Text style={styles.detailLabel}>Selected Order</Text>
              <Text style={styles.detailTitle}>#QB-{selectedOrder.id}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedOrder(null)} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color="#6C757D" />
            </TouchableOpacity>
          </View>
          <Text style={styles.detailCustomer}>{selectedOrder.customerName}</Text>
          <Text style={styles.detailMeta}>{selectedOrder.customerEmail}</Text>
          <View style={styles.detailItems}>
            {(selectedOrder.items || []).map((item) => (
              <View key={item.id} style={styles.detailItemRow}>
                <Text style={styles.detailItemName}>{item.quantity}x {item.itemName}</Text>
                <Text style={styles.detailItemPrice}>{formatMoney(item.price)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.detailFooter}>
            <Text style={styles.orderTotal}>{formatMoney(selectedOrder.totalPrice)}</Text>
            {updatingOrderId === selectedOrder.id ? (
              <ActivityIndicator color="#FF5C00" />
            ) : (
              renderOrderAction(selectedOrder)
            )}
          </View>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Kitchen Queue</Text>
        <TouchableOpacity onPress={fetchMerchantData} style={styles.iconBtn}>
          <Ionicons name="reload" size={18} color="#FF5C00" />
        </TouchableOpacity>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={34} color="#8A8A8E" />
          <Text style={styles.emptyTitle}>No active orders</Text>
          <Text style={styles.emptyText}>Customer orders will appear here automatically.</Text>
        </View>
      ) : (
        orders.map((order) => (
          <TouchableOpacity
            key={order.id}
            style={styles.orderCard}
            onPress={() => setSelectedOrder(order)}
            activeOpacity={0.92}
          >
            <View style={styles.orderTopRow}>
              <Text style={styles.orderId}>#QB-{order.id}</Text>
              <Text style={[styles.statusPill, styles[`status${order.status}`] || styles.statusDefault]}>
                {order.status}
              </Text>
            </View>
            <Text style={styles.customerName}>{order.customerName}</Text>
            <Text style={styles.orderItems} numberOfLines={3}>
              {orderItemsText(order.items)}
            </Text>
            <View style={styles.orderFooter}>
              <Text style={styles.orderTotal}>{formatMoney(order.totalPrice)}</Text>
              {updatingOrderId === order.id ? (
                <ActivityIndicator color="#FF5C00" />
              ) : (
                renderOrderAction(order)
              )}
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderMenu = () => (
    <View style={styles.panel}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{editingMenuItem ? 'Edit Menu Item' : 'Add Menu Item'}</Text>
        <Text style={styles.itemCount}>{menuItems.length} items</Text>
      </View>

      <View style={styles.menuFormCard}>
        <TouchableOpacity
          onPress={handleMenuFormImageUpload}
          disabled={isUploadingMenuFormImage}
          style={styles.menuFormImageBox}
        >
          {menuForm.image ? (
            <Image source={{ uri: menuForm.image }} style={styles.menuFormImage} />
          ) : (
            <View style={styles.menuFormImageEmpty}>
              <Ionicons name="image-outline" size={28} color="#8A8A8E" />
              <Text style={styles.menuFormImageText}>Food photo</Text>
            </View>
          )}
          <View style={styles.menuFormCameraBadge}>
            {isUploadingMenuFormImage ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            )}
          </View>
        </TouchableOpacity>

        <TextInput
          value={menuForm.name}
          onChangeText={(value) => setMenuForm((current) => ({ ...current, name: value }))}
          placeholder="Item name"
          placeholderTextColor="#8A8A8E"
          style={styles.menuInput}
        />
        <View style={styles.menuFormRow}>
          <TextInput
            value={menuForm.price}
            onChangeText={(value) => setMenuForm((current) => ({ ...current, price: value }))}
            placeholder="Price"
            placeholderTextColor="#8A8A8E"
            keyboardType="decimal-pad"
            style={[styles.menuInput, styles.menuHalfInput]}
          />
          <TextInput
            value={menuForm.category}
            onChangeText={(value) => setMenuForm((current) => ({ ...current, category: value }))}
            placeholder="Category"
            placeholderTextColor="#8A8A8E"
            style={[styles.menuInput, styles.menuHalfInput]}
          />
        </View>
        <TextInput
          value={menuForm.description}
          onChangeText={(value) => setMenuForm((current) => ({ ...current, description: value }))}
          placeholder="Description"
          placeholderTextColor="#8A8A8E"
          style={[styles.menuInput, styles.menuTextArea]}
          multiline
        />

        <View style={styles.menuFormActions}>
          {editingMenuItem ? (
            <TouchableOpacity onPress={resetMenuForm} style={styles.menuCancelBtn}>
              <Text style={styles.menuCancelText}>Cancel</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            onPress={saveMenuItem}
            disabled={isSavingMenuItem}
            style={styles.menuSaveBtn}
          >
            {isSavingMenuItem ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.menuSaveText}>{editingMenuItem ? 'Save Changes' : 'Add Item'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Menu</Text>
        <TouchableOpacity onPress={fetchMerchantData} style={styles.iconBtn}>
          <Ionicons name="reload" size={18} color="#FF5C00" />
        </TouchableOpacity>
      </View>

      {menuItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="fast-food-outline" size={34} color="#8A8A8E" />
          <Text style={styles.emptyTitle}>No menu items yet</Text>
          <Text style={styles.emptyText}>Add your first dish from this mobile menu editor.</Text>
        </View>
      ) : (
        menuItems.map((item) => (
          <View key={item.id} style={styles.menuCard}>
            <Image source={{ uri: item.image }} style={styles.menuImage} />
            <View style={styles.menuBody}>
              <Text style={styles.menuName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.menuDesc} numberOfLines={2}>{item.description || item.category || 'Menu item'}</Text>
              <Text style={styles.menuPrice}>{formatMoney(item.price)}</Text>
            </View>
            <View style={styles.menuActionsColumn}>
              <TouchableOpacity
                onPress={() => startEditMenuItem(item)}
                style={styles.menuPhotoBtn}
              >
                <Ionicons name="create-outline" size={18} color="#1A73E8" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleMenuImageUpload(item.id)}
                disabled={uploadingMenuItemId === item.id}
                style={styles.menuPhotoBtn}
              >
                {uploadingMenuItemId === item.id ? (
                  <ActivityIndicator size="small" color="#FF5C00" />
                ) : (
                  <Ionicons name="camera-outline" size={18} color="#FF5C00" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => deleteMenuItem(item.id)}
                disabled={isSavingMenuItem}
                style={[styles.menuPhotoBtn, styles.menuDeleteBtn]}
              >
                <Ionicons name="trash-outline" size={18} color="#D9383A" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderProfile = () => (
    <View style={styles.panel}>
      <Text style={styles.sectionTitle}>Restaurant Profile</Text>
      <View style={styles.profileCard}>
        <TouchableOpacity
          onPress={handleRestaurantImageUpload}
          disabled={isUploadingProfileImage}
          style={styles.profileImageWrap}
          activeOpacity={0.9}
        >
          {profile?.image ? (
            <Image source={{ uri: profile.image }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImage, styles.profileImageEmpty]}>
              <Ionicons name="image-outline" size={34} color="#8A8A8E" />
            </View>
          )}
          <View style={styles.profileCameraBadge}>
            {isUploadingProfileImage ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="camera" size={15} color="#FFFFFF" />
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleRestaurantImageUpload}
          disabled={isUploadingProfileImage}
          style={styles.uploadCoverBtn}
        >
          <Text style={styles.uploadCoverText}>{profile?.image ? 'Change Restaurant Photo' : 'Add Restaurant Photo'}</Text>
        </TouchableOpacity>
        <Text style={styles.profileName}>{profile?.name || 'Restaurant'}</Text>
        <Text style={styles.profileMeta}>{profile?.cuisineType || 'General cuisine'}</Text>
        <View style={styles.profileGrid}>
          <View style={styles.profileMetric}>
            <Text style={styles.profileMetricValue}>{profile?.rating > 0 ? profile.rating.toFixed(1) : 'N/A'}</Text>
            <Text style={styles.profileMetricLabel}>Rating</Text>
          </View>
          <View style={styles.profileMetric}>
            <Text style={styles.profileMetricValue}>{profile?.status || 'PENDING'}</Text>
            <Text style={styles.profileMetricLabel}>Status</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderChat = () => {
    const customers = Array.from(new Map(chatMessages.map((chat) => [chat.customerEmail, chat])).values());
    const currentMessages = chatMessages.filter((chat) => chat.customerEmail === selectedCustomerEmail);

    return (
      <View style={styles.panel}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Customer Messages</Text>
          <TouchableOpacity onPress={fetchMerchantChats} style={styles.iconBtn}>
            <Ionicons name="reload" size={18} color="#FF5C00" />
          </TouchableOpacity>
        </View>

        {customers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={34} color="#8A8A8E" />
            <Text style={styles.emptyTitle}>No chats yet</Text>
            <Text style={styles.emptyText}>Customer questions and food suggestions will appear here.</Text>
          </View>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chatCustomers}>
              {customers.map((customer) => {
                const active = customer.customerEmail === selectedCustomerEmail;
                return (
                  <TouchableOpacity
                    key={customer.customerEmail}
                    onPress={() => setSelectedCustomerEmail(customer.customerEmail)}
                    style={[styles.chatCustomerPill, active && styles.chatCustomerPillActive]}
                  >
                    <Text style={[styles.chatCustomerText, active && styles.chatCustomerTextActive]} numberOfLines={1}>
                      {customer.customerName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.chatThread}>
              {currentMessages.map((chat) => {
                const mine = chat.senderRole === 'MERCHANT';
                return (
                  <View key={chat.id} style={[styles.chatBubble, mine ? styles.chatBubbleMine : styles.chatBubbleOther]}>
                    <Text style={[styles.chatSender, mine && styles.chatSenderMine]}>{mine ? 'You' : chat.customerName}</Text>
                    {chat.message ? <Text style={[styles.chatText, mine && styles.chatTextMine]}>{chat.message}</Text> : null}
                    {chat.imageUrl ? <Image source={{ uri: chat.imageUrl }} style={styles.chatImage} /> : null}
                  </View>
                );
              })}
            </View>

            {replyImage ? (
              <View style={styles.replyAttachment}>
                <Image source={{ uri: replyImage.uri }} style={styles.replyImage} />
                <TouchableOpacity onPress={() => setReplyImage(null)} style={styles.replyRemove}>
                  <Ionicons name="close" size={15} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.replyComposer}>
              <TouchableOpacity onPress={attachReplyImage} style={styles.replyAttachBtn}>
                <Ionicons name="image-outline" size={20} color="#FF5C00" />
              </TouchableOpacity>
              <TextInput
                value={replyText}
                onChangeText={setReplyText}
                placeholder="Reply to customer..."
                placeholderTextColor="#8A8A8E"
                style={styles.replyInput}
                multiline
              />
              <TouchableOpacity onPress={sendMerchantReply} disabled={isSendingReply} style={styles.replySendBtn}>
                {isSendingReply ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="send" size={17} color="#FFFFFF" />}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.roleTag}>Merchant Mobile</Text>
          <Text style={styles.userName} numberOfLines={1}>
            {profile?.name || user?.name || 'Restaurant Owner'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#D9383A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#FF5C00" />
        }
      >
        <View style={styles.heroCard}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.statusLabel}>Store Status</Text>
              <Text style={[styles.statusText, isOpen ? styles.textOpen : styles.textClosed]}>
                {isOpen ? 'Open & Accepting Orders' : 'Closed'}
              </Text>
            </View>
            <Switch
              value={isOpen}
              onValueChange={setIsOpen}
              trackColor={{ false: '#767577', true: '#FFAB80' }}
              thumbColor={isOpen ? '#FF5C00' : '#f4f3f4'}
            />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{stats.pending}</Text>
              <Text style={styles.statLabel}>New</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{stats.preparing}</Text>
              <Text style={styles.statLabel}>Cooking</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{stats.ready}</Text>
              <Text style={styles.statLabel}>Ready</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statValueSmall}>{formatMoney(stats.revenue)}</Text>
              <Text style={styles.statLabel}>Sales</Text>
            </View>
          </View>
        </View>

        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="warning-outline" size={20} color="#D9383A" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchMerchantData} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.tabs}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Ionicons name={tab.icon} size={17} color={active ? '#FFFFFF' : '#6C757D'} />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#FF5C00" style={styles.loading} />
        ) : (
          <>
            {activeTab === 'orders' && renderOrders()}
            {activeTab === 'menu' && renderMenu()}
            {activeTab === 'chat' && renderChat()}
            {activeTab === 'profile' && renderProfile()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEFF3',
  },
  headerText: {
    flex: 1,
    marginRight: 12,
  },
  roleTag: {
    fontSize: 11,
    color: '#FF5C00',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  userName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#171A1F',
    marginTop: 3,
  },
  logoutBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 42,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  statusLabel: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '700',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  textOpen: {
    color: '#2B8A3E',
  },
  textClosed: {
    color: '#D9383A',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 16,
  },
  statCol: {
    flex: 1,
    minHeight: 62,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#171A1F',
  },
  statValueSmall: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171A1F',
  },
  statLabel: {
    fontSize: 11,
    color: '#6C757D',
    fontWeight: '700',
    marginTop: 3,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF2F2',
    borderWidth: 1,
    borderColor: '#FFE0E0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    color: '#D9383A',
    fontSize: 12,
    lineHeight: 17,
    marginHorizontal: 8,
  },
  retryBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  retryText: {
    color: '#D9383A',
    fontSize: 12,
    fontWeight: '800',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    minHeight: 42,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  tabActive: {
    backgroundColor: '#FF5C00',
  },
  tabText: {
    color: '#6C757D',
    fontSize: 12,
    fontWeight: '800',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  loading: {
    marginTop: 40,
  },
  panel: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#171A1F',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF0E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailCard: {
    backgroundColor: '#171A1F',
    borderRadius: 18,
    padding: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    color: '#AEB4BC',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  detailTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailCustomer: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  detailMeta: {
    color: '#AEB4BC',
    fontSize: 12,
    marginTop: 3,
  },
  detailItems: {
    backgroundColor: '#22262E',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    gap: 8,
  },
  detailItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  detailItemName: {
    color: '#E9ECEF',
    fontSize: 13,
    flex: 1,
  },
  detailItemPrice: {
    color: '#55C46F',
    fontSize: 13,
    fontWeight: '800',
  },
  detailFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    gap: 12,
  },
  itemCount: {
    color: '#6C757D',
    fontSize: 12,
    fontWeight: '700',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  orderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  orderId: {
    color: '#6C757D',
    fontSize: 13,
    fontWeight: '800',
  },
  statusPill: {
    overflow: 'hidden',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 10,
    fontWeight: '800',
  },
  statusPENDING: {
    color: '#C94B00',
    backgroundColor: '#FFF0E6',
  },
  statusPREPARING: {
    color: '#1A73E8',
    backgroundColor: '#E8F0FE',
  },
  statusREADY: {
    color: '#2B8A3E',
    backgroundColor: '#EBFBEE',
  },
  statusDELIVERING: {
    color: '#4D2A8A',
    backgroundColor: '#F3E8FD',
  },
  statusDefault: {
    color: '#6C757D',
    backgroundColor: '#F1F3F5',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171A1F',
  },
  orderItems: {
    marginTop: 5,
    color: '#495057',
    fontSize: 13,
    lineHeight: 19,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
    marginTop: 14,
    paddingTop: 12,
    gap: 12,
  },
  orderTotal: {
    color: '#171A1F',
    fontSize: 16,
    fontWeight: '800',
  },
  orderActionBtn: {
    minHeight: 40,
    borderRadius: 11,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionSoft: {
    backgroundColor: '#FFF0E6',
  },
  actionSoftText: {
    color: '#FF5C00',
    fontSize: 12,
    fontWeight: '800',
  },
  actionPrimary: {
    backgroundColor: '#FF5C00',
  },
  actionPrimaryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    borderRadius: 11,
    paddingHorizontal: 12,
    backgroundColor: '#EBFBEE',
  },
  readyBadgeText: {
    color: '#2B8A3E',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
  },
  menuCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  menuFormCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  menuFormImageBox: {
    width: '100%',
    height: 140,
    borderRadius: 14,
    backgroundColor: '#F1F3F5',
    overflow: 'hidden',
  },
  menuFormImage: {
    width: '100%',
    height: '100%',
  },
  menuFormImageEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuFormImageText: {
    color: '#8A8A8E',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6,
  },
  menuFormCameraBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF5C00',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuInput: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    color: '#171A1F',
    fontSize: 14,
    fontWeight: '700',
  },
  menuFormRow: {
    flexDirection: 'row',
    gap: 10,
  },
  menuHalfInput: {
    flex: 1,
  },
  menuTextArea: {
    minHeight: 78,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  menuFormActions: {
    flexDirection: 'row',
    gap: 10,
  },
  menuCancelBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#F1F3F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuCancelText: {
    color: '#6C757D',
    fontSize: 13,
    fontWeight: '900',
  },
  menuSaveBtn: {
    flex: 2,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#FF5C00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuSaveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  menuImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#ECEFF3',
  },
  menuBody: {
    flex: 1,
    marginLeft: 12,
  },
  menuPhotoBtn: {
    width: 36,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFF0E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuActionsColumn: {
    gap: 6,
    marginLeft: 8,
  },
  menuDeleteBtn: {
    backgroundColor: '#FFF2F2',
  },
  menuName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171A1F',
  },
  menuDesc: {
    color: '#6C757D',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  menuPrice: {
    color: '#FF5C00',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 5,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },
  profileImageWrap: {
    width: '100%',
    height: 140,
    marginBottom: 12,
  },
  profileImage: {
    width: '100%',
    height: 140,
    borderRadius: 14,
    backgroundColor: '#ECEFF3',
  },
  profileImageEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCameraBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FF5C00',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadCoverBtn: {
    backgroundColor: '#FFF0E6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 14,
  },
  uploadCoverText: {
    color: '#FF5C00',
    fontSize: 12,
    fontWeight: '800',
  },
  chatCustomers: {
    gap: 8,
    paddingVertical: 4,
  },
  chatCustomerPill: {
    maxWidth: 150,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  chatCustomerPillActive: {
    backgroundColor: '#FF5C00',
  },
  chatCustomerText: {
    color: '#6C757D',
    fontSize: 12,
    fontWeight: '900',
  },
  chatCustomerTextActive: {
    color: '#FFFFFF',
  },
  chatThread: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  chatBubble: {
    maxWidth: '88%',
    borderRadius: 16,
    padding: 11,
  },
  chatBubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF5C00',
  },
  chatBubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: '#F8F9FA',
  },
  chatSender: {
    color: '#FF5C00',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 4,
  },
  chatSenderMine: {
    color: '#FFE5D6',
  },
  chatText: {
    color: '#171A1F',
    fontSize: 13,
    lineHeight: 19,
  },
  chatTextMine: {
    color: '#FFFFFF',
  },
  chatImage: {
    width: 170,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#ECEFF3',
    marginTop: 8,
  },
  replyAttachment: {
    width: 78,
    height: 58,
  },
  replyImage: {
    width: 78,
    height: 58,
    borderRadius: 12,
  },
  replyRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D9383A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyComposer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 10,
    gap: 8,
  },
  replyAttachBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 88,
    borderRadius: 13,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#171A1F',
    fontSize: 13,
  },
  replySendBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#FF5C00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    color: '#171A1F',
    fontSize: 20,
    fontWeight: '800',
  },
  profileMeta: {
    color: '#6C757D',
    fontSize: 13,
    marginTop: 4,
  },
  profileGrid: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 16,
  },
  profileMetric: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  profileMetricValue: {
    color: '#171A1F',
    fontSize: 15,
    fontWeight: '800',
  },
  profileMetricLabel: {
    color: '#6C757D',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 10,
    color: '#171A1F',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    color: '#6C757D',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 5,
  },
});
