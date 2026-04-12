'use strict';

/**
 * threshold.service.js  —  One Order Per Month Model
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE MENTAL MODEL
 * ─────────────────────────────────────────────────────────────────────────
 * You place ONE order per month.
 * That order should stock you up for the ENTIRE month + a safety buffer.
 * You never need to order mid-month if you follow the numbers.
 *
 * HOW IT WORKS
 * ─────────────────────────────────────────────────────────────────────────
 *
 *   ORDER QUANTITY (what to order this month):
 *     = max_threshold − current_stock_on_hand
 *     Order this much and you're covered for the full month.
 *
 *   MAX THRESHOLD (stock up to this level each month):
 *     = avgDailySales × (30 days + safety buffer days)
 *     This covers full month demand + safety cushion.
 *
 *   MIN THRESHOLD (danger alert — stock should NEVER drop below this):
 *     = avgDailySales × safety buffer days
 *     If you hit this before month-end → you under-ordered last month.
 *     This is your early warning, not your reorder point.
 *
 * SAFETY BUFFER BY CATEGORY
 * ─────────────────────────────────────────────────────────────────────────
 *   Fast-moving: 7 days  → never run out, higher stakes
 *   Slow-moving: 4 days  → less cash locked up
 *   Non-moving:  0       → eliminate from stock entirely
 *
 * WORKED EXAMPLE — fast mover, sells 10 units/day
 * ─────────────────────────────────────────────────────────────────────────
 *   Monthly demand  = 10 × 30 = 300 units
 *   Safety buffer   = 10 ×  7 =  70 units
 *   Max threshold   = 370 units  ← stock up to here when you order
 *   Min threshold   =  70 units  ← alert if qty drops below this
 *   Order quantity  = 370 − current_stock  (e.g. 370 − 50 = 320 units)
 *
 * WORKED EXAMPLE — slow mover, sells 2 units/day
 * ─────────────────────────────────────────────────────────────────────────
 *   Monthly demand  =  2 × 30 = 60 units
 *   Safety buffer   =  2 ×  4 =  8 units
 *   Max threshold   = 68 units
 *   Min threshold   =  8 units
 *   Order quantity  = 68 − current_stock
 */

const { Op }      = require('sequelize');
const Product     = require('@root/models/product');
const Transaction = require('@root/models/transaction');
const CustomError = require('@utils/customError');
const { invalidateProductCache }  = require('@utils/productCache');
const { sendMinThresholdAlert }   = require('./threshold.alert');

/* ═══════════════════════════════════════════════════════════════════════════
   CONFIGURATION
   To tune the system: only touch values in this block.
   ═══════════════════════════════════════════════════════════════════════════ */

const CONFIG = {
  // One order covers this many days of demand
  ORDER_CYCLE_DAYS: 40,

  // Safety buffer by category (extra days of stock on top of monthly demand)
  // Fast movers get more buffer — stockout cost is higher
  // Slow movers get less buffer — less cash tied up
  SAFETY_DAYS: {
    'fast-moving': 15,
    'slow-moving': 7,
  },

  // Minimum days of history needed before we trust the average daily sales
  MIN_DAYS_REQUIRED: 60,

  // Product not sold in this many days → forced non-moving
  DEAD_STOCK_DAYS: 60,

  // Days from placing the order to stock arriving at your shop.
  // Stock consumed during this window must already be on the shelf.
  LEAD_TIME_DAYS: 15,

  // Classification cutoffs (by sales rank percentile)
  FAST_CUTOFF: 0.33,   // top 33% → fast-moving
  SLOW_CUTOFF: 0.66,   // next 33% → slow-moving, bottom 34% → non-moving
};

/* ═══════════════════════════════════════════════════════════════════════════
   STEP 1 — CLASSIFY
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Classify a product's movement category by its sales rank.
 *
 * rank = null  → never sold → non-moving
 * rank ≤ 33%   → fast-moving
 * rank ≤ 66%   → slow-moving
 * rank > 66%   → non-moving (bottom 34% — eliminate)
 */
const classifyCategory = (rank, totalRanked) => {
  if (!rank || totalRanked === 0) return 'non-moving';

  const fastCutoff = Math.ceil(totalRanked * CONFIG.FAST_CUTOFF);
  const slowCutoff = Math.ceil(totalRanked * CONFIG.SLOW_CUTOFF);

  if (rank <= fastCutoff) return 'fast-moving';
  if (rank <= slowCutoff) return 'slow-moving';
  return 'non-moving';
};

/* ═══════════════════════════════════════════════════════════════════════════
   STEP 2 — AVERAGE DAILY SALES
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Group transaction quantities by calendar date.
 * Returns Map<dateString → totalUnitsOnThatDay>.
 */
const buildDailySalesMap = (transactions) => {
  const map = new Map();
  for (const t of transactions) {
    const key = new Date(t.date).toDateString();
    map.set(key, (map.get(key) || 0) + (parseInt(t.quantity, 10) || 0));
  }
  return map;
};

/**
 * True average daily sales over the FULL calendar period.
 *
 * WHY THE OLD APPROACH WAS WRONG:
 *   The previous version divided total units by "sale days only" (dailyMap.size).
 *   That ignores every day the shop was open but the product didn't sell.
 *
 *   Example: 100 units sold over 10 sale-days, but 60 real calendar days.
 *     Old (wrong):  100 / 10 = 10 units/day  → massive overstock
 *     New (correct): 100 / 60 = 1.67 units/day → accurate order
 *
 * WHY daysInData (not dailyMap.size):
 *   daysInData = calendar days from first sale to today.
 *   This is the true denominator — it includes the quiet days.
 *   Every zero-sales day is automatically counted because we divide
 *   by the full period, not by the number of days with activity.
 *
 * @param {Array}  transactions - raw transaction rows (quantity, date)
 * @param {number} daysInData   - calendar days from first sale to today
 * @returns {number} avgDailySales
 */
const calcAvgDailySales = (transactions, daysInData) => {
  if (!transactions.length || daysInData <= 0) return 0;

  const totalUnits = transactions.reduce(
    (sum, t) => sum + (Number(t.quantity) || 0),
    0,
  );

  return totalUnits / daysInData;
};

/* ═══════════════════════════════════════════════════════════════════════════
   STEP 3 — MONTHLY ORDER THRESHOLDS
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Compute the min/max stock thresholds for a one-order-per-month model.
 *
 * max_threshold  = avgDaily × (ORDER_CYCLE_DAYS + safetyDays + LEAD_TIME_DAYS)
 *   → Stock up to this level when you place your monthly order.
 *   → Covers full month demand + lead time consumption + safety cushion.
 *
 * min_threshold  = avgDaily × safetyDays
 *   → Never let stock fall below this.
 *   → If it does before month-end, you under-ordered last month.
 *
 * order_quantity = max_threshold − current_stock
 *   → Order exactly this much. No more, no less.
 *
 * @param {number} avgDailySales
 * @param {'fast-moving'|'slow-moving'} category
 * @param {number} currentStock - product's current qty on hand
 * @returns {{ minThreshold, maxThreshold, orderQty, monthlyDemand, safetyBuffer, safetyDays, leadTimeDays }}
 */
const calcMonthlyOrderThresholds = (avgDailySales, category, currentStock) => {
  const safetyDays    = CONFIG.SAFETY_DAYS[category];
  const leadTimeDays  = CONFIG.LEAD_TIME_DAYS;
  const monthlyDemand = Math.ceil(avgDailySales * CONFIG.ORDER_CYCLE_DAYS);
  const safetyBuffer  = Math.ceil(avgDailySales * safetyDays);
  const leadBuffer    = Math.ceil(avgDailySales * leadTimeDays);

  const maxThreshold = monthlyDemand + safetyBuffer + leadBuffer;   // stock UP TO here
  const minThreshold = safetyBuffer + leadBuffer;                   // never DROP below here — covers safety + lead time

  // How much to order this month — floor at 0 (don't order if overstocked)
  const orderQty = Math.max(0, maxThreshold - (currentStock ?? 0));

  return {
    minThreshold:  Math.max(1, minThreshold),
    maxThreshold:  Math.max(1, maxThreshold),
    orderQty,
    monthlyDemand,
    safetyBuffer,
    safetyDays,
    leadTimeDays,
    leadBuffer,
  };
};

/* ═══════════════════════════════════════════════════════════════════════════
   STEP 4 — STOCK STATUS
   ═══════════════════════════════════════════════════════════════════════════ */

const resolveStockStatus = (currentQty, min, max) => {
  const qty = currentQty ?? 0;
  if (max > 0 && qty > max) return 'overstock';
  if (min > 0 && qty < min) return 'understock';
  return 'ok';
};

/* ═══════════════════════════════════════════════════════════════════════════
   CORE — calculateThresholdsForProduct
   ═══════════════════════════════════════════════════════════════════════════ */

const calculateThresholdsForProduct = async (productId) => {

  /* ── Load product ───────────────────────────────────────────────────── */
  const product = await Product.findByPk(productId, {
    attributes: ['id', 'name', 'rank', 'quantity', 'lower_threshold', 'upper_threshold'],
  });
  if (!product) throw new CustomError(`Product not found: ${productId}`, 404);

  /* ── Load all non-reversed sales ────────────────────────────────────── */
  const transactions = await Transaction.findAll({
    where:      { productId, isReversed: false },
    attributes: ['quantity', 'date'],
    order:      [['date', 'ASC']],
  });

  /* ── GUARD 1: Never sold ────────────────────────────────────────────── */
  if (transactions.length === 0) {
    return {
      product_id:               productId,
      product_name:             product.name,
      category:                 'non-moving',
      status:                   'dead_stock',
      action:                   'eliminate',
      calculated_min_threshold: 0,
      calculated_max_threshold: 0,
      order_qty_this_month:     0,
      average_daily_sales:      0,
      days_since_last_sale:     null,
      stock_status:             'ok',
    };
  }

  /* ── Date metrics ───────────────────────────────────────────────────── */
  const MS_PER_DAY        = 86_400_000;
  const now               = new Date();
  const firstDate         = new Date(transactions[0].date);
  const lastSaleDate      = new Date(transactions[transactions.length - 1].date);
  const daysSinceLastSale = Math.ceil((now - lastSaleDate) / MS_PER_DAY);
  const isStale           = daysSinceLastSale > CONFIG.DEAD_STOCK_DAYS;
  const rangeEnd          = lastSaleDate > now ? lastSaleDate : now;
  const daysInData        = Math.max(1, Math.ceil((rangeEnd - firstDate) / MS_PER_DAY));

  /* ── GUARD 2: Not enough history ────────────────────────────────────── */
  if (daysInData < CONFIG.MIN_DAYS_REQUIRED) {
    return {
      product_id:               productId,
      product_name:             product.name,
      category:                 null,
      status:                   'insufficient_data',
      reason:                   `Only ${daysInData} day(s) of data — need ${CONFIG.MIN_DAYS_REQUIRED}.`,
      calculated_min_threshold: null,
      calculated_max_threshold: null,
      order_qty_this_month:     null,
      average_daily_sales:      0,
      days_since_last_sale:     daysSinceLastSale,
      days_in_data:             daysInData,
      stock_status:             resolveStockStatus(
                                  product.quantity,
                                  product.lower_threshold,
                                  product.upper_threshold,
                                ),
    };
  }

  /* ── STEP 1: Classify ───────────────────────────────────────────────── */
  const totalRanked = await Product.count({ where: { rank: { [Op.not]: null } } });
  const category    = isStale ? 'non-moving' : classifyCategory(product.rank, totalRanked);

  /* ── GUARD 3: Non-moving → eliminate ───────────────────────────────── */
  if (category === 'non-moving') {
    return {
      product_id:               productId,
      product_name:             product.name,
      category:                 'non-moving',
      status:                   'dead_stock',
      action:                   'eliminate',
      forced_by_staleness:      isStale,
      calculated_min_threshold: 0,
      calculated_max_threshold: 0,
      order_qty_this_month:     0,
      average_daily_sales:      0,
      days_since_last_sale:     daysSinceLastSale,
      days_in_data:             daysInData,
      stock_status:             resolveStockStatus(product.quantity, 0, 0),
    };
  }

  /* ── STEP 2: Average daily sales ────────────────────────────────────── */
  const dailyMap      = buildDailySalesMap(transactions);   // kept for sale_days_in_history audit field
  const avgDailySales = calcAvgDailySales(transactions, daysInData);

  /* ── STEP 3: Monthly order thresholds ───────────────────────────────── */
  const {
    minThreshold,
    maxThreshold,
    orderQty,
    monthlyDemand,
    safetyBuffer,
    safetyDays,
  } = calcMonthlyOrderThresholds(avgDailySales, category, product.quantity);

  /* ── STEP 4: Stock status ───────────────────────────────────────────── */
  const stockStatus = resolveStockStatus(product.quantity, minThreshold, maxThreshold);

  return {
    product_id:   productId,
    product_name: product.name,

    // ── What matters most ────────────────────────────────────────────────
    category,
    stock_status:             stockStatus,
    order_qty_this_month:     orderQty,        // ORDER THIS MUCH right now
    calculated_min_threshold: minThreshold,    // alert if stock drops below this
    calculated_max_threshold: maxThreshold,    // stock up to this when ordering

    // ── How the numbers were derived ─────────────────────────────────────
    average_daily_sales: parseFloat(avgDailySales.toFixed(4)),
    monthly_demand:      monthlyDemand,        // avgDaily × 30
    safety_buffer_units: safetyBuffer,         // avgDaily × safetyDays
    safety_days_used:    safetyDays,

    // ── Audit trail ───────────────────────────────────────────────────────
    current_stock:        product.quantity ?? 0,
    sale_days_in_history: dailyMap.size,
    days_in_data:         daysInData,
    days_since_last_sale: daysSinceLastSale,
    status:               'calculated',
  };
};

/* ═══════════════════════════════════════════════════════════════════════════
   SAVE
   ═══════════════════════════════════════════════════════════════════════════ */

const saveThresholds = async (productId, min, max) => {
  await Product.update(
    { lower_threshold: min, upper_threshold: max },
    { where: { id: productId } },
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   PUBLIC API
   ═══════════════════════════════════════════════════════════════════════════ */

/** Recalculate + save for one product. */
const recalculateForOne = async (productId) => {
  const result = await calculateThresholdsForProduct(productId);

  if (result.status === 'calculated') {
    await saveThresholds(
      productId,
      result.calculated_min_threshold,
      result.calculated_max_threshold,
    );
    await invalidateProductCache();

    // Send alert if this product just dropped to or below its min threshold
    if (result.stock_status === 'understock') {
      await sendMinThresholdAlert([{
        product_name:  result.product_name,
        category:      result.category,
        current_stock: result.current_stock,
        min_threshold: result.calculated_min_threshold,
        units_below:   result.calculated_min_threshold - result.current_stock,
      }]).catch(() => {}); // fire-and-forget — never let email failure break the API
    }
  }

  return result;
};

/**
 * Recalculate + save for ALL products.
 *
 * Call this once at the start of each month to get your order list.
 * The `order_qty_this_month` field on each result tells you exactly
 * how many units to order from your supplier for that product.
 */
const recalculateForAll = async () => {
  const products = await Product.findAll({ attributes: ['id'] });

  const results  = [];
  let updated    = 0;
  let eliminated = 0;
  let skipped    = 0;

  for (const { id } of products) {
    const result = await calculateThresholdsForProduct(id);
    results.push(result);

    if (result.status === 'calculated') {
      await saveThresholds(id, result.calculated_min_threshold, result.calculated_max_threshold);
      updated++;
    } else if (result.status === 'dead_stock') {
      await saveThresholds(id, 0, 0);
      eliminated++;
    }
    // insufficient_data → leave existing thresholds untouched
    else { skipped++; }
  }

  if (updated + eliminated > 0) await invalidateProductCache();

  // Collect every calculated product whose stock is below min threshold
  const breached = results
    .filter(r => r.status === 'calculated' && r.stock_status === 'understock')
    .map(r => ({
      product_name:  r.product_name,
      category:      r.category,
      current_stock: r.current_stock,
      min_threshold: r.calculated_min_threshold,
      units_below:   r.calculated_min_threshold - r.current_stock,
    }));

  // Send one consolidated email if anything is breached — fire-and-forget
  sendMinThresholdAlert(breached).catch(() => {});

  // Monthly order list — only products that actually need stock
  // Sorted by order quantity descending so biggest orders are at the top
  const monthly_order_list = results
    .filter(r => r.status === 'calculated' && r.order_qty_this_month > 0)
    .sort((a, b) => b.order_qty_this_month - a.order_qty_this_month)
    .map(r => ({
      product_id:    r.product_id,
      product_name:  r.product_name,
      category:      r.category,
      current_stock: r.current_stock,
      order_qty:     r.order_qty_this_month,   // tell your supplier this number
      stock_after:   r.current_stock + r.order_qty_this_month,
    }));

  return {
    summary: {
      total:      products.length,
      updated,     // fast + slow movers recalculated
      eliminated,  // non-movers zeroed out
      skipped,     // insufficient history — thresholds unchanged
    },
    // Hand this list to your supplier — one order, covers the whole month
    monthly_order_list,
    // Full per-product detail if needed for debugging
    results,
  };
};

module.exports = {
  recalculateForOne,
  recalculateForAll,
  resolveStockStatus,
  // Exported for unit tests
  classifyCategory,
  buildDailySalesMap,
  calcAvgDailySales,
  calcMonthlyOrderThresholds,
};
