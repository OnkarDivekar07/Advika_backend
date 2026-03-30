const express = require('express');
const router = express.Router();
const ctrl = require('./purchaseOrder.controller');
const { validateUpdateItem } = require('./purchaseOrder.validation');
const validateRequest = require('@middlewares/validateRequest');
const authenticate = require('@middlewares/authenticate');
const authorizeAdmin = require('@middlewares/authorizeAdmin');

router.get('/',                          authenticate, authorizeAdmin, ctrl.getPendingOrders);
router.patch('/:orderId/approve',        authenticate, authorizeAdmin, ctrl.approveOrder);
router.patch('/:orderId/reject',         authenticate, authorizeAdmin, ctrl.rejectOrder);
router.patch('/items/:itemId',           authenticate, authorizeAdmin, validateUpdateItem, validateRequest, ctrl.updateOrderItem);

module.exports = router;
