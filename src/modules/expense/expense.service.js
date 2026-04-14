const { Op } = require('sequelize');
const Expense = require('@root/models/Expense');
const Supplier = require('@root/models/supplier');
const Transaction = require('@root/models/transaction');
const Product = require('@root/models/product');
const Repayment = require('@root/models/repayments');
const CustomError = require('@utils/customError');

// ─── Helpers ───────────────────────────────────────────────────────────────────

const buildDateRange = (from, to) => {
  const now = new Date();
  const start = from
    ? new Date(`${from}T00:00:00.000Z`)
    : new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = to
    ? new Date(`${to}T23:59:59.999Z`)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

const sum = (arr, field) =>
  arr.reduce((acc, row) => acc + (parseFloat(row[field]) || 0), 0);

// ─── Create Expense ────────────────────────────────────────────────────────────

const createExpense = async (payload) => {
  const {
    expense_type,
    supplier_id,
    description,
    // purchase mode A — itemised
    quantity,
    unit_cost,
    // purchase mode B — direct total bill (new)
    total_bill,
    payment_method,
    notes,
    expense_date,
  } = payload;

  if (!expense_type) throw new CustomError('expense_type is required', 400);
  if (!['purchase', 'transport', 'miscellaneous'].includes(expense_type)) {
    throw new CustomError('expense_type must be purchase | transport | miscellaneous', 400);
  }
  if (!description?.trim()) throw new CustomError('description is required', 400);
  if (!['cash', 'online'].includes(payment_method)) {
    throw new CustomError('payment_method must be cash | online', 400);
  }

  // Validate supplier exists when provided
  if (supplier_id) {
    const supplier = await Supplier.findByPk(supplier_id);
    if (!supplier) throw new CustomError('Supplier not found', 404);
  }

  let qty        = null;
  let unitCost   = null;
  let totalAmount;

  if (expense_type === 'purchase') {
    const hasDirect  = total_bill  !== undefined && total_bill  !== null && total_bill  !== '';
    const hasItemised = unit_cost  !== undefined && unit_cost   !== null && unit_cost   !== '';

    if (hasDirect) {
      // ── Mode B: direct total bill ─────────────────────────────────────────
      // Supplier paid a lump-sum; no per-item breakdown needed.
      totalAmount = parseFloat(total_bill);
      if (isNaN(totalAmount) || totalAmount <= 0) {
        throw new CustomError('total_bill must be a positive number', 400);
      }
      // qty and unitCost remain null — stored as-is in DB for transparency
    } else if (hasItemised) {
      // ── Mode A: itemised (qty × unit_cost) ──────────────────────────────
      unitCost = parseFloat(unit_cost);
      if (isNaN(unitCost) || unitCost <= 0) {
        throw new CustomError('unit_cost must be a positive number', 400);
      }
      qty = parseInt(quantity, 10);
      if (!qty || qty <= 0) {
        throw new CustomError('quantity is required when unit_cost is provided', 400);
      }
      totalAmount = qty * unitCost;
    } else {
      throw new CustomError(
        'For purchase expenses, provide either total_bill (direct) or unit_cost + quantity (itemised)',
        400
      );
    }
  } else {
    // transport / miscellaneous — single amount field
    if (!unit_cost || isNaN(parseFloat(unit_cost)) || parseFloat(unit_cost) <= 0) {
      throw new CustomError('unit_cost (amount) must be a positive number', 400);
    }
    unitCost    = parseFloat(unit_cost);
    totalAmount = unitCost;
  }

  return Expense.create({
    expense_type,
    supplier_id:  supplier_id || null,
    description:  description.trim(),
    quantity:     qty,
    unit_cost:    unitCost,
    total_amount: parseFloat(totalAmount.toFixed(2)),
    payment_method,
    notes:        notes?.trim() || null,
    expense_date: expense_date ? new Date(expense_date) : new Date(),
  });
};

// ─── List Expenses ─────────────────────────────────────────────────────────────

const getExpenses = async ({ from, to, expense_type, supplier_id } = {}) => {
  const { start, end } = buildDateRange(from, to);
  const where = { expense_date: { [Op.between]: [start, end] } };
  if (expense_type) where.expense_type = expense_type;
  if (supplier_id)  where.supplier_id  = supplier_id;

  return Expense.findAll({
    where,
    include: [{ model: Supplier, as: 'Supplier', attributes: ['id', 'name', 'phone'] }],
    order: [['expense_date', 'DESC']],
  });
};

// ─── Update Expense ────────────────────────────────────────────────────────────

const updateExpense = async (id, payload) => {
  const expense = await Expense.findByPk(id);
  if (!expense) throw new CustomError('Expense not found', 404);

  const {
    description, expense_type, supplier_id,
    total_bill, unit_cost, quantity,
    payment_method, notes, expense_date,
  } = payload;

  if (description  !== undefined) expense.description    = description.trim();
  if (expense_type !== undefined) {
    if (!['purchase', 'transport', 'miscellaneous'].includes(expense_type))
      throw new CustomError('expense_type must be purchase | transport | miscellaneous', 400);
    expense.expense_type = expense_type;
  }
  if (supplier_id  !== undefined) expense.supplier_id    = supplier_id || null;
  if (payment_method !== undefined) {
    if (!['cash', 'online'].includes(payment_method))
      throw new CustomError('payment_method must be cash | online', 400);
    expense.payment_method = payment_method;
  }
  if (notes        !== undefined) expense.notes          = notes?.trim() || null;
  if (expense_date !== undefined) expense.expense_date   = new Date(expense_date);

  // Recalculate total_amount if amount fields provided
  if (total_bill !== undefined && total_bill !== null && total_bill !== '') {
    expense.total_amount = parseFloat(total_bill);
    expense.quantity     = null;
    expense.unit_cost    = null;
  } else if (unit_cost !== undefined && quantity !== undefined) {
    expense.unit_cost    = parseFloat(unit_cost);
    expense.quantity     = parseInt(quantity, 10);
    expense.total_amount = expense.unit_cost * expense.quantity;
  } else if (unit_cost !== undefined) {
    expense.unit_cost    = parseFloat(unit_cost);
    expense.total_amount = expense.unit_cost;
  }

  await expense.save();
  return expense;
};

// ─── Delete Expense ────────────────────────────────────────────────────────────

const deleteExpense = async (id) => {
  const expense = await Expense.findByPk(id);
  if (!expense) throw new CustomError('Expense not found', 404);
  await expense.destroy();
};

// ─── P&L Balance Sheet ─────────────────────────────────────────────────────────

const getprofitloss = async ({ from, to } = {}) => {
  const { start, end } = buildDateRange(from, to);

  const transactions = await Transaction.findAll({
    where: { isReversed: false, date: { [Op.between]: [start, end] } },
    attributes: ['totalAmount', 'profit', 'paymentMethod', 'itemsPurchased', 'quantity', 'date'],
    order: [['date', 'DESC']],
  });

  const totalRevenue  = sum(transactions, 'totalAmount');
  const totalProfit   = sum(transactions, 'profit');
  const cashRevenue   = sum(transactions.filter((t) => t.paymentMethod === 'cash'),   'totalAmount');
  const onlineRevenue = sum(transactions.filter((t) => t.paymentMethod === 'online'), 'totalAmount');

  const expenses = await Expense.findAll({
    where: { expense_date: { [Op.between]: [start, end] } },
    include: [{ model: Supplier, as: 'Supplier', attributes: ['id', 'name'] }],
    order: [['expense_date', 'DESC']],
  });

  const totalExpenses     = sum(expenses, 'total_amount');
  const purchaseExpenses  = sum(expenses.filter((e) => e.expense_type === 'purchase'),      'total_amount');
  const transportExpenses = sum(expenses.filter((e) => e.expense_type === 'transport'),     'total_amount');
  const miscExpenses      = sum(expenses.filter((e) => e.expense_type === 'miscellaneous'), 'total_amount');
  const cashExpenses      = sum(expenses.filter((e) => e.payment_method === 'cash'),        'total_amount');
  const onlineExpenses    = sum(expenses.filter((e) => e.payment_method === 'online'),      'total_amount');

  const netProfit = totalProfit - totalExpenses;

  return {
    period: { from: start.toISOString(), to: end.toISOString() },
    revenue: {
      total: +totalRevenue.toFixed(2), cash: +cashRevenue.toFixed(2),
      online: +onlineRevenue.toFixed(2), transactionCount: transactions.length,
    },
    grossProfit: +totalProfit.toFixed(2),
    expenses: {
      total: +totalExpenses.toFixed(2), purchase: +purchaseExpenses.toFixed(2),
      transport: +transportExpenses.toFixed(2), miscellaneous: +miscExpenses.toFixed(2),
      cash: +cashExpenses.toFixed(2), online: +onlineExpenses.toFixed(2),
      expenseCount: expenses.length,
    },
    netProfit: +netProfit.toFixed(2),
    expenseItems: expenses,
  };
};

// ─── Real Balance Sheet ────────────────────────────────────────────────────────

const getRealBalanceSheet = async () => {
  const [cashTransactions, cashExpenses] = await Promise.all([
    Transaction.findAll({ where: { isReversed: false, paymentMethod: 'cash' }, attributes: ['totalAmount'] }),
    Expense.findAll({ where: { payment_method: 'cash' }, attributes: ['total_amount'] }),
  ]);

  const cashInflow  = sum(cashTransactions, 'totalAmount');
  const cashOutflow = sum(cashExpenses,     'total_amount');
  const cash        = cashInflow - cashOutflow;

  const products = await Product.findAll({
    where: { quantity: { [Op.gt]: 0 } },
    attributes: ['id', 'name', 'quantity', 'price'],
  });
  const inventoryValue = products.reduce((acc, p) => acc + p.quantity * parseFloat(p.price), 0);
  const inventoryItems = products.map((p) => ({
    id: p.id, name: p.name, quantity: p.quantity,
    costPrice: +parseFloat(p.price).toFixed(2),
    value: +(p.quantity * parseFloat(p.price)).toFixed(2),
  }));

  const onlineTransactions = await Transaction.findAll({
    where: { isReversed: false, paymentMethod: 'online' },
    attributes: ['totalAmount'],
  });
  const onlineRevenue = sum(onlineTransactions, 'totalAmount');
  const receivables   = 0;
  const totalAssets   = cash + inventoryValue + receivables;

  const repayments       = await Repayment.findAll({ attributes: ['supplierName', 'amountOwed', 'dueDate'], order: [['dueDate', 'ASC']] });
  const supplierDues     = sum(repayments, 'amountOwed');
  const totalLiabilities = supplierDues;
  const equity           = totalAssets - totalLiabilities;

  return {
    generatedAt: new Date().toISOString(),
    assets: {
      cash: { value: +cash.toFixed(2), inflow: +cashInflow.toFixed(2), outflow: +cashOutflow.toFixed(2), note: 'Cash sales − cash expenses' },
      inventory: { value: +inventoryValue.toFixed(2), itemCount: products.length, items: inventoryItems, note: 'SUM(stock × cost price)' },
      receivables: { value: +receivables.toFixed(2), onlineRevenue: +onlineRevenue.toFixed(2), note: 'Online payments collected via UPI/card — already received' },
      total: +totalAssets.toFixed(2),
    },
    liabilities: {
      supplierDues: {
        value: +supplierDues.toFixed(2),
        entries: repayments.map((r) => ({ supplier: r.supplierName, amount: +parseFloat(r.amountOwed).toFixed(2), dueDate: r.dueDate })),
        note: 'Open entries from Repayments table',
      },
      total: +totalLiabilities.toFixed(2),
    },
    equity: +equity.toFixed(2),
  };
};

// ─── Summary ───────────────────────────────────────────────────────────────────

const getExpenseSummary = async () => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [todayExp, monthExp] = await Promise.all([
    Expense.findAll({ where: { expense_date: { [Op.between]: [todayStart, todayEnd] } } }),
    Expense.findAll({ where: { expense_date: { [Op.between]: [monthStart, monthEnd] } } }),
  ]);

  const breakdown = (arr) => ({
    total:         +sum(arr, 'total_amount').toFixed(2),
    purchase:      +sum(arr.filter((e) => e.expense_type === 'purchase'),      'total_amount').toFixed(2),
    transport:     +sum(arr.filter((e) => e.expense_type === 'transport'),     'total_amount').toFixed(2),
    miscellaneous: +sum(arr.filter((e) => e.expense_type === 'miscellaneous'), 'total_amount').toFixed(2),
  });

  return { today: breakdown(todayExp), month: breakdown(monthExp) };
};

// ─── buildDateWhere (kept for finance.service.js compatibility) ────────────────
const buildDateWhere = (range) => {
  if (!range) return {};
  const today = new Date();
  const ymd   = (d) => d.toISOString().slice(0, 10);
  if (range === 'today') return { date: ymd(today) };
  if (range === 'week') {
    const s = new Date(today); s.setDate(today.getDate() - today.getDay());
    const e = new Date(s); e.setDate(s.getDate() + 6);
    return { date: { [Op.between]: [ymd(s), ymd(e)] } };
  }
  if (range === 'month') {
    const s = new Date(today.getFullYear(), today.getMonth(), 1);
    const e = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { date: { [Op.between]: [ymd(s), ymd(e)] } };
  }
  if (range === 'year') {
    const s = new Date(today.getFullYear(), 0, 1);
    const e = new Date(today.getFullYear(), 11, 31);
    return { date: { [Op.between]: [ymd(s), ymd(e)] } };
  }
  if (range.includes('..')) {
    const [from, to] = range.split('..');
    return { date: { [Op.between]: [from, to] } };
  }
  return {};
};

module.exports = {
  createExpense, getExpenses, updateExpense, deleteExpense,
  getprofitloss, getExpenseSummary, getRealBalanceSheet,
  buildDateWhere,
};
