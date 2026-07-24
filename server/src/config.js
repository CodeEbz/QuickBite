require('dotenv').config();

function readNumber(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`${name} must be a number.`);
  }
  return parsed;
}

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 8080),
  jwtSecret: process.env.JWT_SECRET || 'dev-only-replace-this-secret',
  jwtExpiration: process.env.JWT_EXPIRATION || '1d',
  autoVerifySignups: String(process.env.AUTH_AUTO_VERIFY_SIGNUPS || 'false').toLowerCase() === 'true',
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || '',
  paystackBaseUrl: process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co',
  paystackCurrency: process.env.PAYSTACK_CURRENCY || 'NGN',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  publicBaseUrl: process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 8080}`,
  allowedOrigins: (process.env.WEB_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  appBaseUrl: process.env.APP_BASE_URL || 'quickbite://payment-callback',
  deliveryFee: readNumber('DELIVERY_FEE', 2.5),
  taxRate: readNumber('TAX_RATE', 0.08),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || ''
  }
};

function validateProductionConfig() {
  if (config.nodeEnv !== 'production') return;

  const missing = [];
  if (!process.env.DATABASE_URL) missing.push('DATABASE_URL');
  if (!process.env.JWT_SECRET || config.jwtSecret === 'dev-only-replace-this-secret') missing.push('JWT_SECRET');
  if (!config.paystackSecretKey) missing.push('PAYSTACK_SECRET_KEY');
  if (!config.publicBaseUrl) missing.push('PUBLIC_BASE_URL');
  if (!config.cloudinary.cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
  if (!config.cloudinary.apiKey) missing.push('CLOUDINARY_API_KEY');
  if (!config.cloudinary.apiSecret) missing.push('CLOUDINARY_API_SECRET');

  if (missing.length) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }
}

validateProductionConfig();

module.exports = config;
