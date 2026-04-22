const express = require('express');
const router = express.Router();
const ctrl = require('./supplier.controller');
const { validateCreate, validateMapProduct } = require('./supplier.validation');
const validateRequest = require('@middlewares/validateRequest');
const authenticate = require('@middlewares/authenticate');
const authorizeAdmin = require('@middlewares/authorizeAdmin');

router.get('/',                authenticate, authorizeAdmin, ctrl.getAll);
router.post('/',               authenticate, authorizeAdmin, validateCreate, validateRequest, ctrl.create);
router.get('/product/:productId', authenticate, authorizeAdmin, ctrl.getByProduct);
router.post('/map-product',    authenticate, authorizeAdmin, validateMapProduct, validateRequest, ctrl.mapProductSupplier);
router.delete('/:id',          authenticate, authorizeAdmin, ctrl.archive);

module.exports = router;
