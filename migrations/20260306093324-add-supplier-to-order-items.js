module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn(
      "PurchaseOrderItems",
      "supplier_id",
      {
        type: Sequelize.UUID,
        allowNull: true,
      }
    );

    await queryInterface.addColumn(
      "PurchaseOrderItems",
      "supplier_response",
      {
        type: Sequelize.STRING,
        allowNull: true,
      }
    );

  },

  async down(queryInterface) {

    await queryInterface.removeColumn("PurchaseOrderItems","supplier_id");
    await queryInterface.removeColumn("PurchaseOrderItems","supplier_response");

  }
};