const ApiError = require('../utils/ApiError');
const { ZodError } = require('zod');

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.flatten(),
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON body',
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Email already registered',
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid id',
    });
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}

module.exports = errorHandler;
