const Product = require('@root/models/product');
const sequelize = require('@utils/db');
const { classifyCategory } = require('@modules/ranking/ranking.service');

/**
 * DEFAULT CAPITAL CONFIG
 * totalCapital      = 9,00,000 (9 lakh)
 * currentlyInvested = 5,00,000 (5 lakh — already in stock)
 * toBeInvested      = 4,00,000 (4 lakh — upcoming months)
 *
 * Target allocation of totalCapital by value:
 *   fast-moving  → 70%
 *   slow-moving  → 25%
 *   non-moving   →  5%
 */
const DEFAULT_CONFIG = {
  totalCapital: 900000,
  currentlyInvested: 500000,
  toBeInvested: 400000,
  fastPct: 0.70,
  slowPct: 0.25,
  nonPct: 0.05,
};

/**
 * Computes required quantities for every product so that:
 *   - fast-movers collectively hold 70% of totalCapital in stock value
 *   - slow-movers collectively hold 25% of totalCapital in stock value
 *   - non-movers  collectively hold  5% of totalCapital in stock value
 *
 * FIXED ALLOCATION LOGIC:
 *   targetValue  = bucket's capital share (e.g. 70% of 9L = 6.3L)
 *   Each product's share within bucket is weighted by salesCount (fast/slow)
 *   or equally split (non-movers).
 *
 *   requiredQuantity = Math.ceil(productShare / price)
 *   This is the TOTAL quantity needed in stock to hold that value —
 *   it does NOT subtract current stock. The "delta" field tells you
 *   how many more you need to buy (positive) or how many are excess (negative).
 *
 * @param {object} config - override defaults if needed
 */
const getInventoryPlan = async (config = {}) => {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // 1. Fetch all products with ranking info
  const products = await Product.findAll({
    attributes: ['id', 'name', 'marathiName', 'quantity', 'price', 'salesCount', 'rank', 'defaultUnit'],
    order: [
      [sequelize.literal('`rank` IS NULL'), 'ASC'],
      [sequelize.literal('`rank`'), 'ASC'],
    ],
  });

  if (!products.length) return [];

  const totalRanked = products.filter((p) => p.rank !== null).length;

  // 2. Classify each product
  const classified = products.map((p) => ({
    id:           p.id,
    name:         p.name,
    marathiName:  p.marathiName,
    price:        p.price ?? 0,
    currentStock: p.quantity ?? 0,
    salesCount:   p.salesCount ?? 0,
    rank:         p.rank,
    defaultUnit:  p.defaultUnit,
    category:     classifyCategory(p.rank, totalRanked),
  }));

  // 3. Bucket
  const fast = classified.filter((p) => p.category === 'fast-moving');
  const slow = classified.filter((p) => p.category === 'slow-moving');
  const non  = classified.filter((p) => p.category === 'non-moving');

  // 4. Capital targets per bucket (share of totalCapital by value)
  const targetFast = cfg.totalCapital * cfg.fastPct;
  const targetSlow = cfg.totalCapital * cfg.slowPct;
  const targetNon  = cfg.totalCapital * cfg.nonPct;

  /**
   * Assigns required quantities to reach the target stock VALUE for the bucket.
   *
   * targetBudget = the total ₹ value this bucket should hold in stock
   * useWeights   = distribute by salesCount weight (fast/slow) or equally (non)
   *
   * requiredQuantity = the number of units needed so that
   *   (requiredQuantity × price) ≈ this product's share of targetBudget
   *
   * delta = requiredQuantity - currentStock
   *   positive → you need to BUY this many more units
   *   negative → you are OVERSTOCKED by this many units
   */
  const assign = (bucket, targetBudget, useWeights) => {
    if (!bucket.length) return bucket;

    const totalWeight = useWeights
      ? bucket.reduce((s, p) => s + Math.max(p.salesCount, 1), 0)
      : bucket.length;

    return bucket.map((p) => {
      const weight         = useWeights ? Math.max(p.salesCount, 1) : 1;
      const myTargetValue  = (weight / totalWeight) * targetBudget;
      const reqQty         = p.price > 0 ? Math.ceil(myTargetValue / p.price) : 0;
      const reqValue       = parseFloat((reqQty * p.price).toFixed(2));
      const currValue      = parseFloat((p.currentStock * p.price).toFixed(2));

      return {
        ...p,
        requiredQuantity: reqQty,      // total qty you SHOULD have in stock
        requiredValue:    reqValue,    // ₹ value at requiredQuantity
        currentValue:     currValue,   // ₹ value of what you have now
        delta:            reqQty - p.currentStock, // +ve = buy more, -ve = excess
      };
    });
  };

  const fastResult = assign(fast, targetFast, true);
  const slowResult = assign(slow, targetSlow, true);
  const nonResult  = assign(non,  targetNon,  false);

  // 5. Merge back in display order: fast → slow → non
  const allResult = [...fastResult, ...slowResult, ...nonResult];

  // 6. Build summary
  const totalRequiredValue = allResult.reduce((s, p) => s + p.requiredValue, 0);
  const totalCurrentValue  = allResult.reduce((s, p) => s + p.currentValue, 0);

  return {
    config: {
      totalCapital:      cfg.totalCapital,
      currentlyInvested: cfg.currentlyInvested,
      toBeInvested:      cfg.toBeInvested,
      targets: {
        fastMoving: `${(cfg.fastPct * 100).toFixed(0)}% = ₹${targetFast.toLocaleString('en-IN')}`,
        slowMoving: `${(cfg.slowPct * 100).toFixed(0)}% = ₹${targetSlow.toLocaleString('en-IN')}`,
        nonMoving:  `${(cfg.nonPct  * 100).toFixed(0)}% = ₹${targetNon.toLocaleString('en-IN')}`,
      },
    },
    summary: {
      totalProducts:      allResult.length,
      fastMovingCount:    fastResult.length,
      slowMovingCount:    slowResult.length,
      nonMovingCount:     nonResult.length,
      currentStockValue:  parseFloat(totalCurrentValue.toFixed(2)),
      requiredStockValue: parseFloat(totalRequiredValue.toFixed(2)),
    },
    products: allResult,
  };
};

module.exports = { getInventoryPlan };
