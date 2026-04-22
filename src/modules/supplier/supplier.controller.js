const supplierService = require('./supplier.service');

exports.getAll = async (req, res, next) => {
  try {
    const data = await supplierService.getAll();
    res.sendResponse({ message: 'Suppliers fetched', data });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const data = await supplierService.create(req.body);
    res.sendResponse({ statusCode: 201, message: 'Supplier created', data });
  } catch (err) { next(err); }
};

exports.getByProduct = async (req, res, next) => {
  try {
    const data = await supplierService.getByProduct(req.params.productId);
    res.sendResponse({ message: 'Mappings fetched', data });
  } catch (err) { next(err); }
};

exports.mapProductSupplier = async (req, res, next) => {
  try {
    const data = await supplierService.mapProductSupplier(req.body);
    res.sendResponse({ message: 'Suppliers mapped to product', data });
  } catch (err) { next(err); }
};

exports.archive = async (req, res, next) => {
  try {
    await supplierService.archive(req.params.id);
    res.sendResponse({ message: 'Supplier archived' });
  } catch (err) { next(err); }
};
