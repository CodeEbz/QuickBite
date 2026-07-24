const jwt = require('jsonwebtoken');
const config = require('../config');
const { httpError } = require('../utils/respond');

function signToken(user) {
  return jwt.sign({ sub: user.email, role: user.role, name: user.name }, config.jwtSecret, {
    expiresIn: config.jwtExpiration
  });
}

function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(httpError('Missing authorization token.', 401));

  try {
    req.user = jwt.verify(token, config.jwtSecret);
    return next();
  } catch (_error) {
    return next(httpError('Invalid or expired token.', 401));
  }
}

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(httpError('Access denied.', 403));
    }
    return next();
  };
}

module.exports = { signToken, requireAuth, requireRole };
