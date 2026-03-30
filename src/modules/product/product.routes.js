const express = require('express');
const router = express.Router();
const ctrl = require('./product.controller');
const {
  validateAddProduct,
  validateUpdateProduct,
  validateAddStock,
  validateUpdateUnit,
  validateMarathiName,
} = require('./product.validation');
const validateRequest = require('@middlewares/validateRequest');
const authenticate = require('@middlewares/authenticate');
const authorizeAdmin = require('@middlewares/authorizeAdmin');
const upload = require('@config/multer');

router.post('/addproduct',      authenticate, authorizeAdmin, validateAddProduct, validateRequest, ctrl.addProduct);
router.get('/getproduct',       authenticate, authorizeAdmin, ctrl.getProduct);
router.get('/:id',              ctrl.getProductById);
router.put('/updateproduct/:id', authenticate, authorizeAdmin, validateUpdateProduct, validateRequest, ctrl.updateProduct);
router.delete('/removeproduct/:id', authenticate, authorizeAdmin, ctrl.deleteProduct);
router.post('/add-stock',       authenticate, authorizeAdmin, validateAddStock, validateRequest, ctrl.addStock);
router.put('/:id/unit',         authenticate, authorizeAdmin, validateUpdateUnit, validateRequest, ctrl.updateDefaultUnit);
router.put('/:id/marathi-name', validateMarathiName, validateRequest, ctrl.updateMarathiName);
router.post('/:id/upload-image', upload.single('image'), ctrl.uploadProductImage);
router.delete('/:id/delete-image', ctrl.deleteProductImage);

module.exports = router;
