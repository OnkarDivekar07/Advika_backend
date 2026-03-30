/**
 * @swagger
 * tags:
 *   name: Email
 *   description: Manual trigger for inventory alert emails (also runs automatically at 7 AM)
 */

/**
 * @swagger
 * /api/email/low-stock:
 *   post:
 *     summary: Manually trigger low-stock alert email
 *     tags: [Email]
 *     description: |
 *       Sends an email listing all products at or below their lower_threshold.
 *       This also runs automatically every day at 7:00 AM IST via cron.
 *     responses:
 *       200:
 *         description: Email sent or no products require reorder
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
 *                         sent:
 *                           type: boolean
 *                           example: true
 */
