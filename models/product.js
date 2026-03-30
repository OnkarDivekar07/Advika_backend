const { DataTypes } = require('sequelize');
const sequelize = require('@utils/db');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  marathiName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  defaultUnit: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pcs',
    validate: { isIn: [['pcs', 'jodi', 'dozen']] },
  },
  lower_threshold: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  upper_threshold: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  // ── Ranking fields ────────────────────────────────────────────────────────
  // Incremented by +1 for every billing transaction that includes this product.
  // Tracks HOW OFTEN a product sells (frequency), not how many units were sold.
  salesCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  // Rank 1 = fastest moving. Recomputed across all products after every billing.
  // NULL means the product has never been sold yet.
  rank: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
});

module.exports = Product;
