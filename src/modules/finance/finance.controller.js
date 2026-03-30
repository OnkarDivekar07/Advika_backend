const financeService = require('./finance.service');

exports.getFinanceSummary = async (req, res, next) => {
  try {
    const data = await financeService.getFinanceSummary();
    res.sendResponse({ message: 'Finance summary fetched', data });
  } catch (err) { next(err); }
};
