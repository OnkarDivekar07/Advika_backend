const financeService = require('./finance.service');

exports.getFinanceSummary = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const data = await financeService.getFinanceSummary({ from, to });
    res.sendResponse({ message: 'Finance summary fetched', data });
  } catch (err) { next(err); }
};
