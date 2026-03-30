"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Products", "defaultUnit", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "pcs",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Products", "defaultUnit");
  },
};