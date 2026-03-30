const express = require('express');
const router = express.Router();
const ctrl = require('./qr.controller');
const { validateGenerateQR } = require('./qr.validation');
const validateRequest = require('@middlewares/validateRequest');
const authenticate = require('@middlewares/authenticate');
const authorizeAdmin = require('@middlewares/authorizeAdmin');

router.post('/generate', authenticate, authorizeAdmin, validateGenerateQR, validateRequest, ctrl.generateQR);

module.exports = router;
