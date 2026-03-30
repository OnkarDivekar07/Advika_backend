/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Billing, daily sales and profit tracking
 */

/**
 * @swagger
 * /api/transactions/billing:
 *   post:
 *     summary: Create a billing transaction (reduces stock)
 *     tags: [Transactions]
 *     description: |
 *       Send an array of items being sold. The LAST element must be a summary object
 *       with `total_amount` and `payment_method`. All previous elements are the line items.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *             example:
 *               - productId: "uuid-here"
 *                 item_name: Rose
 *                 quantity: 10
 *                 price: 30
 *                 total: 300
 *               - total_amount: 300
 *                 payment_method: cash
 *     responses:
 *       200:
 *         description: Transaction completed
 *       400:
 *         description: Insufficient stock or invalid data
 */

/**
 * @swagger
 * /api/transactions/rollback/{id}:
 *   patch:
 *     summary: Rollback a transaction (restores stock)
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction rolled back successfully
 *       400:
 *         description: Already reversed
 *       404:
 *         description: Transaction not found
 */

/**
 * @swagger
 * /api/transactions/daily:
 *   get:
 *     summary: Get all transactions for today
 *     tags: [Transactions]
 *     responses:
 *       200:
 *         description: List of today's transactions
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
 *                         $ref: '#/components/schemas/Transaction'
 */

/**
 * @swagger
 * /api/transactions/summary:
 *   get:
 *     summary: Get daily and monthly sales and profit summary
 *     tags: [Transactions]
 *     responses:
 *       200:
 *         description: Sales summary
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         dailyProfit: { type: string, example: "450.00" }
 *                         dailySales: { type: string, example: "1200.00" }
 *                         monthlyProfit: { type: string, example: "9000.00" }
 *                         monthlySales: { type: string, example: "30000.00" }
 */

/**
 * @swagger
 * /api/transactions/entries:
 *   get:
 *     summary: Get simplified daily entries (item name, qty, total only)
 *     tags: [Transactions]
 *     responses:
 *       200:
 *         description: Daily entry list
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
 *                         type: object
 *                         properties:
 *                           itemName: { type: string }
 *                           quantity: { type: integer }
 *                           total: { type: number }
 */
