const { Op } = require('sequelize');
const sharp = require('sharp');
const Product = require('@root/models/product');
const PurchaseOrderItem = require('@root/models/PurchaseOrderItem');
const StockLog = require('@root/models/StockLog');
const sequelize = require('@utils/db');
const { uploadToS3, deleteFromS3 } = require('@utils/AWSUploads');
const CustomError = require('@utils/customError');
const { invalidateProductCache } = require('@utils/productCache'); // ← was missing

const ALLOWED_UNITS = ['pcs', 'jodi', 'dozen'];

// Safe number parser — returns null if value is undefined/null, NaN-safe
const toNum = (val, parser = Number) => {
  if (val === undefined || val === null || val === '') return null;
  const n = parser(val);
  return isNaN(n) ? null : n;
};

const addProducts = async (input) => {
  const products = Array.isArray(input) ? input : [input];

  const sanitized = products.map((p) => {
    if (!p.name?.trim()) throw new CustomError('Product name is required', 400);
    const price = toNum(p.price, parseFloat);
    if (price === null || price <= 0) throw new CustomError(`Invalid price for product "${p.name}"`, 400);
    return {
      name:            p.name.trim(),
      quantity:        toNum(p.quantity, parseInt) ?? 0,
      price,
      lower_threshold: toNum(p.lower_threshold, parseInt) ?? 0,
      upper_threshold: toNum(p.upper_threshold, parseInt) ?? 0,
    };
  });

  const created = await Product.bulkCreate(sanitized);
  await invalidateProductCache();
  return created;
};

const getAllProducts = async () =>
  Product.findAll({
    attributes: [
      'id',
      'name',
      'marathiName',
      'quantity',
      'price',
      'imageUrl',
      'defaultUnit',
      'lower_threshold',
      'upper_threshold',
      'leadDays',
      'bufferDays',
      'salesCount',
      'rank'
    ]
  });

const getProductById = async (id) => {
  const product = await Product.findByPk(id);
  if (!product) throw new CustomError('Product not found', 404);
  return product;
};

const updateLeadBuffer = async (id, { leadDays, bufferDays }) => {
  const product = await Product.findByPk(id);
  if (!product) throw new CustomError('Product not found', 404);

  const updates = {};
  const lead   = toNum(leadDays,   parseInt);
  const buffer = toNum(bufferDays, parseInt);

  if (lead   !== null && lead   >= 0) updates.leadDays   = lead;
  if (buffer !== null && buffer >= 0) updates.bufferDays = buffer;

  if (Object.keys(updates).length === 0) {
    throw new CustomError('Provide at least one of leadDays or bufferDays', 400);
  }

  await product.update(updates);
  await invalidateProductCache();
  return { id: product.id, name: product.name, ...updates };
};

const updateProduct = async (id, data) => {
  const product = await Product.findByPk(id);
  if (!product) throw new CustomError('Product not found', 404);

  const updates = {};
  if (data.name !== undefined)            updates.name            = data.name;
  if (data.quantity !== undefined)        updates.quantity        = toNum(data.quantity, parseInt) ?? product.quantity;
  if (data.price !== undefined)           updates.price           = toNum(data.price, parseFloat) ?? product.price;
  if (data.lower_threshold !== undefined) updates.lower_threshold = toNum(data.lower_threshold, parseInt) ?? product.lower_threshold;
  if (data.upper_threshold !== undefined) updates.upper_threshold = toNum(data.upper_threshold, parseInt) ?? product.upper_threshold;

  await product.update(updates);
  await invalidateProductCache();
};

const deleteProduct = async (id) => {
  const product = await Product.findByPk(id);
  if (!product) throw new CustomError('Product not found', 404);
  await product.destroy();
  await invalidateProductCache();
};

const addStock = async ({ productId, addQuantity, price, lower_threshold, upper_threshold }) => {
  return sequelize.transaction(async (t) => {
    const product = await Product.findByPk(productId, { transaction: t });
    if (!product) throw new CustomError('Product not found', 404);

    const qty = toNum(addQuantity, parseInt);
    if (!qty || qty <= 0) throw new CustomError('addQuantity must be a positive integer', 400);

    const quantityBefore = product.quantity;
    const updateData = { quantity: quantityBefore + qty };

    const parsedPrice = toNum(price, parseFloat);
    if (parsedPrice !== null && parsedPrice >= 0) updateData.price = parsedPrice;

    const parsedLower = toNum(lower_threshold, parseInt);
    if (parsedLower !== null) updateData.lower_threshold = parsedLower;

    const parsedUpper = toNum(upper_threshold, parseInt);
    if (parsedUpper !== null) updateData.upper_threshold = parsedUpper;

    await product.update(updateData, { transaction: t });

    // ── Write stock log ────────────────────────────────────────────────────
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    await StockLog.create(
      {
        productId,
        productName:    product.name,
        quantityAdded:  qty,
        quantityBefore,
        quantityAfter:  updateData.quantity,
        priceAtUpdate:  parsedPrice !== null ? parsedPrice : null,
        isRolledBack:   false,
        logDate:        today,
      },
      { transaction: t }
    );
    // ──────────────────────────────────────────────────────────────────────

    const item = await PurchaseOrderItem.findOne({
      where: {
        product_id: productId,
        status: { [Op.in]: ['approved', 'ordered', 'available'] },
      },
      order: [['createdAt', 'DESC']],
      transaction: t,
    });

    if (item) await item.update({ status: 'received' }, { transaction: t });

    return {
      id:              product.id,
      name:            product.name,
      quantity:        updateData.quantity,
      price:           updateData.price           ?? product.price,
      lower_threshold: updateData.lower_threshold ?? product.lower_threshold,
      upper_threshold: updateData.upper_threshold ?? product.upper_threshold,
    };
  });
};

// Thin wrapper so invalidation runs AFTER the transaction commits
const addStockAndInvalidate = async (payload) => {
  const result = await addStock(payload);
  await invalidateProductCache();
  return result;
};

const uploadImage = async (id, file) => {
  if (!file) throw new CustomError('No image uploaded', 400);

  const product = await Product.findByPk(id);
  if (!product) throw new CustomError('Product not found', 404);

  if (product.imageUrl) {
    try {
      const oldKey = product.imageUrl.split('.com/')[1];
      if (oldKey) await deleteFromS3(oldKey);
    } catch (err) {
      console.error('Failed to delete old image (continuing):', err.message);
    }
  }

  const compressedBuffer = await sharp(file.buffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 75 })
    .toBuffer();

  const key = `product-images/${id}-${Date.now()}.jpg`;
  const imageUrl = await uploadToS3(compressedBuffer, key, 'image/jpeg');

  await product.update({ imageUrl });
  await invalidateProductCache();
  return imageUrl;
};

const deleteImage = async (id) => {
  const product = await Product.findByPk(id);
  if (!product) throw new CustomError('Product not found', 404);
  if (!product.imageUrl) throw new CustomError('No image to delete', 400);

  const key = product.imageUrl.split('.com/')[1];
  if (key) await deleteFromS3(key);
  await product.update({ imageUrl: null });
  await invalidateProductCache();
};

const updateMarathiName = async (id, marathiName) => {
  const product = await Product.findByPk(id);
  if (!product) throw new CustomError('Product not found', 404);
  await product.update({ marathiName });
  await invalidateProductCache();
};

const updateDefaultUnit = async (id, defaultUnit) => {
  if (!ALLOWED_UNITS.includes(defaultUnit)) {
    throw new CustomError(`Invalid unit. Allowed: ${ALLOWED_UNITS.join(', ')}`, 400);
  }
  const product = await Product.findByPk(id);
  if (!product) throw new CustomError('Product not found', 404);
  await product.update({ defaultUnit });
  await invalidateProductCache();
  return { id: product.id, name: product.name, defaultUnit };
};

// ─────────────────────────────────────────────────────────────
// 📋 STOCK LOGS — list by date
// ─────────────────────────────────────────────────────────────
const getStockLogs = async ({ date } = {}) => {
  // Default to today if no date given
  const targetDate = date || new Date().toISOString().slice(0, 10);

  return StockLog.findAll({
    where: { logDate: targetDate },
    include: [
      {
        model: Product,
        as: 'Product',
        attributes: ['id', 'name', 'marathiName', 'quantity'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });
};

// ─────────────────────────────────────────────────────────────
// ↩️ ROLLBACK STOCK LOG — subtract the added quantity back
// ─────────────────────────────────────────────────────────────
const rollbackStockLog = async (logId) => {
  return sequelize.transaction(async (t) => {
    const log = await StockLog.findByPk(logId, { transaction: t });
    if (!log) throw new CustomError('Stock log not found', 404);
    if (log.isRolledBack) throw new CustomError('This stock update has already been rolled back', 400);

    const product = await Product.findByPk(log.productId, { transaction: t });
    if (!product) throw new CustomError('Product no longer exists', 404);

    const newQty = product.quantity - log.quantityAdded;
    if (newQty < 0) throw new CustomError(
      `Cannot rollback: current stock (${product.quantity}) is less than the quantity added (${log.quantityAdded})`,
      400
    );

    await product.update({ quantity: newQty }, { transaction: t });
    await log.update({ isRolledBack: true }, { transaction: t });

    return {
      logId:          log.id,
      productId:      product.id,
      productName:    product.name,
      quantityRemoved: log.quantityAdded,
      newQuantity:    newQty,
    };
  });
};

module.exports = {
  addProducts,
  getAllProducts,
  getProductById,
  updateProduct,
  updateLeadBuffer,
  deleteProduct,
  addStock: addStockAndInvalidate, // wraps addStock + cache invalidation
  uploadImage,
  deleteImage,
  updateMarathiName,
  updateDefaultUnit,
  getStockLogs,
  rollbackStockLog,
};
