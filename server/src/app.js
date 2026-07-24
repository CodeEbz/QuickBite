const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const config = require('./config');
const { toJson } = require('./utils/respond');

const app = express();

app.use(cors({
  origin: (_origin, cb) => cb(null, true),
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(process.cwd(), config.uploadDir)));

app.get('/', (_req, res) => res.json({ name: 'QuickBite API', status: 'ok' }));
app.get('/health', (_req, res) => res.json({ status: 'UP' }));
app.get('/actuator/health', (_req, res) => res.json({ status: 'UP' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/customer', require('./routes/customer'));
app.use('/api/merchant', require('./routes/merchant'));
app.use('/api/driver', require('./routes/driver'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/users', require('./routes/users'));

app.use((_req, _res, next) => {
  const error = new Error('Route not found.');
  error.status = 404;
  next(error);
});

app.use((error, _req, res, _next) => {
  const status = error.status || error.response?.status || 500;
  const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Server error.';
  if (status >= 500) console.error(error);
  res.status(status).json(toJson({ error: message, message }));
});

module.exports = app;
