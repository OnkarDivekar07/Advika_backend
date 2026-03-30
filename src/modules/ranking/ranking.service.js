const { Op } = require('sequelize');
const Product = require('@root/models/product');
const sequelize = require('@utils/db');

/**
 * Called inside the billing transaction after stock is deducted.
 * Increments salesCount by 1 for each UNIQUE product sold (frequency, not quantity).
 * Deduplicates productIds so a product appearing twice on one bill only counts once.
 * Then recomputes ranks for ALL products in the same DB transaction.
 *
 * @param {string[]} productIds - IDs of products sold in this billing (may contain duplicates)
 * @param {object}   t          - Sequelize transaction object
 */
const incrementAndRerank = async (productIds, t) => {
  // Deduplicate: if same product appears on multiple lines of one bill,
  // it still only counts as ONE sale event for frequency ranking
  const uniqueProductIds = [...new Set(productIds)];

  // Step 1: Bump salesCount +1 for each unique product sold in this billing
  await Product.increment('salesCount', {
    by: 1,
    where: { id: { [Op.in]: uniqueProductIds } },
    transaction: t,
  });

  // Step 2: Fetch all products ordered by salesCount DESC to assign ranks
  const allProducts = await Product.findAll({
    attributes: ['id', 'salesCount'],
    order: [['salesCount', 'DESC']],
    transaction: t,
    lock: t.LOCK.UPDATE,
  });

  // Step 3: Assign dense ranks.
  // salesCount = 0 → rank null (never sold).
  // Equal salesCount → same rank number.
  const updates = computeRanks(allProducts);

  // Step 4: Bulk update ranks
  await Promise.all(
    updates.map(({ id, rank }) =>
      Product.update({ rank }, { where: { id }, transaction: t })
    )
  );
};

/**
 * Called inside rollbackTransaction when a sale is reversed.
 * Decrements salesCount by 1 for the product and reruns ranking.
 * salesCount floor is 0 — it will never go negative.
 *
 * @param {string} productId - product whose sale is being reversed
 * @param {object} t         - Sequelize transaction object
 */
const decrementAndRerank = async (productId, t) => {
  const product = await Product.findByPk(productId, { transaction: t });
  if (!product) return; // guard: product may have been deleted

  // Floor at 0 — never go negative
  const newCount = Math.max(0, product.salesCount - 1);
  await product.update({ salesCount: newCount }, { transaction: t });

  // Recompute ranks across all products
  const allProducts = await Product.findAll({
    attributes: ['id', 'salesCount'],
    order: [['salesCount', 'DESC']],
    transaction: t,
    lock: t.LOCK.UPDATE,
  });

  const updates = computeRanks(allProducts);

  await Promise.all(
    updates.map(({ id, rank }) =>
      Product.update({ rank }, { where: { id }, transaction: t })
    )
  );
};

/**
 * Pure function: given a list of { id, salesCount } sorted DESC,
 * returns [{ id, rank }] with dense ranking.
 * salesCount = 0 → rank = null.
 */
const computeRanks = (products) => {
  const updates = [];
  let currentRank = 1;
  let prevCount = null;
  let rankGap = 0;

  for (const product of products) {
    if (product.salesCount === 0) {
      updates.push({ id: product.id, rank: null });
      continue;
    }

    if (prevCount === null) {
      rankGap = 1;
    } else if (product.salesCount < prevCount) {
      currentRank += rankGap;
      rankGap = 1;
    } else {
      // Same salesCount as previous → share rank
      rankGap++;
    }

    updates.push({ id: product.id, rank: currentRank });
    prevCount = product.salesCount;
  }

  return updates;
};

/**
 * Classifies a product's rank into a movement category.
 * Needs total number of ranked products to calculate thresholds.
 */
const classifyCategory = (rank, totalRanked) => {
  if (!rank) return 'non-moving';
  const fastCutoff = Math.ceil(totalRanked * 0.33);
  const slowCutoff = Math.ceil(totalRanked * 0.66);
  if (rank <= fastCutoff) return 'fast-moving';
  if (rank <= slowCutoff) return 'slow-moving';
  return 'slow-moving';
};

/**
 * GET /api/ranking
 * Returns all products sorted by rank (fast → slow → unranked).
 * Each product includes its category label (fast-moving / slow-moving / non-moving).
 */
const getRankings = async () => {
  const products = await Product.findAll({
    attributes: [
      'id', 'name', 'marathiName', 'quantity', 'salesCount', 'rank',
      'lower_threshold', 'upper_threshold', 'price', 'defaultUnit',
    ],
    order: [
      [sequelize.literal('`rank` IS NULL'), 'ASC'], // ranked products first
      [sequelize.literal('`rank`'), 'ASC'],                             // rank 1 first
    ],
  });

  const totalRanked = products.filter((p) => p.rank !== null).length;

  return products.map((p) => ({
    id:              p.id,
    name:            p.name,
    marathiName:     p.marathiName,
    quantity:        p.quantity,
    price:           p.price,
    defaultUnit:     p.defaultUnit,
    salesCount:      p.salesCount,
    rank:            p.rank,
    lower_threshold: p.lower_threshold,
    upper_threshold: p.upper_threshold,
    category:        classifyCategory(p.rank, totalRanked),
  }));
};

/**
 * GET /api/ranking/categories
 * Splits ranked products into fast / slow / non-moving buckets.
 * Top 33% → fast-moving, next 33% → slow-moving, bottom 34% + never-sold → non-moving/slow.
 */
const getRankingsByCategory = async () => {
  const all = await getRankings(); // already has category labels

  const fastMoving  = all.filter((p) => p.category === 'fast-moving');
  const slowMoving  = all.filter((p) => p.category === 'slow-moving');
  const nonMoving   = all.filter((p) => p.category === 'non-moving');

  return {
    summary: {
      total:      all.length,
      fastMoving: fastMoving.length,
      slowMoving: slowMoving.length,
      nonMoving:  nonMoving.length,
    },
    fastMoving,
    slowMoving,
    nonMoving,
  };
};

/**
 * Used by the email service.
 * Returns products that need reorder, sorted rank 1 first (fast-movers at top).
 */
const getReorderProductsRanked = async () => {
  const products = await Product.findAll({
    attributes: [
      'id', 'name', 'marathiName', 'quantity', 'salesCount', 'rank',
      'lower_threshold', 'upper_threshold',
    ],
    order: [
      [sequelize.literal('`rank` IS NULL'), 'ASC'],
      [sequelize.literal('`rank`'), 'ASC'],
    ],
  });

  const totalRanked = products.filter((p) => p.rank !== null).length;

  return products
    .filter((p) => p.quantity <= (p.lower_threshold ?? 5))
    .map((p) => {
      const orderQty = (p.upper_threshold ?? 100) - p.quantity;
      if (orderQty <= 0) return null;
      return {
        ...p.toJSON(),
        order_quantity: orderQty,
        category: classifyCategory(p.rank, totalRanked),
      };
    })
    .filter(Boolean);
};

/**
 * Admin utility: reset all ranks and salesCounts.
 * Useful for a seasonal reset or starting fresh.
 */
const resetRankings = async () => {
  await Product.update({ salesCount: 0, rank: null }, { where: {} });
};

module.exports = {
  incrementAndRerank,
  decrementAndRerank,
  getRankings,
  getRankingsByCategory,
  getReorderProductsRanked,
  resetRankings,
};