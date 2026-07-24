const express = require('express');
const prisma = require('../prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload, storeImage } = require('../middleware/upload');
const { asyncHandler, httpError, toJson } = require('../utils/respond');

const router = express.Router();

async function saveMessage({ restaurant, customerEmail, customerName, senderRole, message, file, req }) {
  if ((!message || !String(message).trim()) && !file) throw httpError('Send a message or attach an image.');
  const imageUrl = file ? await storeImage(file, 'chat', req) : null;
  return prisma.chatMessage.create({
    data: {
      restaurantId: restaurant.id,
      customerEmail,
      customerName,
      senderRole,
      message: message ? String(message).trim() : '',
      imageUrl
    },
    include: { restaurant: true }
  });
}

router.get('/customer', requireAuth, requireRole('CUSTOMER'), asyncHandler(async (req, res) => {
  const messages = await prisma.chatMessage.findMany({
    where: { customerEmail: req.user.sub },
    include: { restaurant: true },
    orderBy: { createdAt: 'asc' }
  });
  res.json(toJson(messages));
}));

router.get('/customer/restaurants/:restaurantId', requireAuth, requireRole('CUSTOMER'), asyncHandler(async (req, res) => {
  const messages = await prisma.chatMessage.findMany({
    where: { restaurantId: Number(req.params.restaurantId), customerEmail: req.user.sub },
    include: { restaurant: true },
    orderBy: { createdAt: 'asc' }
  });
  res.json(toJson(messages));
}));

router.post('/customer/restaurants/:restaurantId', requireAuth, requireRole('CUSTOMER'), upload.single('file'), asyncHandler(async (req, res) => {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: Number(req.params.restaurantId) } });
  if (!restaurant) throw httpError('Restaurant not found.', 404);
  const user = await prisma.user.findUnique({ where: { email: req.user.sub } });
  const message = await saveMessage({
    restaurant,
    customerEmail: req.user.sub,
    customerName: user?.name || req.user.sub,
    senderRole: 'CUSTOMER',
    message: req.body.message,
    file: req.file,
    req
  });
  res.json(toJson(message));
}));

router.get('/merchant', requireAuth, requireRole('RESTAURANT'), asyncHandler(async (req, res) => {
  const restaurant = await prisma.restaurant.findUnique({ where: { email: req.user.sub } });
  if (!restaurant) throw httpError('Restaurant not found.', 404);
  const messages = await prisma.chatMessage.findMany({
    where: { restaurantId: restaurant.id },
    include: { restaurant: true },
    orderBy: { createdAt: 'asc' }
  });
  res.json(toJson(messages));
}));

router.post('/merchant/customers/:customerEmail', requireAuth, requireRole('RESTAURANT'), upload.single('file'), asyncHandler(async (req, res) => {
  const restaurant = await prisma.restaurant.findUnique({ where: { email: req.user.sub } });
  if (!restaurant) throw httpError('Restaurant not found.', 404);
  const customerEmail = decodeURIComponent(req.params.customerEmail);
  const customer = await prisma.user.findUnique({ where: { email: customerEmail } });
  if (!customer) throw httpError('Customer not found.', 404);
  const message = await saveMessage({
    restaurant,
    customerEmail: customer.email,
    customerName: customer.name,
    senderRole: 'MERCHANT',
    message: req.body.message,
    file: req.file,
    req
  });
  res.json(toJson(message));
}));

module.exports = router;
