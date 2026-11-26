const express = require('express');
const authRoutes = require('./authRoutes');
const ticketRoutes = require('./ticketRoutes');
const connectDb = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

const ensureDatabase = asyncHandler(async (req, res, next) => {
  await connectDb();
  next();
});

router.use('/auth', ensureDatabase, authRoutes);
router.use('/tickets', ensureDatabase, ticketRoutes);

module.exports = router;
