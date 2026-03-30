/**
 * @swagger
 * tags:
 *   name: Suppliers
 *   description: Supplier management and product-supplier mapping
 */

/**
 * @swagger
 * /api/suppliers:
 *   get:
 *     summary: Get all active suppliers
 *     tags: [Suppliers]
 *     responses:
 *       200:
 *         description: List of active suppliers
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
 *                         $ref: '#/components/schemas/Supplier'
 *   post:
 *     summary: Create a new supplier
 *     tags: [Suppliers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Raju Flowers
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *     responses:
 *       201:
 *         description: Supplier created
 *       422:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/suppliers/map-product:
 *   post:
 *     summary: Map one or more suppliers to a product with priority order
 *     tags: [Suppliers]
 *     description: |
 *       Priority 1 = first supplier to be contacted by auto-order.
 *       If priority 1 says "not available", the system escalates to priority 2, and so on.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product_id, suppliers]
 *             properties:
 *               product_id:
 *                 type: string
 *                 format: uuid
 *               suppliers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [supplier_id]
 *                   properties:
 *                     supplier_id:
 *                       type: string
 *                       format: uuid
 *                     priority:
 *                       type: integer
 *                       example: 1
 *           example:
 *             product_id: "uuid-of-product"
 *             suppliers:
 *               - supplier_id: "uuid-supplier-1"
 *                 priority: 1
 *               - supplier_id: "uuid-supplier-2"
 *                 priority: 2
 *     responses:
 *       200:
 *         description: Suppliers mapped successfully
 *       422:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/suppliers/{id}:
 *   delete:
 *     summary: Archive (soft-delete) a supplier
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Supplier archived
 *       404:
 *         description: Supplier not found
 */
