function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function httpError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function toJson(value) {
  return JSON.parse(JSON.stringify(value, (_key, current) => {
    if (current && typeof current === 'object' && current.constructor?.name === 'Decimal') {
      return Number(current.toString());
    }
    return current;
  }));
}

module.exports = { asyncHandler, httpError, toJson };
