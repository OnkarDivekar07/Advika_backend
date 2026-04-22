const Supplier = require('@root/models/supplier');
const ProductSupplier = require('@root/models/productsupplier');
const CustomError = require('@utils/customError');
const { maskSupplier } = require('@utils/maskSupplier');

const getAll = async () => {
  const suppliers = await Supplier.findAll({ where: { is_active: true } });
  // Mask name & phone before sending to frontend
  return suppliers.map((s) => maskSupplier(s.toJSON()));
};

const create = async ({ name, phone }) => {
  if (!name?.trim()) throw new CustomError('Supplier name is required', 400);
  // Model setter auto-encrypts name & phone before DB write
  return Supplier.create({ name: name.trim(), phone: phone || null, is_active: true });
};

const mapProductSupplier = async ({ product_id, suppliers }) => {
  if (!product_id || !suppliers?.length) {
    throw new CustomError('product_id and suppliers array are required', 400);
  }

  const mappings = suppliers.map((s) => ({
    product_id,
    supplier_id: s.supplier_id,
    priority:    s.priority ?? 1,
  }));

  // Delete all existing mappings for this product, then insert fresh.
  // This prevents stale rows accumulating when priorities are reassigned.
  await ProductSupplier.destroy({ where: { product_id } });
  return ProductSupplier.bulkCreate(mappings);
};

const getByProduct = async (productId) => {
  if (!productId) throw new CustomError('productId is required', 400);
  const rows = await ProductSupplier.findAll({
    where: { product_id: productId },
    include: [{ model: Supplier, as: 'Supplier', attributes: ['id', 'name'] }],
    order: [['priority', 'ASC']],
  });
  // Mask supplier name before sending to frontend (same as getAll)
  return rows.map((row) => {
    const plain = row.toJSON();
    plain.Supplier = maskSupplier(plain.Supplier);
    return plain;
  });
};

const archive = async (id) => {
  const supplier = await Supplier.findByPk(id);
  if (!supplier) throw new CustomError('Supplier not found', 404);
  await supplier.update({ is_active: false });
};

module.exports = { getAll, create, mapProductSupplier, getByProduct, archive };