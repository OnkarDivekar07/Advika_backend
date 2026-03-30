'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('repayments', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      supplierName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      contactDetails: {
        type: Sequelize.STRING,
        allowNull: false
      },
      amountOwed: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      dueDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('repayments');
  }
};