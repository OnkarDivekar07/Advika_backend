const missingItemService = require('./missingItem.service');

exports.getAll = async (req, res, next) => {
  try {
    const data = await missingItemService.getAll();
    res.sendResponse({ message: 'Missing items fetched', data });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const data = await missingItemService.getById(req.params.id);
    res.sendResponse({ message: 'Missing item fetched', data });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const data = await missingItemService.create(req.body.name);
    res.sendResponse({ statusCode: 201, message: 'Missing item created', data });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const data = await missingItemService.update(req.params.id, req.body);
    res.sendResponse({ message: 'Missing item updated', data });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await missingItemService.remove(req.params.id);
    res.sendResponse({ statusCode: 204, message: 'Missing item deleted' });
  } catch (err) { next(err); }
};
