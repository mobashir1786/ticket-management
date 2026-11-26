const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'Authentication required');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired token');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, 'Invalid or expired token');
  }

  req.user = user;
  next();
});

module.exports = authenticate;
