const Product = require('@root/models/product');

const getSuggestedOrderQuantity = async () => {
  const products = await Product.findAll({
    attributes: ['id', 'name', 'marathiName', 'quantity', 'upper_threshold'],
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    marathiName: p.marathiName,
    quantity: p.quantity,
    upper_threshold: p.upper_threshold,
    suggested_order_quantity: Math.max((p.upper_threshold || 0) - (p.quantity || 0), 0),
  }));
};

module.exports = { getSuggestedOrderQuantity };
