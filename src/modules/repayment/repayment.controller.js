const repaymentService = require('./repayment.service');

exports.getAll = async (req, res, next) => {
  try {
    const data = await repaymentService.getAll();
    res.sendResponse({ message: 'Repayments fetched', data });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const data = await repaymentService.getById(req.params.id);
    res.sendResponse({ message: 'Repayment fetched', data });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const data = await repaymentService.create(req.body);
    res.sendResponse({ statusCode: 201, message: 'Repayment created', data });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const data = await repaymentService.update(req.params.id, req.body);
    res.sendResponse({ message: 'Repayment updated', data });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await repaymentService.remove(req.params.id);
    res.sendResponse({ message: 'Repayment deleted' });
  } catch (err) { next(err); }
};

exports.repaymentPage = (req, res) => {
  res.sendFile('pendingRepayment.html', { root: 'view' });
};
