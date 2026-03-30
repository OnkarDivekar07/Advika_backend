'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("PurchaseOrderItems", "supplier_priority", {
      type: Sequelize.INTEGER,
      defaultValue: 1
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("PurchaseOrderItems", "supplier_priority");
  }
};