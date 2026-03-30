/**
 * @swagger
 * tags:
 *   name: Customer Count
 *   description: Track daily footfall count
 */

/**
 * @swagger
 * /api/customers/today:
 *   get:
 *     summary: Get today's customer count
 *     tags: [Customer Count]
 *     responses:
 *       200:
 *         description: Today's customer count
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
 *                         count: { type: integer, example: 42 }
 */

/**
 * @swagger
 * /api/customers/all:
 *   get:
 *     summary: Get customer counts for all days (newest first)
 *     tags: [Customer Count]
 *     responses:
 *       200:
 *         description: All daily counts
 */

/**
 * @swagger
 * /api/customers/{date}:
 *   get:
 *     summary: Get customer count for a specific date
 *     tags: [Customer Count]
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-03-22"
 *     responses:
 *       200:
 *         description: Count for that date
 *       404:
 *         description: No record for given date
 */

/**
 * @swagger
 * /api/customers/update:
 *   post:
 *     summary: Increment or decrement today's customer count
 *     tags: [Customer Count]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [change]
 *             properties:
 *               change:
 *                 type: integer
 *                 description: "+1 to increment, -1 to decrement"
 *                 example: 1
 *     responses:
 *       200:
 *         description: Updated count
 *       400:
 *         description: Count already 0 (cannot go below 0)
 */
