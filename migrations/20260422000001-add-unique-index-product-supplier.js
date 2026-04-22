'use strict';

module.exports = {
  async up(queryInterface) {
    // Remove duplicate rows first, keeping only the latest per (product_id, priority)
    await queryInterface.sequelize.query(`
      DELETE FROM "ProductSuppliers"
      WHERE id NOT IN (
        SELECT DISTINCT ON (product_id, priority) id
        FROM "ProductSuppliers"
        ORDER BY product_id, priority, "updatedAt" DESC
      );
    `);

    await queryInterface.addIndex('ProductSuppliers', ['product_id', 'priority'], {
      unique: true,
      name: 'unique_product_priority',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('ProductSuppliers', 'unique_product_priority');
  },
};
