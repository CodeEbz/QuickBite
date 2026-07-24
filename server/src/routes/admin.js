const express = require('express');
const prisma = require('../prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler, toJson, httpError } = require('../utils/respond');

const router = express.Router();
router.use(requireAuth, requireRole('ADMIN'));

const orderInclude = { restaurant: true, items: true };

router.get('/stats', asyncHandler(async (_req, res) => {
  const [totalRestaurants, totalOrders, activeDrivers, pendingApprovals, delivered] = await Promise.all([
    prisma.restaurant.count(),
    prisma.order.count(),
    prisma.user.count({ where: { role: 'DRIVER' } }),
    prisma.restaurant.count({ where: { status: 'PENDING_APPROVAL' } }),
    prisma.order.findMany({ where: { status: 'DELIVERED' }, select: { totalPrice: true } })
  ]);
  const totalRevenue = delivered.reduce((sum, order) => sum + Number(order.totalPrice), 0);
  res.json({ totalRevenue, totalOrders, activeDrivers, pendingApprovals, totalRestaurants });
}));

router.get('/restaurants', asyncHandler(async (_req, res) => {
  const restaurants = await prisma.restaurant.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(toJson(restaurants));
}));

router.put('/restaurants/:id/status', asyncHandler(async (req, res) => {
  const restaurant = await prisma.restaurant.update({
    where: { id: Number(req.params.id) },
    data: { status: String(req.query.status || req.body.status).toUpperCase() }
  });
  res.json(toJson(restaurant));
}));

router.get('/orders', asyncHandler(async (_req, res) => {
  const orders = await prisma.order.findMany({ include: orderInclude, orderBy: { createdAt: 'desc' } });
  res.json(toJson(orders));
}));

router.put('/orders/:id/cancel', asyncHandler(async (req, res) => {
  const order = await prisma.order.update({
    where: { id: Number(req.params.id) },
    data: { status: 'CANCELLED' },
    include: orderInclude
  });
  res.json(toJson(order));
}));

router.get('/users', asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, role: true, verified: true, profileImage: true, createdAt: true }
  });
  res.json(toJson(users));
}));

router.put('/users/:id/verify', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
  if (!user) throw httpError('User not found.', 404);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { verified: !user.verified },
    select: { id: true, name: true, email: true, role: true, verified: true, profileImage: true, createdAt: true }
  });
  res.json(toJson(updated));
}));

module.exports = router;
