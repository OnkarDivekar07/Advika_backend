const { Op } = require('sequelize');
const Transaction = require('@root/models/transaction');

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

module.exports = { getFinanceSummary };
