"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn(
      "PurchaseOrders",
      "supplier_id",
      {
        type: Sequelize.UUID,
        allowNull: false
      }
    );

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.removeColumn(
      "PurchaseOrders",
      "supplier_id"
    );

  }
};