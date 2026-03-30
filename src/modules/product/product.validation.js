const { body } = require('express-validator');

const ALLOWED_UNITS = ['pcs', 'jodi', 'dozen'];

exports.validateAddProduct = [
  body('*.name').if(body('*').isArray()).optional().isString().trim().notEmpty().withMessage('Product name is required'),
  body('name').if(body('name').exists()).isString().trim().notEmpty().withMessage('Product name is required'),
  body('price').optional().isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
  body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be non-negative'),
];

exports.validateUpdateProduct = [
  body('name').optional().isString().trim().notEmpty().withMessage('Name cannot be empty'),
  body('price').optional().isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
  body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be non-negative'),
  body('lower_threshold').optional().isInt({ min: 0 }).withMessage('lower_threshold must be non-negative'),
  body('upper_threshold').optional().isInt({ min: 0 }).withMessage('upper_threshold must be non-negative'),
];

exports.validateAddStock = [
  body('productId').notEmpty().withMessage('productId is required'),
  body('addQuantity').isInt({ gt: 0 }).withMessage('addQuantity must be a positive integer'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be non-negative'),
];

exports.validateUpdateUnit = [
  body('defaultUnit')
    .notEmpty()
    .isIn(ALLOWED_UNITS)
    .withMessage(`defaultUnit must be one of: ${ALLOWED_UNITS.join(', ')}`),
];

exports.validateMarathiName = [
  body('marathiName').notEmpty().withMessage('marathiName is required'),
];
