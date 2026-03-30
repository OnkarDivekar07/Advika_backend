const Supplier = require('@root/models/supplier');
const { sendProductMessage } = require('@services/whatsapp/whatsappService');

/**
 * Sends WhatsApp messages for every item in the order.
 *
 * Behaviour:
 *  - If a product association is missing on an item, that item is skipped with a warning.
 *  - If at least one WhatsApp message is sent successfully → resolves normally.
 *  - If EVERY item fails to send → throws an error so the caller (approveOrder) can revert.
 *  - Items that send successfully are marked 'ordered'.
 *  - Items that fail individually are left in 'approved' so admin can retry.
 */
const sendToSupplier = async (order) => {
  const supplier = await Supplier.findByPk(order.supplier_id);

  if (!supplier) throw new Error('Supplier not found');
  if (!supplier.is_active) throw new Error('Supplier is inactive');
  if (!supplier.phone) throw new Error('Supplier phone number is missing');

  let successCount = 0;
  let failCount    = 0;

  for (const item of order.PurchaseOrderItems) {
    // Guard: product must be loaded
    const product = item.Product;
    if (!product) {
      console.error(`Item ${item.id} has no Product association — skipping`);
      failCount++;
      continue;
    }

    try {
      await sendProductMessage(
        supplier.phone,
        supplier.name,
        product.name,
        item.qty,
        product.imageUrl || undefined,
        item.id
      );

      // Only mark ordered after confirmed send
      if (item.update) {
        await item.update({ status: 'ordered' });
      }

      successCount++;
    } catch (err) {
      console.error(`Failed to send WhatsApp for item ${item.id}:`, err.message);
      failCount++;
      // Do NOT rethrow — let other items continue
    }
  }

  // If every single item failed, propagate so approveOrder can revert the whole order
  if (successCount === 0 && failCount > 0) {
    throw new Error(`All ${failCount} WhatsApp notifications failed for order ${order.id}`);
  }

  console.log(`Order ${order.id}: ${successCount} sent, ${failCount} failed`);
};

module.exports = { sendToSupplier };
