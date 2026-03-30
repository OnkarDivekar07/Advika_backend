const { body, param } = require('express-validator');

exports.validateUpdate = [
  body('change')
    .isInt()
    .withMessage('change must be an integer (positive to increment, negative to decrement)'),
];

exports.validateDate = [
  param('date').isISO8601().withMessage('date must be a valid YYYY-MM-DD format'),
];
