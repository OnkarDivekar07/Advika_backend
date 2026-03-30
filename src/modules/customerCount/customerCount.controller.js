const customerCountService = require('./customerCount.service');
const CustomError = require('@utils/customError');

exports.getTodayCount = async (req, res, next) => {
  try {
    const data = await customerCountService.getTodayCount();
    res.sendResponse({ message: 'Today count fetched', data: { count: data.count } });
  } catch (err) { next(err); }
};

exports.updateCount = async (req, res, next) => {
  try {
    const change = parseInt(req.body.change, 10);

    // Fix: explicit check — change=0 is a no-op that should return current count
    if (change === 0) {
      const data = await customerCountService.getTodayCount();
      return res.sendResponse({ message: 'No change applied', data: { count: data.count } });
    }

    const data = change > 0
      ? await customerCountService.incrementCount()
      : await customerCountService.decrementCount();

    res.sendResponse({ message: 'Count updated', data: { count: data.count } });
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const data = await customerCountService.getAll();
    res.sendResponse({ message: 'Customer counts fetched', data });
  } catch (err) { next(err); }
};

exports.getByDate = async (req, res, next) => {
  try {
    const data = await customerCountService.getByDate(req.params.date);
    res.sendResponse({ message: 'Customer count fetched', data });
  } catch (err) { next(err); }
};
