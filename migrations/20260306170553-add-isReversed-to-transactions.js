"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("Transactions");

    if (!table.isReversed) {
      await queryInterface.addColumn("Transactions", "isReversed", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("Transactions");

    if (table.isReversed) {
      await queryInterface.removeColumn("Transactions", "isReversed");
    }
  },
};