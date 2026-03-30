'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex(
      'PurchaseOrderItems', // table name in DB
      ['order_id', 'product_id', 'supplier_id'],
      {
        unique: true,
        name: 'unique_order_product_supplier'
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex(
      'PurchaseOrderItems',
      'unique_order_product_supplier'
    );
  }
};