const { body } = require('express-validator');

exports.validateCreate = [
  body('supplierName').notEmpty().withMessage('supplierName is required'),
  body('contactDetails').notEmpty().withMessage('contactDetails is required'),
  body('amountOwed').isFloat({ gt: 0 }).withMessage('amountOwed must be greater than 0'),
  body('dueDate').isISO8601().withMessage('dueDate must be a valid date'),
];
