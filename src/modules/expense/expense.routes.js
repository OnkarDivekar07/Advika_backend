const express = require('express');
const router  = express.Router();
const ctrl    = require('./expense.controller');
const { validateCreate, validateUpdate } = require('./expense.validation');
const validateRequest = require('@middlewares/validateRequest');
const authenticate    = require('@middlewares/authenticate');
const authorizeAdmin  = require('@middlewares/authorizeAdmin');

router.use(authenticate, authorizeAdmin);

// ── Named routes MUST come before /:id to avoid param capture ─────────────
router.get('/summary',          ctrl.getSummary);
router.get('/expense-summary',  ctrl.getSummary);       // alias: old frontend path
router.get('/profit-loss',      ctrl.getProfitLoss);
router.get('/balance-sheet',    ctrl.getRealBalanceSheet);
router.get('/real-balance-sheet', ctrl.getRealBalanceSheet); // alias

// ── Collection routes ──────────────────────────────────────────────────────
router.get('/expenses',         ctrl.getAll);            // alias: old frontend path
router.get('/',                 ctrl.getAll);
router.post('/expense',         validateCreate, validateRequest, ctrl.create); // alias: old frontend path
router.post('/',                validateCreate, validateRequest, ctrl.create);

// ── Single-resource routes ─────────────────────────────────────────────────
router.put('/:id',              validateUpdate, validateRequest, ctrl.update);
router.delete('/expense/:id',   ctrl.remove);           // alias: old frontend path
router.delete('/:id',           ctrl.remove);

module.exports = router;
