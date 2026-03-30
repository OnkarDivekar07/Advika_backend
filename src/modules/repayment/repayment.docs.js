/**
 * @swagger
 * tags:
 *   name: Repayments
 *   description: Supplier repayment tracking
 */

/**
 * @swagger
 * /api/repayments:
 *   get:
 *     summary: Get all repayments
 *     tags: [Repayments]
 *     responses:
 *       200:
 *         description: List of all repayments
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
 *                         $ref: '#/components/schemas/Repayment'
 *   post:
 *     summary: Create a new repayment record
 *     tags: [Repayments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [supplierName, contactDetails, amountOwed, dueDate]
 *             properties:
 *               supplierName:
 *                 type: string
 *                 example: Raju Flowers
 *               contactDetails:
 *                 type: string
 *                 example: 9876543210
 *               amountOwed:
 *                 type: number
 *                 example: 5000
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-04-15"
 *     responses:
 *       201:
 *         description: Repayment created
 *       422:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/repayments/{id}:
 *   get:
 *     summary: Get a single repayment by ID
 *     tags: [Repayments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Repayment record
 *       404:
 *         description: Not found
 *   put:
 *     summary: Update a repayment record
 *     tags: [Repayments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               supplierName: { type: string }
 *               contactDetails: { type: string }
 *               amountOwed: { type: number }
 *               dueDate: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Updated repayment
 *       404:
 *         description: Not found
 *   delete:
 *     summary: Delete a repayment record
 *     tags: [Repayments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Repayment deleted
 *       404:
 *         description: Not found
 */
