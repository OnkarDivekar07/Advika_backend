const { body } = require('express-validator');

exports.validateBilling = [
  body().isArray({ min: 1 }).withMessage('Billing data must be a non-empty array'),
];
