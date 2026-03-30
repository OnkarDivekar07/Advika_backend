const express = require('express');
const router = express.Router();
const ctrl = require('./email.controller');
const authenticate = require('@middlewares/authenticate');
const authorizeAdmin = require('@middlewares/authorizeAdmin');

router.post('/low-stock', authenticate, authorizeAdmin, ctrl.sendLowStockEmail);

module.exports = router;
