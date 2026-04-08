/**
 * threshold.service.js
 *
 * Calculates and saves data-driven stock thresholds for products using
 * historical sales (Transaction) data.
 *
 * Column mapping (Product table):
 *   lower_threshold  ←  min threshold  (≈ 1 week of stock)
 *   upper_threshold  ←  max threshold  (≈ 1 month of stock)
 *
 * Algorithm:
 *   1. Fetch all non-reversed transactions for this product.
 *   2. Use ALL available data if it spans > 60 days; require at least 60 days otherwise.
 *   3. avgDailySales = totalUnitsSold / daysInDataset
 *   4. lower_threshold = ceil(avgDailySales × 7)   (1 week)
 *      upper_threshold = ceil(avgDailySales × 30)  (1 month)
 *   5. Save ONLY those two fields; nothing else on the product is touched.
 */

'use strict';

const { Op }       = require('sequelize');
const Product      = require('@root/models/product');
const Transaction  = require('@root/models/transaction');
const CustomError  = require('@utils/customError');
const { invalidateProductCache } = require('@utils/productCache');

/* ── Constants ────────────────────────────────────────────────────────────── */
const MIN_DAYS_REQUIRED = 60;   // refuse to calculate with fewer data days
const DAYS_PER_WEEK     = 7;
const DAYS_PER_MONTH    = 30;

/* ── Core calculation for a single product ───────────────────────────────── */

/**
 * calculateThresholdsForProduct(productId)
 *
 * Returns the calculated values WITHOUT saving them to the DB.
 * Used internally by both the single-product and bulk endpoints.
 *
 * @param {string} productId
 * @returns {{
 *   product_id:                  string,
 *   product_name:                string,
 *   calculated_min_threshold:    number,
 *   calculated_max_threshold:    number,
 *   days_used_for_calculation:   number,
 *   average_daily_sales:         number,
 *   status:                      'calculated' | 'insufficient_data' | 'no_sales'
 *   reason?:                     string   (only when status !== 'calculated')
 * }}
 */
const calculateThresholdsForProduct = async (productId) => {
  const product = await Product.findByPk(productId, {
    attributes: ['id', 'name', 'lower_threshold', 'upper_threshold'],
  });
  if (!product) throw new CustomError(`Product not found: ${productId}`, 404);

  // Fetch ALL non-reversed transactions for this product, oldest first
  const transactions = await Transaction.findAll({
    where: { productId, isReversed: false },
    attributes: ['quantity', 'date'],
    order: [['date', 'ASC']],
  });

  // No sales history at all
  if (!transactions.length) {
    return {
      product_id:                productId,
      product_name:              product.name,
      calculated_min_threshold:  null,
      calculated_max_threshold:  null,
      days_used_for_calculation: 0,
      average_daily_sales:       0,
      status:                    'no_sales',
      reason:                    'No sales transactions found for this product.',
    };
  }

  // Determine the date range of the dataset
  const firstDate = new Date(transactions[0].date);
  const lastDate  = new Date(transactions[transactions.length - 1].date);
  const now       = new Date();

  // Use whichever is later: last transaction date or today
  // (ensures days_used counts up to the current moment, not just last sale)
  const rangeEnd   = lastDate > now ? lastDate : now;
  const msPerDay   = 1000 * 60 * 60 * 24;
  const daysInData = Math.max(1, Math.ceil((rangeEnd - firstDate) / msPerDay));

  // Enforce minimum data requirement
  if (daysInData < MIN_DAYS_REQUIRED) {
    return {
      product_id:                productId,
      product_name:              product.name,
      calculated_min_threshold:  null,
      calculated_max_threshold:  null,
      days_used_for_calculation: daysInData,
      average_daily_sales:       0,
      status:                    'insufficient_data',
      reason:                    `Only ${daysInData} day(s) of data found. Minimum required: ${MIN_DAYS_REQUIRED} days.`,
    };
  }

  // Sum all units sold
  const totalUnitsSold = transactions.reduce(
    (sum, t) => sum + (parseInt(t.quantity, 10) || 0),
    0
  );

  // Average daily sales rate
  const avgDailySales = totalUnitsSold / daysInData;

  // Thresholds — always at least 1 if there are any sales at all
  const minThreshold = Math.max(1, Math.ceil(avgDailySales * DAYS_PER_WEEK));
  const maxThreshold = Math.max(1, Math.ceil(avgDailySales * DAYS_PER_MONTH));

  return {
    product_id:                productId,
    product_name:              product.name,
    calculated_min_threshold:  minThreshold,
    calculated_max_threshold:  maxThreshold,
    days_used_for_calculation: daysInData,
    average_daily_sales:       parseFloat(avgDailySales.toFixed(4)),
    status:                    'calculated',
  };
};

/* ── Save helper ─────────────────────────────────────────────────────────── */

/**
 * Writes lower_threshold + upper_threshold ONLY.
 * No other product field is touched.
 */
const saveThresholds = async (productId, minThreshold, maxThreshold) => {
  await Product.update(
    { lower_threshold: minThreshold, upper_threshold: maxThreshold },
    { where: { id: productId } }
  );
};

/* ── Public service functions ────────────────────────────────────────────── */

/**
 * recalculateForOne(productId)
 *
 * Calculate + save thresholds for a single product.
 * Returns the result object (same shape as calculateThresholdsForProduct).
 */
const recalculateForOne = async (productId) => {
  const result = await calculateThresholdsForProduct(productId);

  if (result.status === 'calculated') {
    await saveThresholds(productId, result.calculated_min_threshold, result.calculated_max_threshold);
    await invalidateProductCache();
  }

  return result;
};

/**
 * recalculateForAll()
 *
 * Calculate + save thresholds for every product in the catalogue.
 * Products without enough data are reported but not updated.
 *
 * Returns a summary + per-product results array.
 */
const recalculateForAll = async () => {
  // Fetch only IDs — we'll process each one individually
  const products = await Product.findAll({
    attributes: ['id'],
  });

  const results = [];
  let   updated = 0;
  let   skipped = 0;

  for (const { id } of products) {
    const result = await calculateThresholdsForProduct(id);
    results.push(result);

    if (result.status === 'calculated') {
      await saveThresholds(id, result.calculated_min_threshold, result.calculated_max_threshold);
      updated++;
    } else {
      skipped++;
    }
  }

  // One cache invalidation after all updates
  if (updated > 0) await invalidateProductCache();

  return {
    summary: {
      total:   products.length,
      updated,
      skipped,
    },
    results,
  };
};

module.exports = { recalculateForOne, recalculateForAll };
