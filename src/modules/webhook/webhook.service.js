const PurchaseOrderItem = require('@root/models/PurchaseOrderItem');
const Product = require('@root/models/product');
const Supplier = require('@root/models/supplier');
const ProductSupplier = require('@root/models/productsupplier');
const { sendProductMessage } = require('@services/whatsapp/whatsappService');
const nodemailer = require('nodemailer');

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

/**
 * Sends an admin alert email when all suppliers for a product are exhausted.
 * Uses the same nodemailer transporter already used by email.service.js.
 */
const sendEscalationExhaustedAlert = async ({ productName, productId, orderId, itemId }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD || !process.env.RECIVER_EMAIL) {
    console.error('[Alert] Email env vars missing — cannot send escalation alert');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
  });

  await transporter.sendMail({
    from: `"Advika Flowers" <${process.env.EMAIL_USER}>`,
    to: process.env.RECIVER_EMAIL,
    subject: '⚠️ Supplier Escalation Exhausted — Manual Action Required',
    html: `
      <h2>⚠️ All Suppliers Exhausted</h2>
      <p>No further suppliers are available for the following item. <strong>Manual ordering is required.</strong></p>
      <table style="border-collapse:collapse;font-family:sans-serif;">
        <tr><td style="padding:6px 12px;font-weight:bold;">Product</td><td style="padding:6px 12px;">${productName}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold;">Product ID</td><td style="padding:6px 12px;">${productId}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold;">Order ID</td><td style="padding:6px 12px;">${orderId}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold;">Item ID</td><td style="padding:6px 12px;">${itemId}</td></tr>
      </table>
      <p style="margin-top:16px;color:#c00;">Please source this product manually and update inventory accordingly.</p>
    `,
  });

  console.log(`[Alert] Escalation-exhausted email sent for product ${productName} (${productId})`);
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

      // ── Admin alert: all suppliers exhausted ────────────────────────────
      const product = await Product.findByPk(item.product_id);
      try {
        await sendEscalationExhaustedAlert({
          productName: product?.name ?? 'Unknown',
          productId:   item.product_id,
          orderId:     item.order_id,
          itemId:      item.id,
        });
      } catch (alertErr) {
        console.error('[Alert] Failed to send escalation-exhausted email:', alertErr.message);
      }
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
