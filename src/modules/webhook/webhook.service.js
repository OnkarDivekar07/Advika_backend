const PurchaseOrderItem = require('@root/models/PurchaseOrderItem');
const Product = require('@root/models/product');
const Supplier = require('@root/models/supplier');
const ProductSupplier = require('@root/models/productsupplier');
const { sendProductMessage } = require('@services/whatsapp/whatsappService');

// Items can only be acted on when they are in 'ordered' status
const ACTIONABLE_STATUSES = ['ordered'];

/**
 * Parse WhatsApp button payload safely.
 * Payload format: "AVAILABLE_<uuid>" or "NOT_AVAILABLE_<uuid>"
 * Split on the LAST underscore so the UUID is always correctly extracted
 * regardless of how many underscores are in the action prefix.
 */
const parsePayload = (payload) => {
  const lastIdx = payload.lastIndexOf('_');
  if (lastIdx === -1) return { action: null, itemId: null };
  return {
    action: payload.slice(0, lastIdx),   // "AVAILABLE" or "NOT_AVAILABLE"
    itemId: payload.slice(lastIdx + 1),  // the UUID
  };
};

const handleButtonReply = async (data) => {
  if (!data.entry) return;

  const message = data.entry[0]?.changes?.[0]?.value?.messages?.[0];
  if (!message || message.type !== 'interactive') return;

  const payload = message.interactive.button_reply.id;
  const waId    = message.from;

  const { action, itemId } = parsePayload(payload);
  if (!action || !itemId) {
    console.log('Could not parse webhook payload:', payload);
    return;
  }

  // Look up supplier by last 10 digits of WhatsApp number
  const supplier = await Supplier.findOne({
    where: { phone: waId.slice(-10), is_active: true },
  });
  if (!supplier) {
    console.log('Supplier not found for waId:', waId);
    return;
  }

  const item = await PurchaseOrderItem.findByPk(itemId);
  if (!item) {
    console.log('PurchaseOrderItem not found:', itemId);
    return;
  }

  // Status guard: only process items that have been sent to supplier
  if (!ACTIONABLE_STATUSES.includes(item.status)) {
    console.log(`Item ${item.id} is in status '${item.status}' — ignoring duplicate reply`);
    return;
  }

  if (action === 'AVAILABLE') {
    item.status = 'available';
    await item.save();
    console.log(`Item ${item.id} confirmed AVAILABLE by ${supplier.name}`);

  } else if (action === 'NOT_AVAILABLE') {
    item.status = 'not_available';
    await item.save();
    console.log(`Item ${item.id} marked NOT_AVAILABLE by ${supplier.name} — escalating`);

    // Find next supplier in priority order
    const nextMapping = await ProductSupplier.findOne({
      where: {
        product_id: item.product_id,
        priority:   item.supplier_priority + 1,
      },
      include: [{ model: Supplier, where: { is_active: true } }],
    });

    if (!nextMapping) {
      console.log(`No further suppliers for item ${item.id} — escalation exhausted`);
      return;
    }

    // Guard: avoid creating a duplicate row for the same order+product+supplier
    const existing = await PurchaseOrderItem.findOne({
      where: {
        order_id:    item.order_id,
        product_id:  item.product_id,
        supplier_id: nextMapping.supplier_id,
      },
    });

    if (existing) {
      console.log(`Row already exists for next supplier (item ${existing.id}) — skipping`);
      return;
    }

    // Create a new row for the next supplier (preserves full audit trail)
    const newItem = await PurchaseOrderItem.create({
      order_id:          item.order_id,
      product_id:        item.product_id,
      qty:               item.qty,
      supplier_id:       nextMapping.supplier_id,
      supplier_priority: nextMapping.priority,
      status:            'pending',
    });

    console.log(`Escalated → new item ${newItem.id} for supplier ${nextMapping.Supplier.name} (priority ${nextMapping.priority})`);

    // Load the product directly — don't rely on optional chaining on generated methods
    const product = await Product.findByPk(item.product_id);
    if (!product) {
      console.error(`Product not found for item ${newItem.id} — cannot send WhatsApp`);
      return;
    }

    if (!nextMapping.Supplier.phone) {
      console.error(`Next supplier ${nextMapping.Supplier.name} has no phone — cannot send WhatsApp`);
      return;
    }

    try {
      await sendProductMessage(
        nextMapping.Supplier.phone,
        nextMapping.Supplier.name,
        product.name,
        newItem.qty,
        product.imageUrl || undefined,
        newItem.id
      );
      await newItem.update({ status: 'ordered' });
      console.log(`WhatsApp sent to ${nextMapping.Supplier.name}`);
    } catch (err) {
      console.error(`Failed to notify next supplier for item ${newItem.id}:`, err.message);
      // Item stays 'pending' — admin can see it and manually re-approve
    }

  } else {
    console.log('Unknown action in payload:', action);
  }
};

const verifyWebhook = (mode, token, challenge) => {
  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    return challenge;
  }
  return null;
};

module.exports = { handleButtonReply, verifyWebhook };
