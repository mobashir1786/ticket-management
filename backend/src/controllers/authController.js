const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');

const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.validated.body);
  res.status(201).json({ success: true, data });
});

const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.validated.body);
  res.status(200).json({ success: true, data });
});

module.exports = {
  register,
  login,
};
