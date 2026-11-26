const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

async function register({ name, email, password }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, 'Email already registered');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: 'USER',
  });

  return {
    user: publicUser(user),
    token: signToken(user),
  };
}

async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const matches = await user.comparePassword(password);
  if (!matches) {
    throw new ApiError(401, 'Invalid email or password');
  }

  return {
    user: publicUser(user),
    token: signToken(user),
  };
}

module.exports = {
  register,
  login,
};
