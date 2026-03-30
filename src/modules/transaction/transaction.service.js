const { Op } = require('sequelize');
const Transaction = require('@root/models/transaction');
const Product = require('@root/models/product');
const sequelize = require('@utils/db');
const CustomError = require('@utils/customError');
const { incrementAndRerank, decrementAndRerank } = require('@modules/ranking/ranking.service');

const billing = async (billingData) => {
  const summary = billingData[billingData.length - 1];
  const totalAmount = parseFloat(summary.total_amount);
  const paymentMethod = summary.payment_method || 'cash';

  if (!['cash', 'online'].includes(paymentMethod)) {
    throw new CustomError('payment_method must be cash or online', 400);
  }

  const validItems = billingData.filter((item) => item.item_name);
  if (!validItems.length) throw new CustomError('No valid items in billing data', 400);

  let totalProfit = 0;
  const transactionItems = [];

  return sequelize.transaction(async (t) => {
    for (const item of validItems) {
      const { productId, item_name, quantity, price, total } = item;
      const qty      = parseInt(quantity, 10);
      const priceNum = parseFloat(price);
      const totalNum = parseFloat(total);

      if (isNaN(qty) || qty <= 0)  throw new CustomError(`Invalid quantity for "${item_name}"`, 400);
      if (isNaN(priceNum))          throw new CustomError(`Invalid price for "${item_name}"`, 400);
      if (isNaN(totalNum))          throw new CustomError(`Invalid total for "${item_name}"`, 400);

      const product = await Product.findByPk(productId, { transaction: t });
      if (!product) throw new CustomError(`Product not found: ${productId}`, 404);

      if (product.quantity < qty) {
        throw new CustomError(
          `Not enough stock for "${product.name}". Available: ${product.quantity}, Requested: ${qty}`,
          400
        );
      }

      const profit = (priceNum - product.price) * qty;
      totalProfit += profit;

      await product.update({ quantity: product.quantity - qty }, { transaction: t });

      const txn = await Transaction.create(
        {
          productId:      product.id,
          itemsPurchased: product.name,
          quantity:       qty,
          totalAmount:    totalNum,
          profit,
          paymentMethod,
          date:           new Date(),
        },
        { transaction: t }
      );

      transactionItems.push(txn);
    }

    // Auto-update salesCount (+1 per product sold) and recompute all ranks
    const soldProductIds = validItems.map((item) => item.productId);
    await incrementAndRerank(soldProductIds, t);

    return {
      transactionItems,
      totalAmount:  totalAmount.toFixed(2),
      totalProfit:  totalProfit.toFixed(2),
    };
  });
};

const rollbackTransaction = async (id) => {
  return sequelize.transaction(async (t) => {
    const txn = await Transaction.findByPk(id, { transaction: t });
    if (!txn) throw new CustomError('Transaction not found', 404);
    if (txn.isReversed) throw new CustomError('Transaction already reversed', 400);

    // productId can be null for manually entered transactions
    if (txn.productId) {
      const product = await Product.findByPk(txn.productId, { transaction: t });
      if (!product) throw new CustomError('Associated product not found', 404);
      await product.update({ quantity: product.quantity + txn.quantity }, { transaction: t });
    }

    await txn.update({ isReversed: true }, { transaction: t });

    // Decrement salesCount for this product and recompute ranks
    if (txn.productId) {
      await decrementAndRerank(txn.productId, t);
    }
  });
};

const getTodayRange = () => {
  const now = new Date();
  // Use fresh Date objects — never mutate the same instance
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start, end };
};

const getDailyTransactions = async () => {
  const { start, end } = getTodayRange();
  return Transaction.findAll({
    where: { isReversed: false, date: { [Op.between]: [start, end] } },
    order: [['createdAt', 'DESC']],
  });
};

const getDailySummary = async () => {
  const now = new Date();
  // Fix: create ALL date boundaries from scratch — never reuse a mutated Date object
  const startOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfDay     = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [daily, monthly] = await Promise.all([
    Transaction.findAll({
      where: { isReversed: false, date: { [Op.between]: [startOfDay, endOfDay] } },
    }),
    Transaction.findAll({
      where: { isReversed: false, date: { [Op.between]: [startOfMonth, endOfMonth] } },
    }),
  ]);

  const sum = (arr, field) => arr.reduce((acc, t) => acc + (t[field] || 0), 0);

  return {
    dailyProfit:   sum(daily,   'profit').toFixed(2),
    dailySales:    sum(daily,   'totalAmount').toFixed(2),
    monthlyProfit: sum(monthly, 'profit').toFixed(2),
    monthlySales:  sum(monthly, 'totalAmount').toFixed(2),
  };
};

const getDailyEntries = async () => {
  const { start, end } = getTodayRange();
  const transactions = await Transaction.findAll({
    where: { isReversed: false, date: { [Op.between]: [start, end] } },
    attributes: ['itemsPurchased', 'quantity', 'totalAmount'],
    order: [['createdAt', 'DESC']],
  });

  return transactions.map((t) => ({
    itemName: t.itemsPurchased,
    quantity: t.quantity,
    total:    t.totalAmount,
  }));
};

module.exports = { billing, rollbackTransaction, getDailyTransactions, getDailySummary, getDailyEntries };
