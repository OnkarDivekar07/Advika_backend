const ProductSupplier = require('@root/models/productsupplier');
const Supplier = require('@root/models/supplier');

const getFirstSupplier = async (productId) => {
  const mapping = await ProductSupplier.findOne({
    where: { product_id: productId },
    include: [{ model: Supplier, where: { is_active: true } }],
    order: [['priority', 'ASC']],
  });

  return mapping ? mapping.Supplier : null;
};

module.exports = { getFirstSupplier };
