/**
 * @swagger
 * tags:
 *   name: QR Code
 *   description: Generate QR codes for products
 */

/**
 * @swagger
 * /api/qr/generate:
 *   post:
 *     summary: Generate a QR code for a product ID
 *     tags: [QR Code]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 example: "a1b2c3d4-e5f6-..."
 *     responses:
 *       200:
 *         description: QR code as base64 data URL
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
 *                         qr:
 *                           type: string
 *                           description: Base64 data URL (data:image/png;base64,...)
 *       400:
 *         description: productId is required
 */
