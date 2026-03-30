const Transaction = require('@root/models/transaction');

const getFinanceSummary = async () => {
  const transactions = await Transaction.findAll({ order: [['date', 'DESC']] });

  let cashTotal = 0;
  let onlineTotal = 0;

  for (const t of transactions) {
    if (t.paymentMethod === 'cash') cashTotal += parseFloat(t.totalAmount);
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
