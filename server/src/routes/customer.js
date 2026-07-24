const express = require('express');
const prisma = require('../prisma');
const paystack = require('../services/paystack');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler, httpError, toJson } = require('../utils/respond');

const router = express.Router();
router.use(requireAuth, requireRole('CUSTOMER'));

const orderInclude = { restaurant: true, items: true };

function validateOrderRequest(req) {
  if (!req) throw httpError('Order details are required.');
  if (!req.restaurantId) throw httpError('Restaurant is required.');
  if (!Array.isArray(req.items) || req.items.length === 0) throw httpError('Cart is empty.');
  if (!req.totalPrice || Number(req.totalPrice) <= 0) throw httpError('Order total must be greater than zero.');
}

async function createOrder(email, payload, paymentReference = null, paymentStatus = null) {
  validateOrderRequest(payload);
  const customer = await prisma.user.findUnique({ where: { email } });
  const restaurant = await prisma.restaurant.findUnique({ where: { id: Number(payload.restaurantId) } });
  if (!restaurant) throw httpError('Restaurant not found.', 404);

  return prisma.order.create({
    data: {
      customerEmail: email,
      customerName: customer?.name || email.split('@')[0],
      restaurantId: restaurant.id,
      totalPrice: Number(payload.totalPrice),
      paymentReference,
      paymentStatus,
      items: {
        create: payload.items.map((item) => ({
          itemName: item.itemName,
          quantity: Number(item.quantity || 1),
          price: Number(item.price || 0)
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
  validateOrderRequest(req.body);
  const initialized = await paystack.initializePayment(req.user.sub, req.body.totalPrice, req.body.callbackUrl);
  res.json(initialized);
}));

router.post('/payments/verify', asyncHandler(async (req, res) => {
  const { reference, order } = req.body || {};
  validateOrderRequest(order);
  const verification = await paystack.verifyPayment(reference);
  const expectedAmount = Math.round(Number(order.totalPrice) * 100);
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
