const { Op } = require('sequelize');
const Product = require('@root/models/product');
const PurchaseOrder = require('@root/models/PurchaseOrder');
const PurchaseOrderItem = require('@root/models/PurchaseOrderItem');
const ProductSupplier = require('@root/models/productsupplier');
const Supplier = require('@root/models/supplier');
const sequelize = require('@utils/db');

/**
 * Auto-order generation logic:
 *
 * Trigger condition (per supplier group):
 *   At least ONE product for that supplier is AT or BELOW lower_threshold.
 *
 * Inclusion condition (which products get added to the order):
 *   Every product from that supplier that is below upper_threshold.
 *   Once a supplier order is triggered, the whole parcel is topped up —
 *   no point paying for delivery twice.
 *
 * Order qty = upper_threshold - current_quantity (fill to max).
 *
 * Deduplication: skip if a non-terminal item already exists for this
 * product+supplier combination (prevents double-ordering).
 *
 * Terminal statuses (safe to re-order): 'cancelled', 'not_available', 'received'
 */
const ACTIVE_STATUSES = ['pending', 'approved', 'ordered', 'available'];

const generateAutoOrders = async () => {
  const t = await sequelize.transaction();

  try {
    const products = await Product.findAll({ transaction: t });

    // Fetch all active-supplier mappings ordered by priority
    const mappings = await ProductSupplier.findAll({
      include: [{ model: Supplier, where: { is_active: true } }],
      order: [['priority', 'ASC']],
      transaction: t,
    });

    // Build product → primary supplier map (lowest priority number = highest priority)
    const productSupplierMap = {};
    for (const map of mappings) {
      if (!productSupplierMap[map.product_id]) {
        productSupplierMap[map.product_id] = map.supplier_id;
      }
    }

    // Group all eligible products by their primary supplier
    const supplierProducts = {};
    for (const product of products) {
      // Skip products with no meaningful threshold configuration
      if (!product.upper_threshold || product.upper_threshold <= product.lower_threshold) continue;

      const supplierId = productSupplierMap[product.id];
      if (!supplierId) continue; // no supplier mapped — skip

      if (!supplierProducts[supplierId]) supplierProducts[supplierId] = [];
      supplierProducts[supplierId].push(product);
    }

    for (const [supplierId, supplierProds] of Object.entries(supplierProducts)) {
      // ── Trigger check ────────────────────────────────────────────────────
      // Only proceed if at least one product for this supplier has hit lower_threshold
      const hasTriggered = supplierProds.some((p) => p.quantity <= p.lower_threshold);
      if (!hasTriggered) continue;

      // ── Inclusion check ──────────────────────────────────────────────────
      // Since we're already ordering from this supplier, bundle EVERY product
      // from them that isn't fully stocked. This makes the parcel economical —
      // one delivery covers everything, not just the product that triggered.
      const itemsToCreate = [];

      for (const product of supplierProds) {
        // Only include if there's actually something to top up
        const orderQty = product.upper_threshold - product.quantity;
        if (orderQty <= 0) continue;

        // Deduplication: skip if a live item already exists for this product + supplier
        const existing = await PurchaseOrderItem.findOne({
          where: {
            product_id:  product.id,
            supplier_id: supplierId,
            status:      { [Op.in]: ACTIVE_STATUSES },
          },
          transaction: t,
        });

        if (existing) continue;

        itemsToCreate.push({ product_id: product.id, qty: orderQty });
      }

      if (!itemsToCreate.length) continue;

      // ── Find or create a pending order for this supplier ─────────────────
      let order = await PurchaseOrder.findOne({
        where: { supplier_id: supplierId, status: 'pending' },
        transaction: t,
      });

      if (!order) {
        order = await PurchaseOrder.create(
          { supplier_id: supplierId, status: 'pending' },
          { transaction: t }
        );
      }

      // ── Create order items ───────────────────────────────────────────────
      for (const item of itemsToCreate) {
        await PurchaseOrderItem.create(
          {
            order_id:          order.id,
            product_id:        item.product_id,
            qty:               item.qty,
            supplier_id:       supplierId,
            supplier_priority: 1,
            status:            'pending',
          },
          { transaction: t }
        );
      }

      console.log(`Auto-order: created ${itemsToCreate.length} item(s) for supplier ${supplierId}`);
    }

    await t.commit();
    console.log('Auto-order generation completed successfully');
  } catch (err) {
    await t.rollback();
    console.error('Auto-order generation failed:', err.message);
    throw err;
  }
};

module.exports = { generateAutoOrders };
