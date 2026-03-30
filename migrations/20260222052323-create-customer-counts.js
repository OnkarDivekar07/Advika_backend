'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CustomerCounts', {
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        unique: true,
        primaryKey: true
      },
      count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('CustomerCounts');
  }
};