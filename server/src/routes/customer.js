const express = require('express');
const prisma = require('../prisma');
const paystack = require('../services/paystack');
const config = require('../config');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler, httpError, toJson } = require('../utils/respond');

const router = express.Router();
router.use(requireAuth, requireRole('CUSTOMER'));

const orderInclude = { restaurant: true, items: true };

function validateOrderRequest(req) {
  if (!req) throw httpError('Order details are required.');
  if (!req.restaurantId) throw httpError('Restaurant is required.');
  if (!Array.isArray(req.items) || req.items.length === 0) throw httpError('Cart is empty.');
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function readMenuItemId(item) {
  return Number(item.menuItemId || item.id);
}

async function calculateOrderQuote(payload) {
  validateOrderRequest(payload);
  const restaurantId = Number(payload.restaurantId);
  const requestedItems = payload.items.map((item) => ({
    menuItemId: readMenuItemId(item),
    quantity: Number(item.quantity || 1)
  }));

  if (requestedItems.some((item) => !Number.isInteger(item.menuItemId) || item.menuItemId <= 0)) {
    throw httpError('Each order item must include a valid menu item ID.');
  }
  if (requestedItems.some((item) => !Number.isInteger(item.quantity) || item.quantity <= 0)) {
    throw httpError('Each order item must include a valid quantity.');
  }

  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: requestedItems.map((item) => item.menuItemId) },
      restaurantId
    }
  });
  const byId = new Map(menuItems.map((item) => [item.id, item]));

  if (menuItems.length !== requestedItems.length) {
    throw httpError('One or more cart items are not available at this restaurant.');
  }

  const items = requestedItems.map((requested) => {
    const menuItem = byId.get(requested.menuItemId);
    const price = Number(menuItem.price);
    return {
      itemName: menuItem.name,
      quantity: requested.quantity,
      price
    };
  });

  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const deliveryFee = roundMoney(config.deliveryFee);
  const tax = roundMoney(subtotal * config.taxRate);
  const totalPrice = roundMoney(subtotal + deliveryFee + tax);

  if (payload.totalPrice !== undefined && Math.abs(Number(payload.totalPrice) - totalPrice) > 0.01) {
    throw httpError('Order total changed. Refresh your cart and try again.');
  }

  return { items, subtotal, deliveryFee, tax, totalPrice };
}

async function createOrder(email, payload, paymentReference = null, paymentStatus = null) {
  const customer = await prisma.user.findUnique({ where: { email } });
  const restaurant = await prisma.restaurant.findUnique({ where: { id: Number(payload.restaurantId) } });
  if (!restaurant) throw httpError('Restaurant not found.', 404);
  if (restaurant.status !== 'ACTIVE') throw httpError('Restaurant is not accepting orders.', 400);
  const quote = await calculateOrderQuote(payload);

  return prisma.order.create({
    data: {
      customerEmail: email,
      customerName: customer?.name || email.split('@')[0],
      restaurantId: restaurant.id,
      totalPrice: quote.totalPrice,
      paymentReference,
      paymentStatus,
      items: {
        create: quote.items.map((item) => ({
          itemName: item.itemName,
          quantity: item.quantity,
          price: item.price
        }))
      }
    },
    include: orderInclude
  });
}

router.get('/restaurants', asyncHandler(async (_req, res) => {
  const restaurants = await prisma.restaurant.findMany({
    where: { status: 'ACTIVE' },
    orderBy: [{ rating: 'desc' }, { name: 'asc' }]
  });
  res.json(toJson(restaurants));
}));

router.get('/restaurants/:id/menu', asyncHandler(async (req, res) => {
  const items = await prisma.menuItem.findMany({
    where: { restaurantId: Number(req.params.id) },
    orderBy: [{ category: 'asc' }, { name: 'asc' }]
  });
  res.json(toJson(items));
}));

router.post('/orders', asyncHandler(async (req, res) => {
  const order = await createOrder(req.user.sub, req.body);
  res.json(toJson(order));
}));

router.post('/payments/initialize', asyncHandler(async (req, res) => {
  const quote = await calculateOrderQuote(req.body);
  const initialized = await paystack.initializePayment(req.user.sub, quote.totalPrice, req.body.callbackUrl);
  res.json(initialized);
}));

router.post('/payments/verify', asyncHandler(async (req, res) => {
  const { reference, order } = req.body || {};
  const quote = await calculateOrderQuote(order);
  const verification = await paystack.verifyPayment(reference);
  const expectedAmount = Math.round(quote.totalPrice * 100);
  if (!verification.successful || (verification.amount !== null && verification.amount !== expectedAmount)) {
    throw httpError('Payment has not been completed for this order.');
  }

  const existing = await prisma.order.findUnique({ where: { paymentReference: verification.reference }, include: orderInclude });
  if (existing) {
    if (existing.customerEmail !== req.user.sub) throw httpError('Access denied. This payment belongs to another account.', 403);
    return res.json(toJson(existing));
  }

  const created = await createOrder(req.user.sub, order, verification.reference, verification.status);
  res.json(toJson(created));
}));

router.get('/orders', asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { customerEmail: req.user.sub },
    include: orderInclude,
    orderBy: { createdAt: 'desc' }
  });
  res.json(toJson(orders));
}));

router.get('/orders/:id', asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) }, include: orderInclude });
  if (!order) throw httpError('Order not found.', 404);
  if (order.customerEmail !== req.user.sub) throw httpError('Access denied. You do not own this order.', 403);
  res.json(toJson(order));
}));

module.exports = router;
