const ApiError = require('../utils/ApiError');

function authorize(...roles) {
  return function checkRole(req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    return next();
  };
}

module.exports = authorize;
