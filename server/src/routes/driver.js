const express = require('express');
const prisma = require('../prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler, httpError, toJson } = require('../utils/respond');

const router = express.Router();
router.use(requireAuth, requireRole('DRIVER'));

const orderInclude = { restaurant: true, items: true };

async function driverName(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  return user?.name || email;
}

router.get('/orders/available', asyncHandler(async (_req, res) => {
  const orders = await prisma.order.findMany({
    where: { driverName: null, status: { in: ['PENDING', 'PREPARING', 'READY'] } },
    include: orderInclude,
    orderBy: { createdAt: 'desc' }
  });
  res.json(toJson(orders));
}));

router.get('/orders/my-active', asyncHandler(async (req, res) => {
  const name = await driverName(req.user.sub);
  const order = await prisma.order.findFirst({
    where: { driverName: { equals: name, mode: 'insensitive' }, status: 'DELIVERING' },
    include: orderInclude
  });
  res.json(toJson(order));
}));

router.get('/orders/history', asyncHandler(async (req, res) => {
  const name = await driverName(req.user.sub);
  const orders = await prisma.order.findMany({
    where: { driverName: { equals: name, mode: 'insensitive' } },
    include: orderInclude,
    orderBy: { createdAt: 'desc' }
  });
  res.json(toJson(orders));
}));

router.put('/orders/:id/accept', asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) } });
  if (!order) throw httpError('Order not found.', 404);
  if (order.driverName) throw httpError('This delivery has already been accepted by another courier.');
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { driverName: await driverName(req.user.sub), status: 'DELIVERING' },
    include: orderInclude
  });
  res.json(toJson(updated));
}));

router.put('/orders/:id/location', asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) } });
  if (!order) throw httpError('Order not found.', 404);
  const name = await driverName(req.user.sub);
  if (String(order.driverName || '').toLowerCase() !== name.toLowerCase()) {
    throw httpError('Access denied. You are not assigned to this delivery.', 403);
  }
  if (req.body.latitude == null || req.body.longitude == null) throw httpError('Latitude and longitude are required.');
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      driverLatitude: Number(req.body.latitude),
      driverLongitude: Number(req.body.longitude),
      driverLocationUpdatedAt: new Date()
    },
    include: orderInclude
  });
  res.json(toJson(updated));
}));

router.put('/orders/:id/complete', asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) } });
  if (!order) throw httpError('Order not found.', 404);
  const name = await driverName(req.user.sub);
  if (String(order.driverName || '').toLowerCase() !== name.toLowerCase()) {
    throw httpError('Access denied. You are not assigned to this delivery.', 403);
  }
  const updated = await prisma.order.update({ where: { id: order.id }, data: { status: 'DELIVERED' }, include: orderInclude });
  res.json(toJson(updated));
}));

module.exports = router;
