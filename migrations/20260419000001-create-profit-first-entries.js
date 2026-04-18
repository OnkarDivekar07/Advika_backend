'use strict';

/**
 * Migration: ProfitFirstEntries
 *
 * Stores the manually-entered monthly targets for the Profit First framework.
 * Computed values (sales, cogs, opex_purchase, opex_other) are derived from
 * existing Transaction and Expense tables on the fly — only the three manual
 * buckets that require owner input are persisted here.
 *
 * Profit First allocations (of Real Revenue = Sales - COGS):
 *   profit        15%   — manually confirmed by owner
 *   emergency_fund 15%  — manually confirmed by owner
 *   owners_pay    30%   — manually confirmed by owner
 *   opex_other    40%   — transport + miscellaneous (computed, stored for history)
 *
 * month_key: "YYYY-MM" — one row per calendar month
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ProfitFirstEntries', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      month_key: {
        type: Sequelize.STRING(7), // "YYYY-MM"
        allowNull: false,
        unique: true,
      },
      profit_actual: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      emergency_fund_actual: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      owners_pay_actual: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('ProfitFirstEntries', ['month_key'], {
      name: 'idx_pfe_month_key',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ProfitFirstEntries');
  },
};
