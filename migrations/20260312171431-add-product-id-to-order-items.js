module.exports = {
  async up(queryInterface, Sequelize) {

    const table = await queryInterface.describeTable("PurchaseOrderItems");

    if (!table.product_id) {
      await queryInterface.addColumn(
        "PurchaseOrderItems",
        "product_id",
        {
          type: Sequelize.UUID,
          allowNull: false
        }
      );
    }

  },

  async down(queryInterface) {

    const table = await queryInterface.describeTable("PurchaseOrderItems");

    if (table.product_id) {
      await queryInterface.removeColumn(
        "PurchaseOrderItems",
        "product_id"
      );
    }

  }
};