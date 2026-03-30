/**
 * @swagger
 * tags:
 *   name: Purchase Orders
 *   description: Admin approval of auto-generated purchase orders
 */

/**
 * @swagger
 * /api/purchase-orders:
 *   get:
 *     summary: Get all pending purchase orders with fulfilment summary
 *     tags: [Purchase Orders]
 *     description: |
 *       Returns all pending orders. Each order includes a `fulfilmentSummary`
 *       showing how many items are in each status (pending, ordered, available, not_available, received).
 *       This lets you track partial fulfilment — e.g. 3 items confirmed, 1 still waiting.
 *     responses:
 *       200:
 *         description: List of pending purchase orders
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PurchaseOrder'
 */

/**
 * @swagger
 * /api/purchase-orders/{orderId}/approve:
 *   patch:
 *     summary: Approve a purchase order and notify supplier via WhatsApp
 *     tags: [Purchase Orders]
 *     description: |
 *       Marks the order as approved and sends a WhatsApp message to the supplier
 *       for each item. If ALL messages fail, the order is automatically reverted to pending.
 *       If SOME messages succeed, the order stays approved and the failed items stay in 'approved'
 *       so admin can retry.
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Order approved and supplier notified
 *       400:
 *         description: Order is not in pending status
 *       404:
 *         description: Order not found
 *       500:
 *         description: All WhatsApp notifications failed — order reverted to pending
 */

/**
 * @swagger
 * /api/purchase-orders/{orderId}/reject:
 *   patch:
 *     summary: Reject a pending purchase order
 *     tags: [Purchase Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Order rejected
 *       400:
 *         description: Order is not in pending status
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /api/purchase-orders/items/{itemId}:
 *   patch:
 *     summary: Update quantity of a pending order item
 *     tags: [Purchase Orders]
 *     description: Can only be called when the parent order is still 'pending' and the item is 'pending'.
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [qty]
 *             properties:
 *               qty:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100000
 *                 example: 75
 *     responses:
 *       200:
 *         description: Item quantity updated
 *       400:
 *         description: Invalid qty or item not editable in current status
 *       404:
 *         description: Item not found
 */
