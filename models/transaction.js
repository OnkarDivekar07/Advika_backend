const { DataTypes } = require('sequelize');
const sequelize = require('@utils/db');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  itemsPurchased: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  profit: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'online'),
    allowNull: false,
  },
  isReversed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = Transaction;
