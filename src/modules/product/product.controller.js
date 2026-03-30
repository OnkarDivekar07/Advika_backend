const productService = require('./product.service');

exports.addProduct = async (req, res, next) => {
  try {
    const products = await productService.addProducts(req.body);
    res.sendResponse({ statusCode: 201, message: 'Product(s) added successfully', data: products });
  } catch (err) {
    next(err);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const products = await productService.getAllProducts();
    res.sendResponse({ message: 'Products fetched successfully', data: products });
  } catch (err) {
    next(err);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.sendResponse({ message: 'Product fetched successfully', data: product });
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    await productService.updateProduct(req.params.id, req.body);
    res.sendResponse({ message: 'Product updated successfully' });
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id);
    res.sendResponse({ message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.addStock = async (req, res, next) => {
  try {
    const product = await productService.addStock(req.body);
    res.sendResponse({ message: 'Stock updated successfully', data: product });
  } catch (err) {
    next(err);
  }
};

exports.uploadProductImage = async (req, res, next) => {
  try {
    const imageUrl = await productService.uploadImage(req.params.id, req.file);
    res.sendResponse({ message: 'Product image uploaded successfully', data: { imageUrl } });
  } catch (err) {
    next(err);
  }
};

exports.deleteProductImage = async (req, res, next) => {
  try {
    await productService.deleteImage(req.params.id);
    res.sendResponse({ message: 'Product image deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.updateMarathiName = async (req, res, next) => {
  try {
    await productService.updateMarathiName(req.params.id, req.body.marathiName);
    res.sendResponse({ message: 'Marathi name updated', data: { marathiName: req.body.marathiName } });
  } catch (err) {
    next(err);
  }
};

exports.updateDefaultUnit = async (req, res, next) => {
  try {
    const result = await productService.updateDefaultUnit(req.params.id, req.body.defaultUnit);
    res.sendResponse({ message: 'Default unit updated successfully', data: result });
  } catch (err) {
    next(err);
  }
};
