const express = require('express');
const router = express.Router();
const ctrl = require('./reorder.controller');
const authenticate = require('@middlewares/authenticate');
const authorizeAdmin = require('@middlewares/authorizeAdmin');

router.get('/suggestions', authenticate, authorizeAdmin, ctrl.getSuggestedOrderQuantity);

module.exports = router;
