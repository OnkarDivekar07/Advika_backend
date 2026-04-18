'use strict';

/**
 * Adds leadDays and bufferDays to the Products table.
 *
 * leadDays  — how many calendar days from placing an order to stock arriving
 *             (replaces the global CONFIG.LEAD_TIME_DAYS = 15)
 *
 * bufferDays — safety stock in days on top of monthly demand
 *             (replaces CONFIG.SAFETY_DAYS per category)
 *
 * Defaults mirror the existing global CONFIG so existing thresholds are
 * unchanged until the operator explicitly sets per-product values.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Products', 'leadDays', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 15,   // matches former CONFIG.LEAD_TIME_DAYS
    });

    await queryInterface.addColumn('Products', 'bufferDays', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 7,    // conservative mid-point of former fast(15)/slow(7) range
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Products', 'leadDays');
    await queryInterface.removeColumn('Products', 'bufferDays');
  },
};
