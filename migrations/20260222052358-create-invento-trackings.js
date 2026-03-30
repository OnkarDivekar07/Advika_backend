'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('InventoTrackings', {
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        unique: true,
        primaryKey: true
      },
      totalinventoryValue: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('InventoTrackings');
  }
};