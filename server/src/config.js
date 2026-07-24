require('dotenv').config();

const config = {
  port: Number(process.env.PORT || 8080),
  jwtSecret: process.env.JWT_SECRET || 'dev-only-replace-this-secret',
  jwtExpiration: process.env.JWT_EXPIRATION || '1d',
  autoVerifySignups: String(process.env.AUTH_AUTO_VERIFY_SIGNUPS || 'false').toLowerCase() === 'true',
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || '',
  paystackBaseUrl: process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co',
  paystackCurrency: process.env.PAYSTACK_CURRENCY || 'NGN',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  publicBaseUrl: process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 8080}`,
  webOrigin: process.env.WEB_ORIGIN || 'http://localhost:3000',
  appBaseUrl: process.env.APP_BASE_URL || 'quickbite://payment-callback',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || ''
  }
};

module.exports = config;
