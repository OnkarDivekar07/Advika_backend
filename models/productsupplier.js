const { DataTypes } = require('sequelize');
const sequelize = require('@utils/db');

const ProductSupplier = sequelize.define('ProductSupplier', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  product_id: { type: DataTypes.UUID, allowNull: false },
  supplier_id: { type: DataTypes.UUID, allowNull: false },
  priority: { type: DataTypes.INTEGER, defaultValue: 1 },
});

module.exports = ProductSupplier;
