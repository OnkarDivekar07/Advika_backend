'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // salesCount: cumulative number of times this product has been sold (frequency, not quantity)
    await queryInterface.addColumn('Products', 'salesCount', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Total number of sale transactions for this product (frequency counter)',
    });

    // rank: 1 = fastest moving, higher number = slower. NULL = unranked (new product)
    await queryInterface.addColumn('Products', 'rank', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: 'Auto-computed rank: 1 = top seller. Updated after every billing.',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Products', 'salesCount');
    await queryInterface.removeColumn('Products', 'rank');
  },
};
