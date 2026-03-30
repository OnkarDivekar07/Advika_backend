const express = require('express');
const router = express.Router();
const ctrl = require('./finance.controller');
const authenticate = require('@middlewares/authenticate');
const authorizeAdmin = require('@middlewares/authorizeAdmin');

router.get('/summary', authenticate, authorizeAdmin, ctrl.getFinanceSummary);

module.exports = router;
