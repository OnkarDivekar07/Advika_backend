'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Expenses', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey:   true,
        allowNull:    false,
      },
      expense_type: {
        type:      Sequelize.ENUM('purchase', 'transport', 'miscellaneous'),
        allowNull: false,
      },
      supplier_id: {
        type:       Sequelize.UUID,
        allowNull:  true,
        references: { model: 'Suppliers', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'SET NULL',
      },
      description: {
        type:      Sequelize.STRING,
        allowNull: false,
      },
      quantity: {
        type:         Sequelize.INTEGER,
        allowNull:    true,
        defaultValue: null,
      },
      unit_cost: {
        type:         Sequelize.FLOAT,
        allowNull:    true,
        defaultValue: null,
      },
      total_amount: {
        type:      Sequelize.FLOAT,
        allowNull: false,
      },
      payment_method: {
        type:         Sequelize.ENUM('cash', 'online'),
        allowNull:    false,
        defaultValue: 'cash',
      },
      notes: {
        type:      Sequelize.STRING,
        allowNull: true,
      },
      expense_date: {
        type:         Sequelize.DATE,
        allowNull:    false,
        defaultValue: Sequelize.NOW,
      },
      createdAt: {
        type:      Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type:      Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Indexes for common query patterns used in the service
    await queryInterface.addIndex('Expenses', ['expense_date'], { name: 'idx_expenses_date' });
    await queryInterface.addIndex('Expenses', ['expense_type'],  { name: 'idx_expenses_type' });
    await queryInterface.addIndex('Expenses', ['supplier_id'],   { name: 'idx_expenses_supplier' });
    await queryInterface.addIndex('Expenses', ['payment_method'],{ name: 'idx_expenses_payment' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Expenses');
  },
};
