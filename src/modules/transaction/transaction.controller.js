const transactionService = require('./transaction.service');

exports.billing = async (req, res, next) => {
  try {
    const result = await transactionService.billing(req.body);
    res.sendResponse({ message: 'Transaction completed successfully', data: result });
  } catch (err) {
    next(err);
  }
};

exports.rollbackTransaction = async (req, res, next) => {
  try {
    await transactionService.rollbackTransaction(req.params.id);
    res.sendResponse({ message: 'Transaction rolled back successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getDailyTransactions = async (req, res, next) => {
  try {
    const data = await transactionService.getDailyTransactions();
    res.sendResponse({ message: 'Daily transactions fetched', data });
  } catch (err) {
    next(err);
  }
};

exports.getDailySummary = async (req, res, next) => {
  try {
    const data = await transactionService.getDailySummary();
    res.sendResponse({ message: 'Sales summary fetched', data });
  } catch (err) {
    next(err);
  }
};

exports.getDailyEntries = async (req, res, next) => {
  try {
    const data = await transactionService.getDailyEntries();
    res.sendResponse({ message: 'Daily entries fetched', data });
  } catch (err) {
    next(err);
  }
};

exports.dailyTransactionPage = (req, res) => {
  res.sendFile('dailytranction.html', { root: 'view' });
};

exports.stockPage = (req, res) => {
  res.sendFile('inventory.html', { root: 'view' });
};
