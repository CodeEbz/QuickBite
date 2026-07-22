import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [], // { id, name, price, quantity }
  restaurantId: null,
  restaurantName: null,
  totalPrice: 0,
};

const calculateTotals = (state) => {
  state.totalPrice = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { item, restaurantId, restaurantName } = action.payload;

      // If adding items from a different restaurant, clear previous items
      if (state.restaurantId && state.restaurantId !== restaurantId) {
        state.items = [];
      }

      state.restaurantId = restaurantId;
      state.restaurantName = restaurantName;

      const existingItem = state.items.find((i) => i.id === item.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...item, quantity: 1 });
      }

      calculateTotals(state);
    },
    removeFromCart: (state, action) => {
      const itemId = action.payload;
      state.items = state.items.filter((i) => i.id !== itemId);

      if (state.items.length === 0) {
        state.restaurantId = null;
        state.restaurantName = null;
      }

      calculateTotals(state);
    },
    incrementQuantity: (state, action) => {
      const itemId = action.payload;
      const item = state.items.find((i) => i.id === itemId);
      if (item) {
        item.quantity += 1;
      }
      calculateTotals(state);
    },
    decrementQuantity: (state, action) => {
      const itemId = action.payload;
      const item = state.items.find((i) => i.id === itemId);
      if (item) {
        if (item.quantity > 1) {
          item.quantity -= 1;
        } else {
          state.items = state.items.filter((i) => i.id !== itemId);
        }
      }

      if (state.items.length === 0) {
        state.restaurantId = null;
        state.restaurantName = null;
      }

      calculateTotals(state);
    },
    clearCart: (state) => {
      state.items = [];
      state.restaurantId = null;
      state.restaurantName = null;
      state.totalPrice = 0;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  incrementQuantity,
  decrementQuantity,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
