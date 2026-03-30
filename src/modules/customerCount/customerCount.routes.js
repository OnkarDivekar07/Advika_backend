const express = require('express');
const router = express.Router();
const ctrl = require('./customerCount.controller');
const { validateUpdate, validateDate } = require('./customerCount.validation');
const validateRequest = require('@middlewares/validateRequest');
const authenticate = require('@middlewares/authenticate');
const authorizeAdmin = require('@middlewares/authorizeAdmin');

router.get('/today',       authenticate, authorizeAdmin, ctrl.getTodayCount);
router.get('/all',         authenticate, authorizeAdmin, ctrl.getAll);
router.get('/:date',       authenticate, authorizeAdmin, validateDate, validateRequest, ctrl.getByDate);
router.post('/update',     authenticate, authorizeAdmin, validateUpdate, validateRequest, ctrl.updateCount);

module.exports = router;
