const express = require('express');
const router = express.Router();
const ctrl = require('./user.controller');
const { validateSendOTP, validateVerifyOTP, validateLogin } = require('./user.validation');
const validateRequest = require('@middlewares/validateRequest');

router.post('/send-otp',    validateSendOTP,    validateRequest, ctrl.sendOTP);
router.post('/verify-otp',  validateVerifyOTP,  validateRequest, ctrl.verifyOTP);
router.post('/login',       validateLogin,      validateRequest, ctrl.loginWithPassword);

module.exports = router;
