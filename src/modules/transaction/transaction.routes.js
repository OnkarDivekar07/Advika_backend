const express = require('express');
const router = express.Router();
const ctrl = require('./transaction.controller');
const { validateBilling } = require('./transaction.validation');
const validateRequest = require('@middlewares/validateRequest');
const authenticate = require('@middlewares/authenticate');
const authorizeAdmin = require('@middlewares/authorizeAdmin');

router.post('/billing',            authenticate, authorizeAdmin, validateBilling, validateRequest, ctrl.billing);
router.patch('/rollback/:id',      authenticate, authorizeAdmin, ctrl.rollbackTransaction);
router.get('/daily',               authenticate, authorizeAdmin, ctrl.getDailyTransactions);
router.get('/summary',             authenticate, authorizeAdmin, ctrl.getDailySummary);
router.get('/entries',             authenticate, authorizeAdmin, ctrl.getDailyEntries);
router.get('/page/daily',          ctrl.dailyTransactionPage);
router.get('/page/stock',          ctrl.stockPage);

module.exports = router;
