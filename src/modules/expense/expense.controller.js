const expenseService = require('./expense.service');

exports.getAll = async (req, res, next) => {
  try {
    const { from, to, expense_type, supplier_id } = req.query;
    const data = await expenseService.getExpenses({ from, to, expense_type, supplier_id });
    res.sendResponse({ message: 'Expenses fetched', data });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const data = await expenseService.createExpense(req.body);
    res.sendResponse({ statusCode: 201, message: 'Expense created', data });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await expenseService.deleteExpense(req.params.id);
    res.sendResponse({ statusCode: 204, message: 'Expense deleted' });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const data = await expenseService.updateExpense(req.params.id, req.body);
    res.sendResponse({ message: 'Expense updated', data });
  } catch (err) { next(err); }
};

exports.getSummary = async (req, res, next) => {
  try {
    const data = await expenseService.getExpenseSummary();
    res.sendResponse({ message: 'Expense summary fetched', data });
  } catch (err) { next(err); }
};

exports.getProfitLoss = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const data = await expenseService.getprofitloss({ from, to });
    res.sendResponse({ message: 'P&L fetched', data });
  } catch (err) { next(err); }
};

exports.getRealBalanceSheet = async (req, res, next) => {
  try {
    const data = await expenseService.getRealBalanceSheet();
    res.sendResponse({ message: 'Balance sheet fetched', data });
  } catch (err) { next(err); }
};
