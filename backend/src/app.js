const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const ApiError = require('./utils/ApiError');

const app = express();

app.use(cors({ origin: env.CLIENT_URL }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Helpdesk API is running' });
});

app.use('/api', routes);

app.use((req, res, next) => {
  next(new ApiError(404, 'Route not found'));
});

app.use(errorHandler);

module.exports = app;
