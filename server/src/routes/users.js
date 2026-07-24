const express = require('express');
const prisma = require('../prisma');
const { requireAuth } = require('../middleware/auth');
const { upload, storeImage } = require('../middleware/upload');
const { asyncHandler, toJson } = require('../utils/respond');

const router = express.Router();
router.use(requireAuth);

router.get('/me', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { email: req.user.sub },
    select: { id: true, name: true, email: true, role: true, verified: true, profileImage: true, createdAt: true }
  });
  res.json(toJson(user));
}));

router.post('/me/profile-image', upload.single('file'), asyncHandler(async (req, res) => {
  const image = await storeImage(req.file, 'profiles', req);
  const user = await prisma.user.update({
    where: { email: req.user.sub },
    data: { profileImage: image },
    select: { id: true, name: true, email: true, role: true, verified: true, profileImage: true, createdAt: true }
  });
  res.json(toJson(user));
}));

module.exports = router;
