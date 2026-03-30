const { body, param } = require('express-validator');

exports.validateUpdateItem = [
  body('qty').isInt({ gt: 0 }).withMessage('qty must be a positive integer'),
];
