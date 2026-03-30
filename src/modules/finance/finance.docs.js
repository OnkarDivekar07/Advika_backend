/**
 * @swagger
 * tags:
 *   name: Finance
 *   description: Cash vs online payment totals
 */

/**
 * @swagger
 * /api/finance/summary:
 *   get:
 *     summary: Get full finance summary (cash, online, grand total + all transactions)
 *     tags: [Finance]
 *     responses:
 *       200:
 *         description: Finance summary
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
 *                         cashTotal: { type: string, example: "12000.00" }
 *                         onlineTotal: { type: string, example: "8000.00" }
 *                         grandTotal: { type: string, example: "20000.00" }
 *                         transactions:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Transaction'
 */
