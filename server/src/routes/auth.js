const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../prisma');
const config = require('../config');
const { signToken } = require('../middleware/auth');
const { asyncHandler, httpError } = require('../utils/respond');

const router = express.Router();

function authResponse(user) {
  return {
    token: signToken(user),
    role: user.role,
    name: user.name,
    profileImage: user.profileImage || null
  };
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function setOtp(userId, email) {
  const otp = generateOtp();
  await prisma.user.update({
    where: { id: userId },
    data: { otp, otpExpiry: new Date(Date.now() + 10 * 60 * 1000) }
  });
  console.log(`QuickBite OTP for ${email}: ${otp}`);
}

router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password, role = 'CUSTOMER' } = req.body || {};
  if (!name || !email || !password) throw httpError('Name, email and password are required.');
  const normalizedRole = String(role).toUpperCase();
  if (normalizedRole === 'ADMIN') throw httpError('Admin accounts cannot be created from public signup.');
  if (normalizedRole === 'RESTAURANT') throw httpError('Use merchant registration to create a restaurant account.');
  if (!['CUSTOMER', 'DRIVER'].includes(normalizedRole)) throw httpError('Unsupported account role.');

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw httpError('Email already in use.');

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: await bcrypt.hash(password, 10),
      role: normalizedRole,
      verified: config.autoVerifySignups
    }
  });

  if (config.autoVerifySignups) {
    return res.json({ message: 'Registration successful.', email, requiresOtp: false, auth: authResponse(user) });
  }
  await setOtp(user.id, email);
  return res.json({ message: 'Registration successful. Check your email for OTP.', email, requiresOtp: true, auth: null });
}));

router.post('/resend-otp', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body?.email || '' } });
  if (!user) throw httpError('User not found.', 404);
  if (user.verified) return res.json('Account is already verified.');
  await setOtp(user.id, user.email);
  return res.json('A new verification code has been sent.');
}));

router.post('/verify-otp', asyncHandler(async (req, res) => {
  const { email, otp } = req.body || {};
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw httpError('User not found.', 404);
  if (user.verified) return res.json('Already verified');
  if (user.otp !== otp) throw httpError('Invalid OTP.');
  if (!user.otpExpiry || user.otpExpiry < new Date()) throw httpError('OTP expired.');
  await prisma.user.update({ where: { id: user.id }, data: { verified: true, otp: null, otpExpiry: null } });
  return res.json('Email verified successfully');
}));

router.post('/register-merchant', asyncHandler(async (req, res) => {
  const { ownerName, email, password, restaurantName, cuisineType } = req.body || {};
  if (!ownerName || !email || !password || !restaurantName) throw httpError('Owner, email, password and restaurant name are required.');
  if (await prisma.user.findUnique({ where: { email } })) throw httpError('Email already registered.');

  const user = await prisma.user.create({
    data: { name: ownerName, email, password: await bcrypt.hash(password, 10), role: 'RESTAURANT', verified: true }
  });
  await prisma.restaurant.create({
    data: {
      name: restaurantName,
      email,
      ownerName,
      cuisineType: cuisineType || 'General',
      status: 'PENDING_APPROVAL',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'
    }
  });
  return res.json(authResponse(user));
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password || '', user.password))) throw httpError('Invalid credentials.', 401);
  if (!user.verified) throw httpError('Please verify your email first.');
  return res.json(authResponse(user));
}));

module.exports = router;
