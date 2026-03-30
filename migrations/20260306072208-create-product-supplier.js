"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ProductSuppliers", {

      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },

      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "Products",
          key: "id",
        },
      },

      supplier_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "Suppliers",
          key: "id",
        },
      },

      priority: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },

    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("ProductSuppliers");
  },
};