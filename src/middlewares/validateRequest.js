const { validationResult } = require('express-validator');
const CustomError = require('@utils/customError');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map((err) => ({
      field: err.path ?? err.param,
      message: err.msg,
    }));
    // Must use next() — Express 4 does NOT catch synchronous throws in middleware
    return next(new CustomError('Validation failed', 422, errorDetails));
  }

  next();
};

module.exports = validateRequest;
