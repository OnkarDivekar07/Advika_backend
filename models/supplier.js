const { DataTypes } = require('sequelize');
const sequelize = require('@utils/db');

const Supplier = sequelize.define('Supplier', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
});

module.exports = Supplier;
