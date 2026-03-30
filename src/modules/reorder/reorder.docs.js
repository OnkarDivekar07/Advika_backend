/**
 * @swagger
 * tags:
 *   name: Reorder
 *   description: Suggested reorder quantities based on thresholds
 */

/**
 * @swagger
 * /api/reorder/suggestions:
 *   get:
 *     summary: Get suggested order quantities for all products
 *     tags: [Reorder]
 *     description: |
 *       Returns all products with suggested_order_quantity = upper_threshold - current_quantity.
 *       A value of 0 means the product is already at or above its upper threshold.
 *     responses:
 *       200:
 *         description: Suggested order list
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
 *                           id: { type: string, format: uuid }
 *                           name: { type: string }
 *                           marathiName: { type: string }
 *                           quantity: { type: integer }
 *                           upper_threshold: { type: integer }
 *                           suggested_order_quantity: { type: integer }
 */
