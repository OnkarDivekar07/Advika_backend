const sequelize = require('@utils/db');
const PurchaseOrder = require('@root/models/PurchaseOrder');
const PurchaseOrderItem = require('@root/models/PurchaseOrderItem');
const Product = require('@root/models/product');
const Supplier = require('@root/models/supplier');
const { sendToSupplier } = require('@services/supplier/sendToSupplier');
const CustomError = require('@utils/customError');

// ─── Valid item status transitions ─────────────────────────────────────────
const VALID_TRANSITIONS = {
  pending:       ['approved', 'cancelled'],
  approved:      ['ordered', 'cancelled'],
  ordered:       ['available', 'not_available'],
  available:     ['received'],
  not_available: ['pending'],  // escalation only — done by webhook, not admin
  received:      [],           // terminal
  cancelled:     [],           // terminal
  rejected:      [],           // terminal (order level only)
};

const assertValidTransition = (currentStatus, nextStatus) => {
  const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new CustomError(
      `Invalid status transition: '${currentStatus}' → '${nextStatus}'. Allowed: [${allowed.join(', ') || 'none'}]`,
      400
    );
  }
};

// ─── Queries ───────────────────────────────────────────────────────────────

/**
 * Returns pending orders with each item's supplier response status
 * so partial fulfilment (some items available, some not) is visible.
 */
const getPendingOrders = async () => {
  const orders = await PurchaseOrder.findAll({
    where: { status: 'pending' },
    include: [
      {
        model: PurchaseOrderItem,
        as: 'PurchaseOrderItems',
        include: [
          { model: Supplier, as: 'Supplier', attributes: ['id', 'name', 'phone'] },
          { model: Product,  as: 'Product',  attributes: ['id', 'name', 'quantity', 'imageUrl'] },
        ],
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  // Annotate each order with a fulfilment summary so the frontend can show partial status
  return orders.map((order) => {
    const items = order.PurchaseOrderItems;
    const summary = {
      total:         items.length,
      pending:       items.filter((i) => i.status === 'pending').length,
      ordered:       items.filter((i) => i.status === 'ordered').length,
      available:     items.filter((i) => i.status === 'available').length,
      not_available: items.filter((i) => i.status === 'not_available').length,
      received:      items.filter((i) => i.status === 'received').length,
    };
    return { ...order.toJSON(), fulfilmentSummary: summary };
  });
};

// ─── Approve ───────────────────────────────────────────────────────────────

const approveOrder = async (orderId) => {
  // First fetch: check order exists and get items with Product association
  const order = await PurchaseOrder.findByPk(orderId, {
    include: [
      {
        model: PurchaseOrderItem,
        as: 'PurchaseOrderItems',
        include: [{ model: Product, as: 'Product' }],
      },
    ],
  });

  if (!order) throw new CustomError('Order not found', 404);
  if (order.status !== 'pending') throw new CustomError('Only pending orders can be approved', 400);
  if (!order.PurchaseOrderItems.length) throw new CustomError('Order has no items', 400);

  // Transition the order and all its pending items → approved (inside a transaction)
  await sequelize.transaction(async (t) => {
    const fresh = await PurchaseOrder.findByPk(orderId, { transaction: t, lock: t.LOCK.UPDATE });
    assertValidTransition(fresh.status, 'approved');
    fresh.status = 'approved';
    await fresh.save({ transaction: t });

    for (const item of order.PurchaseOrderItems) {
      if (item.status === 'pending') {
        assertValidTransition(item.status, 'approved');
        await item.update({ status: 'approved' }, { transaction: t });
      }
    }
  });

  // Re-fetch with live Sequelize instances AFTER committing.
  // IMPORTANT: we pass live instances (not toJSON()) to sendToSupplier
  // so that item.update({ status: 'ordered' }) works inside sendToSupplier.
  const updatedOrder = await PurchaseOrder.findByPk(orderId, {
    include: [
      {
        model: PurchaseOrderItem,
        as: 'PurchaseOrderItems',
        include: [{ model: Product, as: 'Product' }],
      },
    ],
  });

  // Only send approved items — don't re-notify items already in ordered/received etc.
  const approvedItems = updatedOrder.PurchaseOrderItems.filter((i) => i.status === 'approved');

  try {
    // Pass the live Sequelize instances directly (NOT toJSON())
    // so sendToSupplier can call item.update()
    await sendToSupplier({
      supplier_id: updatedOrder.supplier_id,
      id: updatedOrder.id,
      PurchaseOrderItems: approvedItems,
    });
  } catch (err) {
    // All WhatsApp sends failed — revert so admin can retry
    console.error('All supplier notifications failed — reverting order to pending:', err.message);

    await sequelize.transaction(async (t) => {
      const revert = await PurchaseOrder.findByPk(orderId, { transaction: t, lock: t.LOCK.UPDATE });
      revert.status = 'pending';
      await revert.save({ transaction: t });

      await PurchaseOrderItem.update(
        { status: 'pending' },
        { where: { order_id: orderId, status: 'approved' }, transaction: t }
      );
    });

    throw new CustomError('All WhatsApp notifications failed. Order reverted to pending.', 500);
  }

  return { orderId: updatedOrder.id };
};

// ─── Reject ────────────────────────────────────────────────────────────────

const rejectOrder = async (orderId) => {
  const order = await PurchaseOrder.findByPk(orderId);
  if (!order) throw new CustomError('Order not found', 404);

  // Order-level: 'pending' → 'rejected' (we keep 'rejected' as a separate status from 'cancelled')
  if (order.status !== 'pending') {
    throw new CustomError('Only pending orders can be rejected', 400);
  }

  await sequelize.transaction(async (t) => {
    order.status = 'rejected';
    await order.save({ transaction: t });

    // Item-level: pending/approved items → cancelled
    await PurchaseOrderItem.update(
      { status: 'cancelled' },
      { where: { order_id: orderId, status: ['pending', 'approved'] }, transaction: t }
    );
  });
};

// ─── Update item qty ────────────────────────────────────────────────────────

const updateOrderItem = async (itemId, qty) => {
  if (!Number.isInteger(qty) || qty <= 0 || qty > 100000) {
    throw new CustomError('qty must be an integer between 1 and 100000', 400);
  }

  const item = await PurchaseOrderItem.findByPk(itemId);
  if (!item) throw new CustomError('Item not found', 404);

  const order = await PurchaseOrder.findByPk(item.order_id);
  if (!order || order.status !== 'pending') {
    throw new CustomError('Can only update items on a pending order', 400);
  }

  if (item.status !== 'pending') {
    throw new CustomError(`Cannot edit item in status '${item.status}'`, 400);
  }

  item.qty = qty;
  await item.save();
};

module.exports = { getPendingOrders, approveOrder, rejectOrder, updateOrderItem };
