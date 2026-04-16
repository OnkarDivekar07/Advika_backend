const { Op } = require('sequelize');
const Expense = require('@root/models/Expense');
const Supplier = require('@root/models/supplier');
const Transaction = require('@root/models/transaction');
const Product = require('@root/models/product');
const Repayment = require('@root/models/repayments');
const CustomError = require('@utils/customError');

// ─────────────────────────────────────────────────────────────
// 🧠 HELPERS
// ─────────────────────────────────────────────────────────────
const buildDateRange = (from, to) => {
  const now = new Date();

  const start = from
    ? new Date(`${from}T00:00:00`)
    : new Date(now.getFullYear(), now.getMonth(), 1);

  const end = to
    ? new Date(`${to}T23:59:59.999`)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  return { start, end };
};

const sum = (arr, field) =>
  arr.reduce((acc, row) => acc + (parseFloat(row[field]) || 0), 0);

// ─────────────────────────────────────────────────────────────
// ➕ CREATE
// ─────────────────────────────────────────────────────────────
const createExpense = async (payload) => {
  const {
    expense_type,
    supplier_id,
    description,
    quantity,
    unit_cost,
    total_bill,
    payment_method,
    notes,
    expense_date,
  } = payload;

  if (!expense_type) throw new CustomError('expense_type is required', 400);
  if (!['purchase', 'transport', 'miscellaneous'].includes(expense_type))
    throw new CustomError('Invalid expense_type', 400);

  if (!description?.trim())
    throw new CustomError('description is required', 400);

  if (!['cash', 'online'].includes(payment_method))
    throw new CustomError('Invalid payment_method', 400);

  if (supplier_id) {
    const supplier = await Supplier.findByPk(supplier_id);
    if (!supplier) throw new CustomError('Supplier not found', 404);
  }

  let totalAmount;
  let qty = null;
  let unitCost = null;

  if (expense_type === 'purchase') {
    if (total_bill) {
      totalAmount = parseFloat(total_bill);
      if (totalAmount <= 0) throw new CustomError('Invalid total_bill', 400);
    } else {
      unitCost = parseFloat(unit_cost);
      qty = parseInt(quantity, 10);
      if (!unitCost || !qty) throw new CustomError('unit_cost & quantity required', 400);
      totalAmount = unitCost * qty;
    }
  } else {
    unitCost = parseFloat(unit_cost);
    if (!unitCost) throw new CustomError('Amount required', 400);
    totalAmount = unitCost;
  }

  return Expense.create({
    expense_type,
    supplier_id: supplier_id || null,
    description: description.trim(),
    quantity: qty,
    unit_cost: unitCost,
    total_amount: +totalAmount.toFixed(2),
    payment_method,
    notes: notes?.trim() || null,
    expense_date: expense_date ? new Date(expense_date) : new Date(),
  });
};

// ─────────────────────────────────────────────────────────────
// 📦 GET ALL
// ─────────────────────────────────────────────────────────────
const getExpenses = async ({ from, to, expense_type, supplier_id } = {}) => {
  const { start, end } = buildDateRange(from, to);

  const where = {
    expense_date: { [Op.between]: [start, end] },
  };

  if (expense_type) where.expense_type = expense_type;
  if (supplier_id) where.supplier_id = supplier_id;

  return Expense.findAll({
    where,
    include: [{ model: Supplier, as: 'Supplier', attributes: ['id', 'name'] }],
    order: [['expense_date', 'DESC']],
  });
};

// ─────────────────────────────────────────────────────────────
// ✏️ UPDATE
// ─────────────────────────────────────────────────────────────
const updateExpense = async (id, payload) => {
  const expense = await Expense.findByPk(id);
  if (!expense) throw new CustomError('Expense not found', 404);

  Object.assign(expense, payload);

  if (payload.total_bill) {
    expense.total_amount = parseFloat(payload.total_bill);
  }

  await expense.save();
  return expense;
};

// ─────────────────────────────────────────────────────────────
// ❌ DELETE
// ─────────────────────────────────────────────────────────────
const deleteExpense = async (id) => {
  const expense = await Expense.findByPk(id);
  if (!expense) throw new CustomError('Expense not found', 404);
  await expense.destroy();
};

// ─────────────────────────────────────────────────────────────
// 📊 SUMMARY (FIXED)
// ─────────────────────────────────────────────────────────────
const getExpenseSummary = async ({ from, to } = {}) => {
  const { start, end } = buildDateRange(from, to);

  const expenses = await Expense.findAll({
    where: {
      expense_date: { [Op.between]: [start, end] },
    },
  });

  const total = sum(expenses, 'total_amount');

  const purchase = sum(expenses.filter(e => e.expense_type === 'purchase'), 'total_amount');
  const transport = sum(expenses.filter(e => e.expense_type === 'transport'), 'total_amount');
  const miscellaneous = sum(expenses.filter(e => e.expense_type === 'miscellaneous'), 'total_amount');

  return {
    period: {
      from: start.toISOString(),
      to: end.toISOString(),
    },
    total: +total.toFixed(2),
    breakdown: {
      purchase: +purchase.toFixed(2),
      transport: +transport.toFixed(2),
      miscellaneous: +miscellaneous.toFixed(2),
    },
    expenseCount: expenses.length,
  };
};

// ─────────────────────────────────────────────────────────────
// 📉 PROFIT & LOSS
// ─────────────────────────────────────────────────────────────
const getProfitLoss = async ({ from, to } = {}) => {
  const { start, end } = buildDateRange(from, to);

  const transactions = await Transaction.findAll({
    where: { isReversed: false, date: { [Op.between]: [start, end] } },
  });

  const expenses = await Expense.findAll({
    where: { expense_date: { [Op.between]: [start, end] } },
  });

  const revenue = sum(transactions, 'totalAmount');
  const profit = sum(transactions, 'profit');
  const totalExpenses = sum(expenses, 'total_amount');

  return {
    revenue,
    grossProfit: profit,
    expenses: totalExpenses,
    netProfit: profit - totalExpenses,
  };
};

// ─────────────────────────────────────────────────────────────
// 📊 BALANCE SHEET
// ─────────────────────────────────────────────────────────────
const getRealBalanceSheet = async () => {
  const products = await Product.findAll({
    where: { quantity: { [Op.gt]: 0 } },
  });

  const inventoryValue = products.reduce(
    (acc, p) => acc + p.quantity * parseFloat(p.price),
    0
  );

  const repayments = await Repayment.findAll();
  const liabilities = sum(repayments, 'amountOwed');

  return {
    inventoryValue,
    liabilities,
    equity: inventoryValue - liabilities,
  };
};

// ─────────────────────────────────────────────────────────────
module.exports = {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
  getProfitLoss,
  getRealBalanceSheet,
};