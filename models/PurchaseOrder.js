const { DataTypes } = require('sequelize');
const sequelize = require('@utils/db');

const PurchaseOrder = sequelize.define('PurchaseOrder', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  supplier_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  // pending → approved → rejected
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
});
// Sequelize automatically manages createdAt and updatedAt

module.exports = PurchaseOrder;
