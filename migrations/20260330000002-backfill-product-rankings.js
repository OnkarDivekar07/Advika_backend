'use strict';

/**
 * BACKFILL MIGRATION
 *
 * Populates salesCount and rank for all existing products using historical
 * transaction data that existed before the ranking feature was introduced.
 *
 * Logic:
 *   salesCount = number of non-reversed Transactions rows where productId matches
 *                (frequency of sale — how many billing events included this product,
 *                 NOT total quantity sold)
 *
 *   rank       = dense rank ordered by salesCount DESC
 *                rank 1 = sold most frequently
 *                rank NULL = product has never been sold
 *
 * This migration must run AFTER 20260330000001-add-ranking-to-products.js
 */
module.exports = {
  async up(queryInterface) {
    // ── Step 1: Count sale frequency per product from Transactions ────────────
    // Each row in Transactions = one product in one billing event.
    // We count rows (not sum quantity) because rank is based on frequency.
    const [salesData] = await queryInterface.sequelize.query(`
      SELECT
        productId,
        COUNT(*) AS salesCount
      FROM Transactions
      WHERE
        productId IS NOT NULL
        AND isReversed = false
      GROUP BY productId
      ORDER BY salesCount DESC
    `);

    if (salesData.length === 0) {
      console.log('  No historical transactions found — salesCount stays 0 for all products.');
      return;
    }

    console.log(`  Backfilling salesCount for ${salesData.length} products from transaction history...`);

    // ── Step 2: Assign dense ranks ────────────────────────────────────────────
    // Products with the same salesCount share the same rank.
    // Example: counts [50, 50, 30, 20, 20, 5] → ranks [1, 1, 2, 3, 3, 4]
    const updates = [];
    let currentRank = 1;
    let prevCount = null;
    let rankGap = 0;

    for (const row of salesData) {
      const count = parseInt(row.salesCount, 10);

      if (prevCount !== null && count < prevCount) {
        currentRank += rankGap;
        rankGap = 1;
      } else if (prevCount === null) {
        rankGap = 1;
      } else {
        rankGap++;
      }

      updates.push({
        productId:  row.productId,
        salesCount: count,
        rank:       currentRank,
      });

      prevCount = count;
    }

    // ── Step 3: Apply updates to Products table ───────────────────────────────
    for (const { productId, salesCount, rank } of updates) {
      await queryInterface.sequelize.query(
        'UPDATE Products SET salesCount = ?, `rank` = ? WHERE id = ?',
        { replacements: [salesCount, rank, productId] }
      );
    }

    console.log(`  Done. ${updates.length} products ranked. Highest salesCount: ${updates[0]?.salesCount ?? 0}`);
  },

  async down(queryInterface) {
    // Reset everything back to zero / null
    await queryInterface.sequelize.query(
      'UPDATE Products SET salesCount = 0, `rank` = NULL'
    );
    console.log('  Backfill reversed — salesCount and rank cleared.');
  },
};
