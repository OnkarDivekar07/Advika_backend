const { body } = require('express-validator');

exports.validateSendOTP = [
  body('email').isEmail().withMessage('Valid email is required'),
];

exports.validateVerifyOTP = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').notEmpty().withMessage('OTP is required'),
];

exports.validateLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];
