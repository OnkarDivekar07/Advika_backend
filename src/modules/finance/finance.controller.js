const financeService = require('./finance.service');

// Original — untouched
exports.getFinanceSummary = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const data = await financeService.getFinanceSummary({ from, to });
    res.sendResponse({ message: 'Finance summary fetched', data });
  } catch (err) { next(err); }
};

// ── Profit First ─────────────────────────────────────────────

exports.getProfitFirstSummary = async (req, res, next) => {
  try {
    const { month } = req.query;   // e.g. "2025-04"
    const data = await financeService.getProfitFirstSummary({ monthKey: month });
    res.sendResponse({ message: 'Profit First summary fetched', data });
  } catch (err) { next(err); }
};

exports.upsertProfitFirstEntry = async (req, res, next) => {
  try {
    const { month } = req.query;
    const { profit_actual, emergency_fund_actual, owners_pay_actual, notes } = req.body;
    const data = await financeService.upsertProfitFirstEntry({
      monthKey: month,
      profit_actual,
      emergency_fund_actual,
      owners_pay_actual,
      notes,
    });
    res.sendResponse({ message: 'Profit First entry saved', data });
  } catch (err) { next(err); }
};

exports.getAvailableMonths = async (req, res, next) => {
  try {
    const data = await financeService.getAvailableMonths();
    res.sendResponse({ message: 'Available months fetched', data });
  } catch (err) { next(err); }
};
