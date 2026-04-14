const express = require('express');
const router  = express.Router();
const ctrl    = require('./expense.controller');
const { validateCreate, validateUpdate } = require('./expense.validation');
const validateRequest = require('@middlewares/validateRequest');
const authenticate    = require('@middlewares/authenticate');
const authorizeAdmin  = require('@middlewares/authorizeAdmin');

router.use(authenticate, authorizeAdmin);

router.get('/summary',       ctrl.getSummary);
router.get('/profit-loss',   ctrl.getProfitLoss);
router.get('/balance-sheet', ctrl.getRealBalanceSheet);
router.get('/',              ctrl.getAll);
router.post('/',             validateCreate, validateRequest, ctrl.create);
router.put('/:id',           validateUpdate, validateRequest, ctrl.update);
router.delete('/:id',        ctrl.remove);

module.exports = router;
