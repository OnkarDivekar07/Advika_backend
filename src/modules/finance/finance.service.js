const { Op } = require('sequelize');
const Transaction = require('@root/models/transaction');
const Expense = require('@root/models/Expense');
const sequelize = require('@utils/db');
const { DataTypes } = require('sequelize');

// ─────────────────────────────────────────────────────────────
// 📅 DATE HELPERS
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

const toMonthKey = (year, month) =>
  `${year}-${String(month + 1).padStart(2, '0')}`;

const monthKeyFromDate = (d = new Date()) =>
  toMonthKey(d.getFullYear(), d.getMonth());

const rangeFromMonthKey = (key) => {
  const [y, m] = key.split('-').map(Number);
  const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const end   = new Date(y, m, 0, 23, 59, 59, 999);
  return { start, end };
};

// ─────────────────────────────────────────────────────────────
// 🏦 PROFIT FIRST MODEL (lazy-loaded to avoid circular deps)
// ─────────────────────────────────────────────────────────────

let _PFE = null;
function getPFEModel() {
  if (_PFE) return _PFE;
  _PFE = sequelize.define(
    'ProfitFirstEntry',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      month_key:             { type: DataTypes.STRING(7),  allowNull: false, unique: true },
      profit_actual:         { type: DataTypes.FLOAT,      allowNull: false, defaultValue: 0 },
      emergency_fund_actual: { type: DataTypes.FLOAT,      allowNull: false, defaultValue: 0 },
      owners_pay_actual:     { type: DataTypes.FLOAT,      allowNull: false, defaultValue: 0 },
      notes:                 { type: DataTypes.STRING,     allowNull: true },
    },
    { tableName: 'ProfitFirstEntries', timestamps: true }
  );
  return _PFE;
}

// ─────────────────────────────────────────────────────────────
// 🧮 AGGREGATION HELPERS
// ─────────────────────────────────────────────────────────────

const sumArr = (arr, field) =>
  arr.reduce((acc, row) => acc + (parseFloat(row[field]) || 0), 0);

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Compute Profit First numbers for a given date range.
 *
 * Profit First framework (adapted for this business):
 *   Sales            = all non-reversed transaction totals
 *   COGS             = purchase expenses (inventory buys) — target 60% of sales
 *   Real Revenue     = Sales − Actual COGS  (actual cash out, not 60% target)
 *   OpEx (purchase)  = same as COGS  (money available to buy inventory)
 *   OpEx (other)     = transport + miscellaneous — target 40% of Real Revenue
 *   Profit           = target 15% of Real Revenue (manual confirmation)
 *   Emergency Fund   = target 15% of Real Revenue (manual confirmation)
 *   Owner's Pay      = target 30% of Real Revenue (manual confirmation)
 */
async function computeProfitFirstNumbers(start, end) {
  const [transactions, expenses] = await Promise.all([
    Transaction.findAll({
      where: { isReversed: false, date: { [Op.between]: [start, end] } },
    }),
    Expense.findAll({
      where: { expense_date: { [Op.between]: [start, end] } },
    }),
  ]);

  const sales = round2(sumArr(transactions, 'totalAmount'));

  const purchaseExpenses = expenses.filter(e => e.expense_type === 'purchase');
  const otherExpenses    = expenses.filter(e => e.expense_type !== 'purchase');

  const cogsActual       = round2(sumArr(purchaseExpenses, 'total_amount'));
  const opexOtherActual  = round2(sumArr(otherExpenses,    'total_amount'));

  const cogsTarget       = round2(sales * 0.60);
  const realRevenue      = round2(sales - cogsActual);   // Profit First: actual cash movement, not target

  const opexOtherTarget  = round2(realRevenue * 0.40);
  const profitTarget     = round2(realRevenue * 0.15);
  const emergencyTarget  = round2(realRevenue * 0.15);
  const ownerPayTarget   = round2(realRevenue * 0.30);

  return {
    sales,
    cogs: {
      actual:  cogsActual,
      target:  cogsTarget,
      pct:     60,
    },
    realRevenue,
    opex_purchase: {
      actual: cogsActual,        // same as cogs — money spent on inventory
      label:  'Operating Expenses (Purchases)',
    },
    opex_other: {
      actual:  opexOtherActual,
      target:  opexOtherTarget,
      pct:     40,
    },
    profit: {
      target: profitTarget,
      pct:    15,
    },
    emergency_fund: {
      target: emergencyTarget,
      pct:    15,
    },
    owners_pay: {
      target: ownerPayTarget,
      pct:    30,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// 📊 GET PROFIT FIRST SUMMARY  (main endpoint)
// ─────────────────────────────────────────────────────────────

const getProfitFirstSummary = async ({ monthKey } = {}) => {
  const key   = monthKey || monthKeyFromDate();
  const { start, end } = rangeFromMonthKey(key);

  const PFE = getPFEModel();

  const [computed, entry] = await Promise.all([
    computeProfitFirstNumbers(start, end),
    PFE.findOne({ where: { month_key: key } }),
  ]);

  return {
    monthKey: key,
    ...computed,
    // Manual actuals — null means not yet entered
    profit: {
      ...computed.profit,
      actual: entry ? round2(entry.profit_actual) : null,
    },
    emergency_fund: {
      ...computed.emergency_fund,
      actual: entry ? round2(entry.emergency_fund_actual) : null,
    },
    owners_pay: {
      ...computed.owners_pay,
      actual: entry ? round2(entry.owners_pay_actual) : null,
    },
  };
};

// ─────────────────────────────────────────────────────────────
// 📝 UPSERT MANUAL ENTRIES
// ─────────────────────────────────────────────────────────────

const upsertProfitFirstEntry = async ({ monthKey, profit_actual, emergency_fund_actual, owners_pay_actual, notes }) => {
  const key = monthKey || monthKeyFromDate();
  const PFE = getPFEModel();

  const [entry, created] = await PFE.findOrCreate({
    where: { month_key: key },
    defaults: {
      profit_actual:         profit_actual         ?? 0,
      emergency_fund_actual: emergency_fund_actual ?? 0,
      owners_pay_actual:     owners_pay_actual     ?? 0,
      notes:                 notes ?? null,
    },
  });

  if (!created) {
    if (profit_actual         !== undefined) entry.profit_actual         = profit_actual;
    if (emergency_fund_actual !== undefined) entry.emergency_fund_actual = emergency_fund_actual;
    if (owners_pay_actual     !== undefined) entry.owners_pay_actual     = owners_pay_actual;
    if (notes                 !== undefined) entry.notes                 = notes;
    await entry.save();
  }

  return entry;
};

// ─────────────────────────────────────────────────────────────
// 📅 LIST AVAILABLE MONTHS (for filter dropdown)
// ─────────────────────────────────────────────────────────────

const getAvailableMonths = async () => {
  // Get distinct months from transactions
  const rows = await Transaction.findAll({
    attributes: [
      [sequelize.fn('DATE_FORMAT', sequelize.col('date'), '%Y-%m'), 'month_key'],
    ],
    where: { isReversed: false },
    group: [sequelize.fn('DATE_FORMAT', sequelize.col('date'), '%Y-%m')],
    order: [[sequelize.literal('month_key'), 'DESC']],
    raw: true,
  });

  return rows.map(r => r.month_key).filter(Boolean);
};

// ─────────────────────────────────────────────────────────────
// 🔒 ORIGINAL getFinanceSummary — UNTOUCHED (other pages use it)
// ─────────────────────────────────────────────────────────────

const getFinanceSummary = async ({ from, to } = {}) => {
  const { start, end } = buildDateRange(from, to);

  const transactions = await Transaction.findAll({
    where: {
      isReversed: false,
      date: { [Op.between]: [start, end] },
    },
    order: [['date', 'DESC']],
  });

  let cashTotal = 0;
  let onlineTotal = 0;

  for (const t of transactions) {
    if (t.paymentMethod === 'cash')   cashTotal   += parseFloat(t.totalAmount);
    if (t.paymentMethod === 'online') onlineTotal += parseFloat(t.totalAmount);
  }

  return {
    cashTotal:   cashTotal.toFixed(2),
    onlineTotal: onlineTotal.toFixed(2),
    grandTotal:  (cashTotal + onlineTotal).toFixed(2),
    transactions,
  };
};

// ─────────────────────────────────────────────────────────────
module.exports = {
  getFinanceSummary,
  getProfitFirstSummary,
  upsertProfitFirstEntry,
  getAvailableMonths,
};
