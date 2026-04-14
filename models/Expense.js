const { DataTypes } = require('sequelize');
const sequelize = require('@utils/db');

/**
 * Expense — any outgoing payment from the store.
 *
 * expense_type:    purchase | transport | miscellaneous
 * payment_method:  cash | online
 *
 * For purchase expenses two modes are supported:
 *   Mode A (itemised): quantity + unit_cost → total_amount = qty × unit_cost
 *   Mode B (lump sum): total_amount set directly (quantity & unit_cost are null)
 *
 * For transport / miscellaneous:
 *   unit_cost = the single amount; total_amount = unit_cost; quantity = null
 */
const Expense = sequelize.define(
  'Expense',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    expense_type: {
      type: DataTypes.ENUM('purchase', 'transport', 'miscellaneous'),
      allowNull: false,
    },
    supplier_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    unit_cost: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
    },
    total_amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    payment_method: {
      type: DataTypes.ENUM('cash', 'online'),
      allowNull: false,
      defaultValue: 'cash',
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    expense_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  { tableName: 'Expenses', timestamps: true }
);

module.exports = Expense;
