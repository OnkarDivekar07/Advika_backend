'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('StockLogs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      productId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      productName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      quantityAdded: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      quantityBefore: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      quantityAfter: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      priceAtUpdate: {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: null,
      },
      isRolledBack: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      logDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Index for fast date-range queries
    await queryInterface.addIndex('StockLogs', ['logDate']);
    await queryInterface.addIndex('StockLogs', ['productId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('StockLogs');
  },
};
