"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("PurchaseOrderItems", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },

      order_id: {
        type: Sequelize.UUID,
        references: {
          model: "PurchaseOrders",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      product_id: {
        type: Sequelize.UUID,
        references: {
          model: "Products",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      qty: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      status: {
        type: Sequelize.STRING,
        defaultValue: "pending",
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
    await queryInterface.dropTable("PurchaseOrderItems");
  },
};