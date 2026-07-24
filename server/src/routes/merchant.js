const express = require('express');
const prisma = require('../prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload, storeImage } = require('../middleware/upload');
const { asyncHandler, httpError, toJson } = require('../utils/respond');

const router = express.Router();
router.use(requireAuth, requireRole('RESTAURANT'));

const orderInclude = { restaurant: true, items: true };

async function myRestaurant(email) {
  const restaurant = await prisma.restaurant.findUnique({ where: { email } });
  if (!restaurant) throw httpError(`No restaurant profile associated with this account email: ${email}`, 404);
  return restaurant;
}

router.get('/profile', asyncHandler(async (req, res) => {
  res.json(toJson(await myRestaurant(req.user.sub)));
}));

router.put('/profile', asyncHandler(async (req, res) => {
  const restaurant = await myRestaurant(req.user.sub);
  const updated = await prisma.restaurant.update({
    where: { id: restaurant.id },
    data: {
      name: req.body.name ?? restaurant.name,
      cuisineType: req.body.cuisineType ?? restaurant.cuisineType,
      image: req.body.image ?? restaurant.image
    }
  });
  res.json(toJson(updated));
}));

router.post('/profile/image', upload.single('file'), asyncHandler(async (req, res) => {
  const restaurant = await myRestaurant(req.user.sub);
  const image = await storeImage(req.file, 'restaurants', req);
  const updated = await prisma.restaurant.update({ where: { id: restaurant.id }, data: { image } });
  res.json(toJson(updated));
}));

router.get('/menu', asyncHandler(async (req, res) => {
  const restaurant = await myRestaurant(req.user.sub);
  const items = await prisma.menuItem.findMany({ where: { restaurantId: restaurant.id }, orderBy: { name: 'asc' } });
  res.json(toJson(items));
}));

router.post('/menu', asyncHandler(async (req, res) => {
  const restaurant = await myRestaurant(req.user.sub);
  const item = await prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      name: req.body.name,
      description: req.body.description || '',
      price: Number(req.body.price || 0),
      image: req.body.image || null,
      category: req.body.category || 'General'
    }
  });
  res.json(toJson(item));
}));

router.post('/menu/images', upload.single('file'), asyncHandler(async (req, res) => {
  const imageUrl = await storeImage(req.file, 'menu', req);
  res.json({ imageUrl });
}));

router.post('/menu/:id/image', upload.single('file'), asyncHandler(async (req, res) => {
  const restaurant = await myRestaurant(req.user.sub);
  const item = await prisma.menuItem.findUnique({ where: { id: Number(req.params.id) } });
  if (!item) throw httpError('Menu item not found.', 404);
  if (item.restaurantId !== restaurant.id) throw httpError('Access denied. You do not own this menu item.', 403);
  const image = await storeImage(req.file, 'menu', req);
  const updated = await prisma.menuItem.update({ where: { id: item.id }, data: { image } });
  res.json(toJson(updated));
}));

router.put('/menu/:id', asyncHandler(async (req, res) => {
  const restaurant = await myRestaurant(req.user.sub);
  const item = await prisma.menuItem.findUnique({ where: { id: Number(req.params.id) } });
  if (!item) throw httpError('Menu item not found.', 404);
  if (item.restaurantId !== restaurant.id) throw httpError('Access denied. You do not own this menu item.', 403);
  const updated = await prisma.menuItem.update({
    where: { id: item.id },
    data: {
      name: req.body.name ?? item.name,
      description: req.body.description ?? item.description,
      price: req.body.price === undefined ? item.price : Number(req.body.price),
      image: req.body.image ?? item.image,
      category: req.body.category ?? item.category
    }
  });
  res.json(toJson(updated));
}));

router.delete('/menu/:id', asyncHandler(async (req, res) => {
  const restaurant = await myRestaurant(req.user.sub);
  const item = await prisma.menuItem.findUnique({ where: { id: Number(req.params.id) } });
  if (!item) throw httpError('Menu item not found.', 404);
  if (item.restaurantId !== restaurant.id) throw httpError('Access denied. You do not own this menu item.', 403);
  await prisma.menuItem.delete({ where: { id: item.id } });
  res.json('Menu item deleted successfully');
}));

router.get('/orders', asyncHandler(async (req, res) => {
  const restaurant = await myRestaurant(req.user.sub);
  const orders = await prisma.order.findMany({
    where: { restaurantId: restaurant.id },
    include: orderInclude,
    orderBy: { createdAt: 'desc' }
  });
  res.json(toJson(orders));
}));

router.put('/orders/:id/status', asyncHandler(async (req, res) => {
  const restaurant = await myRestaurant(req.user.sub);
  const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) } });
  if (!order) throw httpError('Order not found.', 404);
  if (order.restaurantId !== restaurant.id) throw httpError('Access denied. This order was not placed at your restaurant.', 403);
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: String(req.query.status || req.body.status).toUpperCase() },
    include: orderInclude
  });
  res.json(toJson(updated));
}));

module.exports = router;
