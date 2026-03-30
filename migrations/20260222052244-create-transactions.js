'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Transactions', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      productId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      itemsPurchased: {
        type: Sequelize.STRING,
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      totalAmount: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      profit: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      paymentMethod: {
        type: Sequelize.ENUM('cash', 'online'),
        allowNull: false
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Transactions');
  }
};