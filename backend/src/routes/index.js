const express = require('express');
const authRoutes = require('./authRoutes');
const ticketRoutes = require('./ticketRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/tickets', ticketRoutes);

module.exports = router;
