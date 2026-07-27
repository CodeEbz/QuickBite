const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../prisma');
const { requireAuth } = require('../middleware/auth');
const { upload, storeImage } = require('../middleware/upload');
const { asyncHandler, httpError, toJson } = require('../utils/respond');

const router = express.Router();
router.use(requireAuth);

router.get('/me', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { email: req.user.sub },
    select: { id: true, name: true, email: true, role: true, verified: true, phone: true, profileImage: true, createdAt: true }
  });
  res.json(toJson(user));
}));
router.put('/me', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.user.sub } });
  if (!user) throw httpError('User not found.', 404);

  const data = {};
  if (req.body.name !== undefined) {
    const name = String(req.body.name || '').trim();
    if (!name) throw httpError('Name cannot be empty.');
    data.name = name;
  }
  if (req.body.phone !== undefined) {
    const phone = String(req.body.phone || '').trim();
    data.phone = phone || null;
  }
  if (req.body.password) {
    const password = String(req.body.password);
    if (password.length < 6) throw httpError('Password must be at least 6 characters.');
    data.password = await bcrypt.hash(password, 10);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: { id: true, name: true, email: true, role: true, verified: true, phone: true, profileImage: true, createdAt: true }
  });

  if (updated.role === 'RESTAURANT' && data.name) {
    await prisma.restaurant.updateMany({ where: { email: updated.email }, data: { ownerName: updated.name } });
  }

  res.json(toJson(updated));
}));
router.post('/me/profile-image', upload.single('file'), asyncHandler(async (req, res) => {
  const image = await storeImage(req.file, 'profiles', req);
  const user = await prisma.user.update({
    where: { email: req.user.sub },
    data: { profileImage: image },
    select: { id: true, name: true, email: true, role: true, verified: true, phone: true, profileImage: true, createdAt: true }
  });
  res.json(toJson(user));
}));

module.exports = router;


