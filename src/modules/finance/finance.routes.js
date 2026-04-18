const express = require('express');
const router  = express.Router();
const ctrl    = require('./finance.controller');
const authenticate    = require('@middlewares/authenticate');
const authorizeAdmin  = require('@middlewares/authorizeAdmin');

// Original route — untouched
router.get('/summary',      authenticate, authorizeAdmin, ctrl.getFinanceSummary);

// Profit First routes
router.get('/profit-first',         authenticate, authorizeAdmin, ctrl.getProfitFirstSummary);
router.post('/profit-first',        authenticate, authorizeAdmin, ctrl.upsertProfitFirstEntry);
router.get('/profit-first/months',  authenticate, authorizeAdmin, ctrl.getAvailableMonths);

module.exports = router;
