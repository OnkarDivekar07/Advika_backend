const express = require('express');
const router  = express.Router();

const ctrl = require('./expense.controller');

const { validateCreate, validateUpdate } = require('./expense.validation');
const validateRequest = require('@middlewares/validateRequest');
const authenticate    = require('@middlewares/authenticate');
const authorizeAdmin  = require('@middlewares/authorizeAdmin');

// ─────────────────────────────────────────────────────────────
// 🔐 सुरक्षा (all routes protected)
// ─────────────────────────────────────────────────────────────
router.use(authenticate, authorizeAdmin);

// ─────────────────────────────────────────────────────────────
// 📊 Reports / Analytics
// ─────────────────────────────────────────────────────────────

// GET /expenses/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/summary', ctrl.getSummary);

// Optional (used elsewhere in your UI)
router.get('/profit-loss', ctrl.getProfitLoss);
router.get('/balance-sheet', ctrl.getRealBalanceSheet);

// ─────────────────────────────────────────────────────────────
// 📦 Collection (LIST + CREATE)
// ─────────────────────────────────────────────────────────────

// GET /expenses?from&to
// POST /expenses
router
  .route('/')
  .get(ctrl.getAll)
  .post(validateCreate, validateRequest, ctrl.create);

// ─────────────────────────────────────────────────────────────
// 📄 Single Expense
// ─────────────────────────────────────────────────────────────

// PUT /expenses/:id
// DELETE /expenses/:id
router
  .route('/:id')
  .put(validateUpdate, validateRequest, ctrl.update)
  .delete(ctrl.remove);

module.exports = router;