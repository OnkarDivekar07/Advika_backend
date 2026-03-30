const { DataTypes } = require('sequelize');
const sequelize = require('@utils/db');

const Repayment = sequelize.define(
  'Repayment',
  {
    supplierName: { type: DataTypes.STRING, allowNull: false },
    contactDetails: { type: DataTypes.STRING, allowNull: false },
    amountOwed: { type: DataTypes.FLOAT, allowNull: false },
    dueDate: { type: DataTypes.DATE, allowNull: false },
  },
  { timestamps: true, tableName: 'repayments' }
);

module.exports = Repayment;
