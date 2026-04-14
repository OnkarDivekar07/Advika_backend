const expenseService = require('./expense.service');

// ─────────────────────────────────────────────────────────────
// 📦 GET ALL EXPENSES
// GET /expenses?from&to&expense_type&supplier_id
// ─────────────────────────────────────────────────────────────
exports.getAll = async (req, res, next) => {
  try {
    const { from, to, expense_type, supplier_id } = req.query;

    const data = await expenseService.getExpenses({
      from,
      to,
      expense_type,
      supplier_id,
    });

    res.sendResponse({
      message: 'Expenses fetched',
      data,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ➕ CREATE
// POST /expenses
// ─────────────────────────────────────────────────────────────
exports.create = async (req, res, next) => {
  try {
    const data = await expenseService.createExpense(req.body);

    res.sendResponse({
      statusCode: 201,
      message: 'Expense created',
      data,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ✏️ UPDATE
// PUT /expenses/:id
// ─────────────────────────────────────────────────────────────
exports.update = async (req, res, next) => {
  try {
    const data = await expenseService.updateExpense(
      req.params.id,
      req.body
    );

    res.sendResponse({
      message: 'Expense updated',
      data,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// ❌ DELETE
// DELETE /expenses/:id
// ─────────────────────────────────────────────────────────────
exports.remove = async (req, res, next) => {
  try {
    await expenseService.deleteExpense(req.params.id);

    res.sendResponse({
      statusCode: 204,
      message: 'Expense deleted',
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// 📊 SUMMARY (MATCHES FRONTEND)
// GET /expenses/summary?from&to
// ─────────────────────────────────────────────────────────────
exports.getSummary = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    const data = await expenseService.getExpenseSummary({
      from,
      to,
    });

    res.sendResponse({
      message: 'Expense summary fetched',
      data,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// 📉 PROFIT & LOSS
// GET /expenses/profit-loss?from&to
// ─────────────────────────────────────────────────────────────
exports.getProfitLoss = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    const data = await expenseService.getProfitLoss({
      from,
      to,
    });

    res.sendResponse({
      message: 'P&L fetched',
      data,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// 📊 BALANCE SHEET
// GET /expenses/balance-sheet
// ─────────────────────────────────────────────────────────────
exports.getRealBalanceSheet = async (req, res, next) => {
  try {
    const data = await expenseService.getRealBalanceSheet();

    res.sendResponse({
      message: 'Balance sheet fetched',
      data,
    });
  } catch (err) {
    next(err);
  }
};