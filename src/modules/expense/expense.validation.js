const { body } = require('express-validator');

const EXPENSE_TYPES   = ['purchase', 'transport', 'miscellaneous'];
const PAYMENT_METHODS = ['cash', 'online'];

exports.validateCreate = [
  body('expense_type')
    .isIn(EXPENSE_TYPES).withMessage('expense_type must be purchase | transport | miscellaneous'),

  body('description')
    .trim().notEmpty().withMessage('description is required'),

  body('payment_method')
    .isIn(PAYMENT_METHODS).withMessage('payment_method must be cash | online'),

  body('total_bill')
    .optional()
    .isFloat({ gt: 0 }).withMessage('total_bill must be a positive number'),

  body('unit_cost')
    .optional()
    .isFloat({ gt: 0 }).withMessage('unit_cost must be a positive number'),

  body('quantity')
    .optional()
    .isInt({ gt: 0 }).withMessage('quantity must be a positive integer'),

  body('supplier_id')
    .optional().isString(),

  body('notes')
    .optional().isString(),

  body('expense_date')
    .optional().isISO8601().withMessage('expense_date must be a valid date'),
];

// All fields optional for partial updates
exports.validateUpdate = [
  body('expense_type')
    .optional()
    .isIn(EXPENSE_TYPES).withMessage('expense_type must be purchase | transport | miscellaneous'),

  body('description')
    .optional().trim().notEmpty().withMessage('description cannot be empty'),

  body('payment_method')
    .optional()
    .isIn(PAYMENT_METHODS).withMessage('payment_method must be cash | online'),

  body('total_bill')
    .optional()
    .isFloat({ gt: 0 }).withMessage('total_bill must be a positive number'),

  body('unit_cost')
    .optional()
    .isFloat({ gt: 0 }).withMessage('unit_cost must be a positive number'),

  body('quantity')
    .optional()
    .isInt({ gt: 0 }).withMessage('quantity must be a positive integer'),

  body('supplier_id')
    .optional().isString(),

  body('notes')
    .optional().isString(),

  body('expense_date')
    .optional().isISO8601().withMessage('expense_date must be a valid date'),
];
