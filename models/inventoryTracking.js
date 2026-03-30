const { DataTypes } = require('sequelize');
const sequelize = require('@utils/db');

const InventoTracking = sequelize.define(
  'InventoTracking',
  {
    date: { type: DataTypes.DATEONLY, allowNull: false, unique: true },
    totalinventoryValue: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
  },
  { timestamps: false }
);

module.exports = InventoTracking;
