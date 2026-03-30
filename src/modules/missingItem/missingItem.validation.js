const { body } = require('express-validator');

exports.validateCreate = [
  body('name').notEmpty().withMessage('Item name is required'),
];
