const express = require('express');
const router = express.Router();
const ctrl = require('./repayment.controller');
const { validateCreate } = require('./repayment.validation');
const validateRequest = require('@middlewares/validateRequest');
const authenticate = require('@middlewares/authenticate');
const authorizeAdmin = require('@middlewares/authorizeAdmin');

router.get('/',        authenticate, authorizeAdmin, ctrl.getAll);
router.get('/page',    ctrl.repaymentPage);
router.get('/:id',     authenticate, authorizeAdmin, ctrl.getById);
router.post('/',       authenticate, authorizeAdmin, validateCreate, validateRequest, ctrl.create);
router.put('/:id',     authenticate, authorizeAdmin, ctrl.update);
router.delete('/:id',  authenticate, authorizeAdmin, ctrl.remove);

module.exports = router;
