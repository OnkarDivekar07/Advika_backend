const { DataTypes } = require('sequelize');
const sequelize = require('@utils/db');

const PurchaseOrderItem = sequelize.define(
  'PurchaseOrderItem',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // Status lifecycle:
    // pending → approved → ordered → available / not_available → received
    // not_available → pending (escalation: a new row is created for next supplier)
    // cancelled (terminal)
    status: {
      type: DataTypes.ENUM(
        'pending',
        'approved',
        'ordered',
        'available',
        'not_available',
        'received',
        'cancelled'
      ),
      defaultValue: 'pending',
    },
    supplier_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    // Tracks which priority level this item is currently at (for escalation)
    supplier_priority: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    supplier_response: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }
  // NOTE: The old unique(order_id, product_id, supplier_id) index has been removed.
  // Reason: when a supplier says "not_available", escalation creates a NEW item row
  // for the next supplier rather than mutating the existing row. This preserves a full
  // audit trail and avoids unique constraint violations on retry.
);

module.exports = PurchaseOrderItem;
