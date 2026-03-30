const { body } = require('express-validator');

exports.validateGenerateQR = [
  body('productId').notEmpty().withMessage('productId is required'),
];
