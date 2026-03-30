const { body } = require('express-validator');

exports.validateCreate = [
  body('name').notEmpty().withMessage('Supplier name is required'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
];

exports.validateMapProduct = [
  body('product_id').notEmpty().withMessage('product_id is required'),
  body('suppliers').isArray({ min: 1 }).withMessage('suppliers must be a non-empty array'),
  body('suppliers.*.supplier_id').notEmpty().withMessage('Each supplier must have a supplier_id'),
  body('suppliers.*.priority').optional().isInt({ min: 1 }).withMessage('priority must be a positive integer'),
];
