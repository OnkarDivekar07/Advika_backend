const purchaseOrderService = require('./purchaseOrder.service');

exports.getPendingOrders = async (req, res, next) => {
  try {
    const data = await purchaseOrderService.getPendingOrders();
    res.sendResponse({ message: 'Pending orders fetched', data });
  } catch (err) { next(err); }
};

exports.approveOrder = async (req, res, next) => {
  try {
    const data = await purchaseOrderService.approveOrder(req.params.orderId);
    res.sendResponse({ message: 'Order approved and sent to supplier', data });
  } catch (err) { next(err); }
};

exports.rejectOrder = async (req, res, next) => {
  try {
    await purchaseOrderService.rejectOrder(req.params.orderId);
    res.sendResponse({ message: 'Order rejected' });
  } catch (err) { next(err); }
};

exports.updateOrderItem = async (req, res, next) => {
  try {
    await purchaseOrderService.updateOrderItem(req.params.itemId, req.body.qty);
    res.sendResponse({ message: 'Item quantity updated' });
  } catch (err) { next(err); }
};
