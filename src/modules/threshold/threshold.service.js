'use strict';

const { Op }       = require('sequelize');
const Product      = require('@root/models/product');
const Transaction  = require('@root/models/transaction');
const CustomError  = require('@utils/customError');
const { invalidateProductCache } = require('@utils/productCache');

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════ */

const MIN_DAYS_REQUIRED    = 60;   // refuse to calculate with fewer calendar days
const DEAD_STOCK_DAYS      = 60;   // days since last sale → forced non-moving
const BURST_TRIM_RATIO     = 0.10; // top 10% of sale-day volumes dropped before avg
const RECENT_WINDOW_DAYS   = 30;   // "recent" period for weighted avg
const RECENT_WEIGHT        = 0.60; // 60% weight to recent 30 days, 40% to older

/*
 * DEFAULT_LEAD_TIME_DAYS
 *
 * How many days between placing a reorder and stock arriving.
 * Used as a fallback when the Product record has no leadTimeDays field.
 * Override per-product by adding a `leadTimeDays` column to your Product model.
 * Even a rough estimate (5–7 days) is far better than assuming instant restock.
 */
const DEFAULT_LEAD_TIME_DAYS = 5;

/*
 * SAFETY_BUFFER_DAYS
 *
 * Extra days of demand added on top of lead time to absorb supplier delays,
 * transit variance, and unexpected demand spikes.
 * Formula: minThreshold covers (leadTime + safetyBuffer) days of demand.
 */
const SAFETY_BUFFER_DAYS = 3;

/*
 * CATEGORY_MULTIPLIERS
 *
 * Applied to base thresholds AFTER lead-time and weighted-avg corrections.
 * Fast-moving uses a dynamic rank-based multiplier (not this table).
 * Slow-moving tightened to 0.5/0.4 — your data shows over-investment here.
 * Non-moving is handled by early return (zero thresholds), never reaches here.
 */
const CATEGORY_MULTIPLIERS = {
  'slow-moving': { lower: 0.5, upper: 0.4 },
};


/* ═══════════════════════════════════════════════════════════════════════════
   DEMAND CALCULATION HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * buildDailySalesMap(transactions)
 *
 * Groups transaction quantities by calendar date string.
 * Returns a Map<dateString, totalUnits>.
 * Used by both the trimmed mean and the recency weighting.
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
 * trimmedMeanDailySales(dailyMap, trimRatio)
 *
 * Fix #2 — Burst Sales Protection
 *
 * Sorts sale-day volumes, drops the top `trimRatio` fraction (default 10%),
 * then averages the remainder. A single 2-day burst that sold 100 units
 * no longer inflates the average across quiet weeks.
 *
 * Example: 20 sale days, trim 10% → drop top 2 days, average the other 18.
 *
 * @param  {Map<string, number>} dailyMap
 * @param  {number}              trimRatio  0.10 = drop top 10%
 * @returns {{ trimmedAvg: number, keptDays: number, droppedDays: number }}
 */
const trimmedMeanDailySales = (dailyMap, trimRatio = BURST_TRIM_RATIO) => {
  const volumes = Array.from(dailyMap.values()).sort((a, b) => a - b);
  const dropCount = Math.floor(volumes.length * trimRatio);
  const kept = volumes.slice(0, volumes.length - dropCount); // drop highest

  const trimmedAvg = kept.length > 0
    ? kept.reduce((s, v) => s + v, 0) / kept.length
    : 0;

  return {
    trimmedAvg,
    keptDays:    kept.length,
    droppedDays: dropCount,
  };
};

/**
 * recentWeightedDailySales(dailyMap, recentWindowDays, recentWeight)
 *
 * Fix #3 — Seasonality / Trend Approximation
 *
 * Splits sale days into "recent" (last N days) and "older".
 * Computes a separate trimmed average for each bucket, then blends them:
 *   weightedAvg = (recentAvg × recentWeight) + (olderAvg × (1 − recentWeight))
 *
 * Effect: if demand is rising, recent data pulls the threshold up.
 *         if demand is falling, recent data pulls it down.
 * No ML required — just a weighted blend of two trimmed means.
 *
 * Edge cases:
 *   - No recent sales → uses older data at full weight (avoids zero threshold
 *     for products that sold well historically but had a quiet recent month).
 *   - No older sales  → uses recent data at full weight.
 *
 * @returns {{ weightedAvg, recentAvg, olderAvg, recentSaleDays, olderSaleDays }}
 */
const recentWeightedDailySales = (
  dailyMap,
  recentWindowDays = RECENT_WINDOW_DAYS,
  recentWeight     = RECENT_WEIGHT,
) => {
  const now         = new Date();
  const cutoff      = new Date(now - recentWindowDays * 24 * 60 * 60 * 1000);
  const recentMap   = new Map();
  const olderMap    = new Map();

  for (const [dateStr, units] of dailyMap) {
    const d = new Date(dateStr);
    if (d >= cutoff) recentMap.set(dateStr, units);
    else              olderMap.set(dateStr,  units);
  }

  const { trimmedAvg: recentAvg } = trimmedMeanDailySales(recentMap);
  const { trimmedAvg: olderAvg  } = trimmedMeanDailySales(olderMap);

  let weightedAvg;
  if (recentMap.size === 0 && olderMap.size > 0) {
    weightedAvg = olderAvg;                                   // no recent data
  } else if (olderMap.size === 0 && recentMap.size > 0) {
    weightedAvg = recentAvg;                                  // no older data
  } else {
    weightedAvg = (recentAvg * recentWeight) + (olderAvg * (1 - recentWeight));
  }

  return {
    weightedAvg,
    recentAvg:    parseFloat(recentAvg.toFixed(4)),
    olderAvg:     parseFloat(olderAvg.toFixed(4)),
    recentSaleDays: recentMap.size,
    olderSaleDays:  olderMap.size,
  };
};


/* ═══════════════════════════════════════════════════════════════════════════
   THRESHOLD FORMULA
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * computeLeadTimeAwareThresholds(avgDailySales, leadTimeDays)
 *
 * Fix #1 — Lead Time
 *
 * Old formula (no lead time awareness):
 *   min = avgDaily × 7   → "keep 1 week of stock"
 *   max = avgDaily × 30  → "keep 1 month of stock"
 *
 * New formula:
 *   min = avgDaily × (leadTime + safetyBuffer)
 *         → "keep enough stock to survive the reorder cycle + buffer"
 *   max = avgDaily × (leadTime + safetyBuffer + restockCycle)
 *         → restock cycle ≈ 30 days (configurable)
 *
 * Example with leadTime=5, safety=3, avgDaily=10:
 *   min = 10 × (5+3)  = 80  units  (trigger reorder when stock hits 80)
 *   max = 10 × (5+3+30) = 380 units (order up to this level)
 *
 * @param {number} avgDailySales
 * @param {number} leadTimeDays     - supplier lead time in days
 * @returns {{ baseMin, baseMax, reorderPoint, coverageDays }}
 */
const RESTOCK_CYCLE_DAYS = 30;

const computeLeadTimeAwareThresholds = (avgDailySales, leadTimeDays) => {
  const reorderPoint  = leadTimeDays + SAFETY_BUFFER_DAYS;          // days to cover
  const coverageDays  = reorderPoint + RESTOCK_CYCLE_DAYS;          // total max coverage

  const baseMin = Math.max(1, Math.ceil(avgDailySales * reorderPoint));
  const baseMax = Math.max(1, Math.ceil(avgDailySales * coverageDays));

  return { baseMin, baseMax, reorderPoint, coverageDays };
};


/* ═══════════════════════════════════════════════════════════════════════════
   STOCK STATUS + CATEGORY HELPERS  (unchanged from last version)
   ═══════════════════════════════════════════════════════════════════════════ */

const resolveStockStatus = (currentQty, minThreshold, maxThreshold) => {
  const qty = currentQty ?? 0;
  if (maxThreshold > 0 && qty > maxThreshold) return 'overstock';
  if (minThreshold > 0 && qty < minThreshold) return 'understock';
  return 'ok';
};

// Imported from ranking.service — keep classifyCategory in one place.
// If you can't import it, paste the identical implementation here.
const { classifyCategory } = require('@modules/ranking/ranking.service');


/* ═══════════════════════════════════════════════════════════════════════════
   CORE CALCULATION
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * calculateThresholdsForProduct(productId)
 *
 * Full pipeline:
 *   1. Dead-stock / no-sales guard            → zero thresholds, liquidate action
 *   2. Insufficient data guard                → skip, return status
 *   3. Recency override (Fix #2 from prev)    → stale products → non-moving
 *   4. Weighted + trimmed avg daily sales     → Fix #2 (burst) + Fix #3 (trend)
 *   5. Lead-time-aware base thresholds        → Fix #1
 *   6. Category + rank multiplier             → Fix #4 (slow mover tightened)
 *   7. Stock awareness                        → Fix #5 (prev)
 */
const calculateThresholdsForProduct = async (productId) => {
  const product = await Product.findByPk(productId, {
    attributes: [
      'id', 'name', 'rank', 'quantity',
      'lower_threshold', 'upper_threshold',
    ],
  });
  if (!product) throw new CustomError(`Product not found: ${productId}`, 404);

  const leadTimeDays = DEFAULT_LEAD_TIME_DAYS;

  const transactions = await Transaction.findAll({
    where: { productId, isReversed: false },
    attributes: ['quantity', 'date'],
    order: [['date', 'ASC']],
  });

  /* ── Guard: no sales at all ─────────────────────────────────────────── */
  if (!transactions.length) {
    return {
      product_id:               productId,
      product_name:             product.name,
      calculated_min_threshold: 0,
      calculated_max_threshold: 0,
      days_since_last_sale:     null,
      average_daily_sales:      0,
      category:                 'non-moving',
      status:                   'dead_stock',
      action:                   'liquidate_or_disable',
      stock_status:             resolveStockStatus(product.quantity, 0, 0),
    };
  }

  /* ── Date range ─────────────────────────────────────────────────────── */
  const now           = new Date();
  const msPerDay      = 1000 * 60 * 60 * 24;
  const firstDate     = new Date(transactions[0].date);
  const lastSaleDate  = new Date(transactions[transactions.length - 1].date);
  const daysSinceLastSale = Math.ceil((now - lastSaleDate) / msPerDay);
  const isStale           = daysSinceLastSale > DEAD_STOCK_DAYS;

  const rangeEnd   = lastSaleDate > now ? lastSaleDate : now;
  const daysInData = Math.max(1, Math.ceil((rangeEnd - firstDate) / msPerDay));

  /* ── Guard: insufficient calendar history ───────────────────────────── */
  if (daysInData < MIN_DAYS_REQUIRED) {
    return {
      product_id:                productId,
      product_name:              product.name,
      calculated_min_threshold:  null,
      calculated_max_threshold:  null,
      days_used_for_calculation: daysInData,
      days_since_last_sale:      daysSinceLastSale,
      average_daily_sales:       0,
      category:                  null,
      status:                    'insufficient_data',
      reason:                    `Only ${daysInData} day(s) of data. Minimum: ${MIN_DAYS_REQUIRED}.`,
      stock_status:              resolveStockStatus(
                                   product.quantity,
                                   product.lower_threshold,
                                   product.upper_threshold,
                                 ),
    };
  }

  /* ── Category resolution ────────────────────────────────────────────── */
  const totalRanked = await Product.count({ where: { rank: { [Op.not]: null } } });
  const category    = isStale ? 'non-moving' : classifyCategory(product.rank, totalRanked);

  /* ── Guard: dead / non-moving → zero thresholds ─────────────────────── */
  if (category === 'non-moving') {
    return {
      product_id:                productId,
      product_name:              product.name,
      calculated_min_threshold:  0,
      calculated_max_threshold:  0,
      days_used_for_calculation: daysInData,
      days_since_last_sale:      daysSinceLastSale,
      average_daily_sales:       0,
      category:                  'non-moving',
      status:                    'dead_stock',
      action:                    'liquidate_or_disable',
      forced_by_recency:         isStale,
      stock_status:              resolveStockStatus(product.quantity, 0, 0),
    };
  }

  /* ── Fix #2 + #3: Burst-trimmed, recency-weighted demand ────────────── */
  const dailyMap = buildDailySalesMap(transactions);
  const {
    weightedAvg,
    recentAvg,
    olderAvg,
    recentSaleDays,
    olderSaleDays,
  } = recentWeightedDailySales(dailyMap);

  const { keptDays, droppedDays } = trimmedMeanDailySales(dailyMap);
  const avgDailySales = weightedAvg; // final demand signal

  /* ── Fix #1: Lead-time-aware base thresholds ────────────────────────── */
  const { baseMin, baseMax, reorderPoint, coverageDays } =
    computeLeadTimeAwareThresholds(avgDailySales, leadTimeDays);

  /* ── Fix #4: Category multiplier ────────────────────────────────────── */
  let multiplier;
  if (category === 'fast-moving') {
    // Dynamic: rank #1 → full buffer (1.5/1.3), last fast-mover → no extra (1.0/1.0)
    const rankFactor = 1 - (product.rank / totalRanked);
    multiplier = {
      lower: parseFloat((1 + rankFactor * 0.5).toFixed(3)),
      upper: parseFloat((1 + rankFactor * 0.3).toFixed(3)),
    };
  } else {
    // Slow-moving: tightened to 0.5/0.4 (was 0.7/0.6)
    multiplier = CATEGORY_MULTIPLIERS['slow-moving'];
  }

  const minThreshold = Math.max(1, Math.ceil(baseMin * multiplier.lower));
  const maxThreshold = Math.max(1, Math.ceil(baseMax * multiplier.upper));

  /* ── Fix #5: Stock status ───────────────────────────────────────────── */
  const stockStatus = resolveStockStatus(product.quantity, minThreshold, maxThreshold);

  return {
    product_id:                productId,
    product_name:              product.name,
    calculated_min_threshold:  minThreshold,
    calculated_max_threshold:  maxThreshold,

    // Demand signal breakdown (audit trail)
    average_daily_sales:       parseFloat(avgDailySales.toFixed(4)),
    recent_avg_daily_sales:    recentAvg,
    older_avg_daily_sales:     olderAvg,
    recent_sale_days:          recentSaleDays,
    older_sale_days:           olderSaleDays,
    burst_days_dropped:        droppedDays,
    burst_days_kept:           keptDays,

    // Lead time breakdown (audit trail)
    lead_time_days:            leadTimeDays,
    reorder_point_days:        reorderPoint,   // leadTime + safetyBuffer
    coverage_days:             coverageDays,   // reorderPoint + restockCycle
    base_min_threshold:        baseMin,
    base_max_threshold:        baseMax,

    // Classification + multiplier
    category,
    applied_multiplier:        multiplier,
    forced_by_recency:         isStale,
    days_since_last_sale:      daysSinceLastSale,
    days_used_for_calculation: daysInData,

    status:                    'calculated',
    stock_status:              stockStatus,
  };
};


/* ═══════════════════════════════════════════════════════════════════════════
   SAVE HELPER  (unchanged)
   ═══════════════════════════════════════════════════════════════════════════ */

const saveThresholds = async (productId, minThreshold, maxThreshold) => {
  await Product.update(
    { lower_threshold: minThreshold, upper_threshold: maxThreshold },
    { where: { id: productId } },
  );
};


/* ═══════════════════════════════════════════════════════════════════════════
   PUBLIC API  (unchanged signatures — drop-in replacement)
   ═══════════════════════════════════════════════════════════════════════════ */

const recalculateForOne = async (productId) => {
  const result = await calculateThresholdsForProduct(productId);
  if (result.status === 'calculated') {
    await saveThresholds(productId, result.calculated_min_threshold, result.calculated_max_threshold);
    await invalidateProductCache();
  }
  return result;
};

const recalculateForAll = async () => {
  const products = await Product.findAll({ attributes: ['id'] });

  const results  = [];
  let   updated  = 0;
  let   skipped  = 0;
  let   deadStock = 0;

  for (const { id } of products) {
    const result = await calculateThresholdsForProduct(id);
    results.push(result);

    if (result.status === 'calculated') {
      await saveThresholds(id, result.calculated_min_threshold, result.calculated_max_threshold);
      updated++;
    } else if (result.status === 'dead_stock') {
      // Still save the zero thresholds so reorder service skips them cleanly
      await saveThresholds(id, 0, 0);
      deadStock++;
    } else {
      skipped++;
    }
  }

  if (updated + deadStock > 0) await invalidateProductCache();

  return {
    summary: {
      total:     products.length,
      updated,
      dead_stock: deadStock,
      skipped,
    },
    results,
  };
};

module.exports = {
  recalculateForOne,
  recalculateForAll,
  resolveStockStatus,
  // exported for unit testing individual stages
  buildDailySalesMap,
  trimmedMeanDailySales,
  recentWeightedDailySales,
  computeLeadTimeAwareThresholds,
};