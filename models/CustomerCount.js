const { DataTypes } = require('sequelize');
const sequelize = require('@utils/db');

const CustomerCount = sequelize.define(
  'CustomerCount',
  {
    date: { type: DataTypes.DATEONLY, allowNull: false, unique: true },
    count: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
  },
  { timestamps: false }
);

module.exports = CustomerCount;
