const { DataTypes } = require('sequelize');
const sequelize = require('@utils/db');

/**
 * StockLog — one row per addStock call.
 * Stores what was added, the before/after quantity, price recorded at time of update.
 * isRolledBack=true means the add was reversed (quantity subtracted back).
 */
const StockLog = sequelize.define(
  'StockLog',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    productName: {
      // snapshot of name at time of update — survives product renames
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantityAdded: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantityBefore: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantityAfter: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    priceAtUpdate: {
      // price set during this stock update (null if not changed)
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
    },
    isRolledBack: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    logDate: {
      // DATEONLY for easy date-filter queries
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  { tableName: 'StockLogs', timestamps: true }
);

module.exports = StockLog;
