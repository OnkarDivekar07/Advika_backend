'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Change status column from STRING to ENUM with all valid statuses
    await queryInterface.changeColumn('PurchaseOrderItems', 'status', {
      type: Sequelize.ENUM(
        'pending',
        'approved',
        'ordered',
        'available',
        'not_available',
        'received',
        'cancelled'
      ),
      defaultValue: 'pending',
      allowNull: false,
    });

    // 2. Drop the old unique index that blocked supplier escalation
    try {
      await queryInterface.removeIndex('PurchaseOrderItems', 'unique_order_product_supplier');
    } catch (e) {
      console.log('Index unique_order_product_supplier not found — skipping removal');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('PurchaseOrderItems', 'status', {
      type: Sequelize.STRING,
      defaultValue: 'pending',
    });

    await queryInterface.addIndex('PurchaseOrderItems', ['order_id', 'product_id', 'supplier_id'], {
      unique: true,
      name: 'unique_order_product_supplier',
    });
  },
};
