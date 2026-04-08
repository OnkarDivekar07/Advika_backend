/**
 * @swagger
 * tags:
 *   name: Threshold
 *   description: Dynamic stock threshold calculation based on historical product sales data.
 */

/**
 * @swagger
 * /api/threshold/recalculate/{productId}:
 *   post:
 *     summary: Recalculate and update thresholds for a single product
 *     description: >
 *       Calculates **minimum** and **maximum stock thresholds** for a product using
 *       historical sales data. Uses **maximum available dataset per product**
 *       (minimum requirement: last 60 days).
 *
 *       - **Minimum threshold** = estimated stock required for 1 week
 *       - **Maximum threshold** = estimated stock required for 1 month
 *
 *       Automatically updates:
 *       - `min_threshold`
 *       - `max_threshold`
 *
 *       Skips update if insufficient sales data is available.
 *     tags: [Threshold]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID whose thresholds should be recalculated
 *     responses:
 *       200:
 *         description: Threshold recalculation result for selected product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ThresholdResponse'
 */

/**
 * @swagger
 * /api/threshold/recalculate:
 *   post:
 *     summary: Recalculate and update thresholds for ALL products
 *     description: >
 *       Iterates through all products and recalculates:
 *       - minimum stock threshold (weekly requirement)
 *       - maximum stock threshold (monthly requirement)
 *
 *       Uses maximum available historical sales data per product
 *       (minimum requirement: last 60 days).
 *
 *       Updates only threshold-related fields:
 *       - `min_threshold`
 *       - `max_threshold`
 *
 *       Existing functionality remains unaffected.
 *     tags: [Threshold]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bulk threshold recalculation summary
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ThresholdBulkResponse'
 */

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     ThresholdResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Thresholds updated for product "Rose"
 *         data:
 *           type: object
 *           properties:
 *             product_id:
 *               type: string
 *               format: uuid
 *             product_name:
 *               type: string
 *               example: Rose
 *             calculated_min_threshold:
 *               type: integer
 *               example: 15
 *             calculated_max_threshold:
 *               type: integer
 *               example: 60
 *             average_daily_sales:
 *               type: number
 *               example: 2.1
 *             number_of_days_used_for_calculation:
 *               type: integer
 *               example: 120
 *             status:
 *               type: string
 *               enum: [calculated, skipped]
 *               example: calculated
 *             reason:
 *               type: string
 *               nullable: true
 *               example: Not enough sales data
 *
 *     ThresholdBulkResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Threshold recalculation complete. Updated: 12, Skipped: 3"
 *         data:
 *           type: object
 *           properties:
 *             summary:
 *               type: object
 *               properties:
 *                 updated:
 *                   type: integer
 *                   example: 12
 *                 skipped:
 *                   type: integer
 *                   example: 3
 *             products:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ThresholdResponse/properties/data'
 */