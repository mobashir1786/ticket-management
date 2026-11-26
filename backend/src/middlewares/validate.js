const ApiError = require('../utils/ApiError');

function validate(schema) {
  return function validateRequest(req, res, next) {
    const result = schema.safeParse({
      body: req.body || {},
      query: req.query || {},
      params: req.params || {},
    });

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new ApiError(400, 'Validation failed', errors));
    }

    req.validated = result.data;
    return next();
  };
}

module.exports = validate;
